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

import { Control } from '@mdf.js/openc2-core';
import { SocketIOProducerAdapter } from './SocketIOProducerAdapter';

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

describe('#SocketIOProducerAdapter', () => {
  describe('#Happy path', () => {
    it('Should create a valid instance', () => {
      const adapter = new SocketIOProducerAdapter({
        id: 'myId',
        separator: ':',
      });
      expect(adapter).toBeInstanceOf(SocketIOProducerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual(':');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual(['oc2:rsp', 'oc2:rsp:myId']);
      //@ts-ignore - Testing private property
      expect(adapter.provider).toBeDefined();
      const checks = adapter.checks;
      expect(checks).toEqual({
        'myId:status': [
          {
            componentId: checks['myId:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myId:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should start/stop the instance properly', async () => {
      const adapter = new SocketIOProducerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      expect(adapter).toBeInstanceOf(SocketIOProducerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual('.');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual(['oc2.rsp', 'oc2.rsp.myId']);
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.provider, 'start').mockResolvedValue();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.provider, 'stop').mockResolvedValue();
      const checks = adapter.checks;
      expect(checks).toEqual({
        'myId:status': [
          {
            componentId: checks['myId:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myId:status'][0].time,
          },
        ],
      });
      await adapter.start();
      await adapter.stop();
    }, 300);
    it('Should publish message properly to all the nodes', done => {
      const adapter = new SocketIOProducerAdapter({ id: 'myId' });
      const mock = {
        emit: (
          topic: string,
          message: Control.CommandMessage,
          adapter: (
            error: Error | null,
            incomingMessage: Control.ResponseMessage | Control.ResponseMessage[]
          ) => void
        ) => {
          expect(topic).toEqual('oc2.cmd.all');
          expect(message).toEqual(COMMAND);
          adapter(null, [RESPONSE]);
          done();
        },
      };
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.provider.client, 'timeout')
        //@ts-ignore - Testing private property
        .mockImplementation(timeout => {
          expect(timeout).toEqual(150);
          return mock;
        });
      adapter.publish(COMMAND).then();
    }, 300);
    it('Should publish message properly to one node', done => {
      const adapter = new SocketIOProducerAdapter({ id: 'myId' });
      const mock = {
        emit: (
          topic: string,
          message: Control.CommandMessage,
          adapter: (
            error: Error | null,
            incomingMessage: Control.ResponseMessage | Control.ResponseMessage[]
          ) => void
        ) => {
          expect(topic).toEqual('oc2.cmd.all');
          expect(message).toEqual(COMMAND);
          adapter(null, RESPONSE);
          done();
        },
      };
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.provider.client, 'timeout')
        //@ts-ignore - Testing private property
        .mockImplementation(timeout => {
          expect(timeout).toEqual(150);
          return mock;
        });
      adapter.publish(COMMAND).then();
    }, 300);
  });
  describe('#Sada path', () => {
    it('Should start/stop the instance properly', done => {
      const adapter = new SocketIOProducerAdapter({ id: 'myId' });

      //@ts-ignore - Testing private property
      jest.spyOn(adapter.provider, 'start').mockRejectedValue(new Error('myError'));
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.provider, 'stop').mockRejectedValue(new Error('myError'));
      adapter
        .start()
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error.message).toEqual(
            'Error performing the subscription to OpenC2 topics: myError'
          );
        });
      adapter
        .stop()
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error.message).toEqual(
            'Error performing the unsubscription to OpenC2 topics: myError'
          );
          done();
        });
    }, 300);
    it('Should rejects if there is a problem publishing a message', done => {
      const adapter = new SocketIOProducerAdapter({ id: 'myId' });
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.provider.client, 'timeout')
        //@ts-ignore - Testing private property
        .mockImplementation(() => {
          throw new Error('myError');
        });
      adapter
        .publish(COMMAND)
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error.message).toEqual('Error performing the publication of the message: myError');
          done();
        });
    }, 300);
    it('Should emit an error if the consumer report an error in the ack', done => {
      const adapter = new SocketIOProducerAdapter({ id: 'myId' });
      adapter.on('error', error => {
        expect(error.message).toEqual('myError');
        done();
      });
      const mock = {
        emit: (
          topic: string,
          message: Control.CommandMessage,
          adapter: (
            error: Error | null,
            incomingMessage: Control.ResponseMessage | Control.ResponseMessage[]
          ) => void
        ) => {
          expect(topic).toEqual('oc2.cmd.all');
          expect(message).toEqual(COMMAND);
          adapter(new Error('myError'), RESPONSE);
        },
      };
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.provider.client, 'timeout')
        //@ts-ignore - Testing private property
        .mockImplementation(timeout => {
          expect(timeout).toEqual(150);
          return mock;
        });
      adapter.publish(COMMAND).then();
    }, 300);
    it('Should emit an error if the consumer not return an response', done => {
      const adapter = new SocketIOProducerAdapter({ id: 'myId' });
      adapter.on('error', error => {
        expect(error.message).toEqual(
          "No response was received, but we didn't receive any error either, check the consumers"
        );
        done();
      });
      const mock = {
        emit: (
          topic: string,
          message: Control.CommandMessage,
          adapter: (
            error: Error | null,
            incomingMessage: Control.ResponseMessage | Control.ResponseMessage[]
          ) => void
        ) => {
          expect(topic).toEqual('oc2.cmd.all');
          expect(message).toEqual(COMMAND);
          //@ts-ignore - Testing private property
          adapter(null, undefined);
        },
      };
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.provider.client, 'timeout')
        //@ts-ignore - Testing private property
        .mockImplementation(timeout => {
          expect(timeout).toEqual(150);
          return mock;
        });
      adapter.publish(COMMAND).then();
    }, 300);
  });
});
