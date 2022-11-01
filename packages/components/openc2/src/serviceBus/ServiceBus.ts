/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */
import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Accessors, Control } from '@mdf.js/openc2-core';
import { SocketIOServer } from '@mdf.js/socket-server-provider';
import EventEmitter from 'events';
import os from 'os';
import { Namespace, Socket } from 'socket.io';
import { v4 } from 'uuid';
import { SocketIOServerOptions } from '../types';
import { AddressMapper } from './AddressMapper';
import { Events } from './Events';
import { AuthZ, Check } from './middlewares';

const ALLOWED_DISCONNECT_REASONS = [
  'server namespace disconnect',
  'client namespace disconnect',
  'server shutting down',
];

const SUBJECT = 'Socket.IO OpenC2';

export declare interface ServiceBus {
  /** Emitted when a server operation has some problem */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
}

export interface ServiceBusOptions {
  /** Define the use of JWT tokens for client authentication */
  useJwt?: boolean;
  /** Secret used in JWT token validation */
  secret?: string;
}
export class ServiceBus extends EventEmitter implements Health.Component {
  /** Component identification */
  public readonly componentId: string = v4();
  /** Socket.IO server instance */
  private readonly instance: SocketIOServer.Provider;
  /** OpenC2 Namespace */
  private readonly oc2Namespace: Namespace;
  /** Address mapper */
  private readonly addressMapper: AddressMapper;
  /**
   * Create a new ServiceBus instance
   * @param serverOptions - Socket.IO server options
   * @param options - Socket.IO client configuration options
   * @param name - name of the service bus
   */
  constructor(
    serverOptions: SocketIOServerOptions,
    options: ServiceBusOptions,
    public readonly name: string
  ) {
    super();
    this.addressMapper = new AddressMapper();
    this.instance = SocketIOServer.Factory.create({
      config: { ...serverOptions, transports: ['websocket'] },
      name,
    });
    this.oc2Namespace = this.instance.client.of('/openc2');
    this.oc2Namespace.use(Check.handler());
    if (options.useJwt) {
      this.oc2Namespace.use(AuthZ.handler({ secret: options.secret }));
    }
    this.oc2Namespace.on('connection', this.onConnectionEventOC2Namespace.bind(this));
    this.instance.on('error', this.onErrorHandler.bind(this));
    this.instance.on('status', this.onStatusHandler.bind(this));
  }
  /**
   * Connection event handler for the OpenC2 namespace
   * @param socket - socket to be configured
   */
  private readonly onConnectionEventOC2Namespace = (socket: Socket): void => {
    this.addressMapper.update(socket.id, socket.handshake.auth['nodeId']);
    if (socket.handshake.auth['type'] === 'producer') {
      socket.join('producer');
    } else if (socket.handshake.auth['type'] === 'consumer') {
      socket.join('consumer');
      for (const actuator of socket.handshake.auth['actuators']) {
        socket.join(actuator);
      }
    }
    socket.onAny(this.eventHandler.bind(this));
    socket.on('disconnect', this.onDisconnectEvent.bind(this));
  };
  /**
   * Manage the incoming commands events from provider
   * @param event - event name
   * @param command - command message from provider
   * @param callback - callback function, used as acknowledgement
   */
  private readonly eventHandler = (
    event: string,
    command: Control.CommandMessage,
    callback: (responses: Control.ResponseMessage[]) => void
  ) => {
    const wrappedCallback = (error: Error | null, responses: Control.ResponseMessage[]) => {
      if (error) {
        this.onErrorHandler(
          new Crash(
            `Error in the acknowledgement callback function: ${error.message}`,
            this.componentId,
            { info: { event, command, subject: SUBJECT } }
          )
        );
      } else if (!responses || (Array.isArray(responses) && responses.length === 0)) {
        this.onErrorHandler(
          new Crash(
            'No responses returned in the acknowledgement callback function',
            this.componentId,
            { info: { event, command, subject: SUBJECT } }
          )
        );
      } else {
        callback(responses);
      }
    };
    // Command to oc2/cmd/all is sent to all consumers
    if (Events.isGeneralCommandEvent(event)) {
      this.oc2Namespace
        .in('consumer')
        .timeout(Accessors.getDelayFromCommandMessage(command))
        .emit(event, command, wrappedCallback);
    }
    // Command to oc2/cmd/ap/[actuator_profile] is sent to consumers that have this profile
    else if (Events.isActuatorCommandEvent(event)) {
      this.oc2Namespace
        .in(Events.getActuatorFromCommandEvent(event))
        .timeout(Accessors.getDelayFromCommandMessage(command))
        .emit(event, command, wrappedCallback);
    }
    // Command to oc2/cmd/device/[device_id] is sent to the consumer that has this id
    else if (Events.isDeviceCommandEvent(event)) {
      const openC2Id = Events.getDeviceFromCommandEvent(event);
      const socketId = this.addressMapper.getByOpenC2Id(openC2Id);
      if (socketId) {
        this.oc2Namespace
          .to(socketId)
          .timeout(Accessors.getDelayFromCommandMessage(command))
          .emit(event, command, wrappedCallback);
      }
    } else {
      this.onErrorHandler(
        new Crash(
          `Invalid command from or message in OpenC2 Socket.IO Server: ${event}`,
          this.componentId,
          { info: { event, command, subject: SUBJECT } }
        )
      );
    }
  };
  /** Socket disconnection handler */
  private readonly onDisconnectEvent = (socketId: string): ((reason: string) => void) => {
    return (reason: string) => {
      const openC2Id = this.addressMapper.getBySocketId(socketId);
      const error = this.disconnectReasonToCrashError(reason, openC2Id || 'unknown');
      this.addressMapper.delete(socketId);
      if (error) {
        this.onErrorHandler(error);
      }
    };
  };
  /**
   * Transforms the disconnection reason in a Crash if its an unmanaged reason
   * @param reason - reason for the error
   * @param openC2Id - openC2 identification
   * @returns
   */
  private disconnectReasonToCrashError(reason: string, openC2Id: string): Crash | undefined {
    if (!ALLOWED_DISCONNECT_REASONS.includes(reason)) {
      return new Crash(
        `OpenC2 node ${openC2Id} has been disconnected due to: ${reason}`,
        this.componentId,
        { info: { openC2Id: openC2Id, subject: SUBJECT } }
      );
    } else {
      return undefined;
    }
  }
  /**
   * Manage the error in the service bus
   * @param error - error to be processed
   */
  private readonly onErrorHandler = (error: unknown) => {
    const crash = Crash.from(error);
    if (this.listenerCount('error') > 0) {
      this.emit('error', crash);
    }
  };
  /**
   * Manage the status change in the service bus
   * @param status - status to be processed
   */
  private readonly onStatusHandler = (status: Health.API.Status): void => {
    if (this.listenerCount('status') > 0) {
      this.emit('status', status);
    }
  };
  /** Start the underlayer Socket.IO server */
  public start(): Promise<void> {
    return this.instance.start();
  }
  /** Close the server and disconnect all the actual connections */
  public stop(): Promise<void> {
    this.instance.client.disconnectSockets();
    return this.instance.stop();
  }
  /**
   * Return the status of the server in a standard format
   * @returns _check object_ as defined in the draft standard
   * https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-05
   */
  public get checks(): Health.API.Checks {
    return {
      ...this.instance.checks,
      [`${this.name}:serverStats`]: [
        {
          componentId: this.componentId,
          componentName: this.name,
          componentType: 'server',
          observedValue: {
            hostname: os.hostname(),
            pid: process.pid,
            uptime: process.uptime(),
            clientsCount: this.instance.client.engine.clientsCount,
            pollingClientsCount: this.instance.client._pollingClientsCount,
            namespaces: Array.from(this.instance.client._nsps.values()).map(nsp => ({
              name: nsp.name,
              socketsCount: nsp.sockets.size,
            })),
          },
          observedUnit: 'stats',
          status: 'pass',
          time: new Date().toISOString(),
        },
      ],
    };
  }
}
