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

import { Crash } from '@mdf/crash';
import { Accessors, Control } from '@mdf/openc2-core';
import { EventEmitter } from 'stream';
import { v4 } from 'uuid';
import {
  AdapterOptions,
  OC2_TOPIC_COMMAND_PREFIX,
  OC2_TOPIC_PREFIX,
  OC2_TOPIC_RESPONSE_PREFIX,
  OC2_TOPIC_SEPARATOR,
} from '../types';

export class Adapter extends EventEmitter {
  /** Component identification */
  public readonly componentId = v4();
  /** Channel scope separator */
  protected readonly separator: string;
  /** Array of topics through which the adapter will listen for commands/responses */
  protected readonly subscriptions: string[];
  /**
   * Create a new OpenC2 adapter for Redis
   * @param adapterOptions - Adapter configuration options
   * @param type - component type
   */
  constructor(
    protected readonly adapterOptions: AdapterOptions,
    private readonly type: 'producer' | 'consumer'
  ) {
    super();
    this.separator = adapterOptions.separator ?? OC2_TOPIC_SEPARATOR;
    this.subscriptions = this.defineSubscriptions(
      this.type,
      adapterOptions.id,
      adapterOptions.actuators
    );
  }
  /** Component name */
  public get name(): string {
    return this.adapterOptions.id;
  }
  /**
   * Manage the error in the adapter interface
   * @param error - error to be processed
   */
  protected onErrorHandler(error: unknown): void {
    const crash = Crash.from(error);
    if (this.listenerCount('error') > 0) {
      this.emit('error', crash);
    }
  }
  /**
   * Returns an array of topics through which the message will be sent
   * @param message - message to be sent
   * @returns
   */
  protected defineTopics(message: Control.Message): string[] {
    if (message.msg_type === 'response') {
      return this.defineTopicsForResponse(message.to);
    } else {
      return this.defineTopicsForCommands(
        message.to,
        Accessors.getActuatorsFromCommandMessage(message)
      );
    }
  }
  /**
   * Returns an array of topics through which the adapter will listen for commands/responses
   * @param type - component type
   * @param id - instance identification
   * @param actuators - actuators
   */
  private defineSubscriptions(
    type: 'consumer' | 'producer',
    id: string,
    actuators: string[] = []
  ): string[] {
    const subscriptions: string[] = [];
    if (type === 'consumer') {
      subscriptions.push(this.getGeneralCommandTopic());
      subscriptions.push(this.getDeviceCommandTopic(id));
      for (const actuator of actuators) {
        subscriptions.push(this.getActuatorCommandTopic(actuator));
      }
    } else if (type === 'producer') {
      subscriptions.push(this.getGeneralResponseTopic());
      subscriptions.push(this.getProducerResponseTopic(id));
    }
    return subscriptions;
  }
  /**
   * Returns an array of topics through which the message will be sent
   * @param to - Desired destinations of the message
   * @returns
   */
  private defineTopicsForResponse(to: string[]): string[] {
    const topics: string[] = [];
    if (to.includes('*')) {
      topics.push(this.getGeneralResponseTopic());
    } else {
      for (const producer of to) {
        topics.push(this.getProducerResponseTopic(producer));
      }
    }
    return topics;
  }
  /**
   * Returns an array of topics through which the message will be sent
   * @param to - Desired destinations of the message
   * @param actuators - Actuators
   * @returns
   */
  private defineTopicsForCommands(to: string[], actuators: string[]): string[] {
    const topics: string[] = [];
    if (to.includes('*') && actuators.length === 0) {
      topics.push(this.getGeneralCommandTopic());
    } else {
      for (const actuator of actuators) {
        topics.push(this.getActuatorCommandTopic(actuator));
      }
      for (const device of to) {
        topics.push(this.getDeviceCommandTopic(device));
      }
    }
    return topics;
  }
  /**
   * Returns the OpenC2 topic used to send responses for all nodes
   * @returns
   */
  private getGeneralResponseTopic(): string {
    return `${OC2_TOPIC_PREFIX}${this.separator}${OC2_TOPIC_RESPONSE_PREFIX}`;
  }
  /**
   * Returns the OpenC2 topic used to send responses to a concrete producer
   * @param producer - producer
   * @returns
   */
  private getProducerResponseTopic(producer: string): string {
    return `${OC2_TOPIC_PREFIX}${this.separator}${OC2_TOPIC_RESPONSE_PREFIX}${this.separator}${producer}`;
  }
  /**
   * Returns the OpenC2 topic used to receive commands for all nodes
   * @returns
   */
  private getGeneralCommandTopic(): string {
    return `${OC2_TOPIC_PREFIX}${this.separator}${OC2_TOPIC_COMMAND_PREFIX}${this.separator}all`;
  }
  /**
   * Returns the OpenC2 topic used to receive commands for a concrete actuator
   * @param actuator - Actuator
   * @returns
   */
  private getActuatorCommandTopic(actuator: string): string {
    return `${OC2_TOPIC_PREFIX}${this.separator}${OC2_TOPIC_COMMAND_PREFIX}${this.separator}ap${this.separator}${actuator}`;
  }
  /**
   * Returns the OpenC2 topic used to receive commands for a concrete device
   * @param actuator - Actuator
   * @returns
   */
  private getDeviceCommandTopic(device: string): string {
    return `${OC2_TOPIC_PREFIX}${this.separator}${OC2_TOPIC_COMMAND_PREFIX}${this.separator}device${this.separator}${device}`;
  }
}
