/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Control } from '@mdf.js/openc2-core';
import { mockProperty, undoMocks } from '@mdf.js/utils';
import { ServiceBus } from './ServiceBus';

const COMMAND: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Query,
    target: {
      'x-netin:alarms': { entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' },
    },
    command_id: 'myCommandId',
    args: {
      duration: 50,
    },
  },
};
const RESPONSE: Control.ResponseMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Response,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myConsumer',
  to: ['myProducer'],
  status: Control.StatusCode.OK,
  content: {
    status: Control.StatusCode.OK,
    results: {},
  },
};

describe('#ServiceBus', () => {
  describe('#Happy path', () => {
    it('Should create a valid instance', () => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      expect(serviceBus).toBeDefined();
      expect(serviceBus.name).toEqual('myServiceBus');
      //@ts-ignore - private property
      expect(serviceBus.oc2Namespace).toBeDefined();
      //@ts-ignore - private property
      expect(serviceBus.instance.listenerCount('error')).toEqual(1);
      //@ts-ignore - private property
      expect(serviceBus.instance.listenerCount('status')).toEqual(1);
      const checks = serviceBus.checks;
      expect(checks).toEqual({
        'myServiceBus:serverStats': [
          {
            componentId: checks['myServiceBus:serverStats'][0].componentId,
            componentName: 'myServiceBus',
            componentType: 'server',
            observedUnit: 'stats',
            observedValue: {
              clientsCount: 0,
              hostname: checks['myServiceBus:serverStats'][0].observedValue.hostname,
              namespaces: [
                {
                  name: '/',
                  socketsCount: 0,
                },
                {
                  name: '/admin',
                  socketsCount: 0,
                },
                {
                  name: '/openc2',
                  socketsCount: 0,
                },
              ],
              pid: checks['myServiceBus:serverStats'][0].observedValue.pid,
              pollingClientsCount: 0,
              uptime: checks['myServiceBus:serverStats'][0].observedValue.uptime,
            },
            status: 'pass',
            time: checks['myServiceBus:serverStats'][0].time,
          },
        ],
        'myServiceBus:status': [
          {
            componentId: checks['myServiceBus:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myServiceBus:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should emit status if the underlayer socket.IO server emit status', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      serviceBus.on('status', status => {
        expect(status).toEqual('pass');
        done();
      });
      //@ts-ignore - private property
      serviceBus.instance.emit('status', 'pass');
    }, 300);
    it('Should start/stop properly', async () => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      //@ts-ignore - private property
      jest.spyOn(serviceBus.instance, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(serviceBus.instance.client, 'disconnectSockets').mockReturnValue();
      //@ts-ignore - private property
      jest.spyOn(serviceBus.instance, 'stop').mockResolvedValue();
      await serviceBus.start();
      await serviceBus.stop();
    }, 300);
    it('Should manage connection of new producer sockets', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const socket = {
        id: 'mySocketId',
        handshake: {
          auth: {
            nodeId: 'myNodeId',
            type: 'producer',
          },
        },
        join: (room: string) => {
          expect(room).toEqual('producer');
        },
        onAny: () => {},
        on(event: string, callback: () => void) {
          expect(event).toEqual('disconnect');
          done();
        },
      };
      //@ts-ignore - private property
      serviceBus.onConnectionEventOC2Namespace(socket);
    }, 300);
    it('Should manage connection of new consumer sockets', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const socket = {
        id: 'mySocketId',
        handshake: {
          auth: {
            nodeId: 'myNodeId',
            type: 'consumer',
            actuators: ['actuator1', 'actuator2'],
          },
        },
        join: (room: string) => {
          expect(['consumer', 'actuator1', 'actuator2'].includes(room)).toBeTruthy();
        },
        onAny: () => {},
        on(event: string, callback: () => void) {
          expect(event).toEqual('disconnect');
          done();
        },
      };
      //@ts-ignore - private property
      serviceBus.onConnectionEventOC2Namespace(socket);
    }, 300);
    it('Should manage disconnection of new sockets', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const socket = {
        id: 'mySocketId',
        handshake: {
          auth: {
            nodeId: 'myNodeId',
            type: 'consumer',
            actuators: ['actuator1', 'actuator2'],
          },
        },
        join: (room: string) => {
          expect(['consumer', 'actuator1', 'actuator2'].includes(room)).toBeTruthy();
        },
        onAny: () => {},
        on(event: string, callback: () => void) {
          expect(event).toEqual('disconnect');
        },
      };
      //@ts-ignore - private property
      serviceBus.onConnectionEventOC2Namespace(socket);
      //@ts-ignore - private property
      expect(serviceBus.addressMapper.getBySocketId('mySocketId')).toEqual('myNodeId');
      //@ts-ignore - private property
      serviceBus.onDisconnectEvent('mySocketId')('server shutting down');
      //@ts-ignore - private property
      expect(serviceBus.addressMapper.getBySocketId('mySocketId')).toBeUndefined();
      done();
    }, 300);
    it('Should manage new general events properly', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const callback = (responses: Control.ResponseMessage[]) => {
        expect(responses).toEqual([RESPONSE]);
        undoMocks();
        done();
      };
      class Mock {
        in = (room: string) => {
          expect(room).toEqual('consumer');
          return this;
        };
        timeout = (time: number) => {
          expect(time).toEqual(50);
          return this;
        };
        emit = (
          event: string,
          command: Control.CommandMessage,
          callback: (error: Error | null, responses: Control.ResponseMessage[]) => void
        ) => {
          expect(event).toEqual('oc2.cmd.all');
          expect(command).toEqual(COMMAND);
          callback(null, [RESPONSE]);
        };
      }
      const mock = new Mock();
      //@ts-ignore - private property
      mockProperty(serviceBus, 'oc2Namespace', mock);
      //@ts-ignore - private property
      serviceBus.eventHandler('oc2.cmd.all', COMMAND, callback);
    }, 300);
    it('Should manage new actuator events properly', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const socket = {
        id: 'mySocketId',
        handshake: {
          auth: {
            nodeId: 'myNodeId',
            type: 'consumer',
            actuators: ['actuator1', 'actuator2'],
          },
        },
        join: (room: string) => {
          expect(['consumer', 'actuator1', 'actuator2'].includes(room)).toBeTruthy();
        },
        onAny: () => {},
        on(event: string, callback: () => void) {
          expect(event).toEqual('disconnect');
        },
      };
      //@ts-ignore - private property
      serviceBus.onConnectionEventOC2Namespace(socket);
      const callback = (responses: Control.ResponseMessage[]) => {
        expect(responses).toEqual([RESPONSE]);
        undoMocks();
        done();
      };
      class Mock {
        in = (room: string) => {
          expect(room).toEqual('actuator1');
          return this;
        };
        timeout = (time: number) => {
          expect(time).toEqual(50);
          return this;
        };
        emit = (
          event: string,
          command: Control.CommandMessage,
          callback: (error: Error | null, responses: Control.ResponseMessage[]) => void
        ) => {
          expect(event).toEqual('oc2.cmd.ap.actuator1');
          expect(command).toEqual(COMMAND);
          callback(null, [RESPONSE]);
        };
      }
      const mock = new Mock();
      //@ts-ignore - private property
      mockProperty(serviceBus, 'oc2Namespace', mock);
      //@ts-ignore - private property
      serviceBus.eventHandler('oc2.cmd.ap.actuator1', COMMAND, callback);
    }, 300);
    it('Should manage new actuator events properly', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const socket = {
        id: 'mySocketId',
        handshake: {
          auth: {
            nodeId: 'myNodeId',
            type: 'consumer',
            actuators: ['actuator1', 'actuator2'],
          },
        },
        join: (room: string) => {
          expect(['consumer', 'actuator1', 'actuator2'].includes(room)).toBeTruthy();
        },
        onAny: () => {},
        on(event: string, callback: () => void) {
          expect(event).toEqual('disconnect');
        },
      };
      //@ts-ignore - private property
      serviceBus.onConnectionEventOC2Namespace(socket);
      const callback = (responses: Control.ResponseMessage[]) => {
        expect(responses).toEqual([RESPONSE]);
        undoMocks();
        done();
      };
      class Mock {
        to = (socketId: string) => {
          expect(socketId).toEqual('mySocketId');
          return this;
        };
        timeout = (time: number) => {
          expect(time).toEqual(50);
          return this;
        };
        emit = (
          event: string,
          command: Control.CommandMessage,
          callback: (error: Error | null, responses: Control.ResponseMessage[]) => void
        ) => {
          expect(event).toEqual('oc2.cmd.device.myNodeId');
          expect(command).toEqual(COMMAND);
          callback(null, [RESPONSE]);
        };
      }
      const mock = new Mock();
      //@ts-ignore - private property
      mockProperty(serviceBus, 'oc2Namespace', mock);
      //@ts-ignore - private property
      serviceBus.eventHandler('oc2.cmd.device.myNodeId', COMMAND, callback);
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should manage disconnection of new sockets and emit an error if its not an allowed reason', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const socket = {
        id: 'mySocketId',
        handshake: {
          auth: {
            nodeId: 'myNodeId',
            type: 'consumer',
            actuators: ['actuator1', 'actuator2'],
          },
        },
        join: (room: string) => {
          expect(['consumer', 'actuator1', 'actuator2'].includes(room)).toBeTruthy();
        },
        onAny: () => {},
        on(event: string, callback: () => void) {
          expect(event).toEqual('disconnect');
        },
      };
      serviceBus.on('error', error => {
        expect(error.message).toEqual(
          'OpenC2 node myNodeId has been disconnected due to: not allowed reason'
        );
        done();
      });
      //@ts-ignore - private property
      serviceBus.onConnectionEventOC2Namespace(socket);
      //@ts-ignore - private property
      expect(serviceBus.addressMapper.getBySocketId('mySocketId')).toEqual('myNodeId');
      //@ts-ignore - private property
      serviceBus.onDisconnectEvent('mySocketId')('not allowed reason');
      //@ts-ignore - private property
      expect(serviceBus.addressMapper.getBySocketId('mySocketId')).toBeUndefined();
    }, 300);
    it('Should emit an error if there is a new event thant not match with consumers', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const callback = (responses: Control.ResponseMessage[]) => {};
      serviceBus.on('error', error => {
        expect(error.message).toEqual(
          'Invalid command from or message in OpenC2 Socket.IO Server: a'
        );
        done();
      });
      //@ts-ignore - private property
      serviceBus.eventHandler('a', COMMAND, callback);
    }, 300);
    it('Should emit an error if an error is received in the ack', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const callback = (responses: Control.ResponseMessage[]) => {
        expect(responses).toEqual([RESPONSE]);
      };
      serviceBus.on('error', error => {
        expect(error.message).toEqual('Error in the acknowledgement callback function: myError');
        undoMocks();
        done();
      });
      class Mock {
        in = (room: string) => {
          expect(room).toEqual('consumer');
          return this;
        };
        timeout = (time: number) => {
          expect(time).toEqual(50);
          return this;
        };
        emit = (
          event: string,
          command: Control.CommandMessage,
          callback: (error: Error | null, responses?: Control.ResponseMessage[]) => void
        ) => {
          expect(event).toEqual('oc2.cmd.all');
          expect(command).toEqual(COMMAND);
          callback(new Error('myError'), undefined);
        };
      }
      const mock = new Mock();
      //@ts-ignore - private property
      mockProperty(serviceBus, 'oc2Namespace', mock);
      //@ts-ignore - private property
      serviceBus.eventHandler('oc2.cmd.all', COMMAND, callback);
    }, 300);
    it('Should emit an error if no responses is received in the ack', done => {
      const serviceBus = new ServiceBus({}, { useJwt: true }, 'myServiceBus');
      const callback = (responses: Control.ResponseMessage[]) => {
        expect(responses).toEqual([RESPONSE]);
      };
      serviceBus.on('error', error => {
        expect(error.message).toEqual(
          'No responses returned in the acknowledgement callback function'
        );
        undoMocks();
        done();
      });
      class Mock {
        in = (room: string) => {
          expect(room).toEqual('consumer');
          return this;
        };
        timeout = (time: number) => {
          expect(time).toEqual(50);
          return this;
        };
        emit = (
          event: string,
          command: Control.CommandMessage,
          callback: (error: Error | null, responses?: Control.ResponseMessage[]) => void
        ) => {
          expect(event).toEqual('oc2.cmd.all');
          expect(command).toEqual(COMMAND);
          callback(null, undefined);
        };
      }
      const mock = new Mock();
      //@ts-ignore - private property
      mockProperty(serviceBus, 'oc2Namespace', mock);
      //@ts-ignore - private property
      serviceBus.eventHandler('oc2.cmd.all', COMMAND, callback);
    }, 300);
  });
});
