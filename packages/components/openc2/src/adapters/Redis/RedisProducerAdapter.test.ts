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
import { RedisProducerAdapter } from './RedisProducerAdapter';

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
describe('#RedisProducerAdapter', () => {
  describe('#Happy path', () => {
    it('Should create a valid instance', () => {
      const adapter = new RedisProducerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
        separator: ':',
      });
      expect(adapter).toBeInstanceOf(RedisProducerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual(':');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual(['oc2:rsp', 'oc2:rsp:myId']);
      //@ts-ignore - Testing private property
      expect(adapter.publisher).toBeDefined();
      //@ts-ignore - Testing private property
      expect(adapter.subscriber).toBeDefined();
      const checks = adapter.checks;
      expect(checks).toEqual({
        'myId-publisher:status': [
          {
            componentId: checks['myId-publisher:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myId-publisher:status'][0].time,
          },
        ],
        'myId-subscriber:status': [
          {
            componentId: checks['myId-subscriber:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myId-subscriber:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should start/stop the instance properly', async () => {
      const adapter = new RedisProducerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      expect(adapter).toBeInstanceOf(RedisProducerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual('.');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual(['oc2.rsp', 'oc2.rsp.myId']);
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.publisher, 'start').mockResolvedValue();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.subscriber, 'start').mockResolvedValue();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.subscriber.client, 'psubscribe').mockResolvedValue();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.publisher, 'stop').mockResolvedValue();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.subscriber, 'stop').mockResolvedValue();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.subscriber.client, 'punsubscribe').mockResolvedValue();
      const checks = adapter.checks;
      expect(checks).toEqual({
        'myId-publisher:status': [
          {
            componentId: checks['myId-publisher:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myId-publisher:status'][0].time,
          },
        ],
        'myId-subscriber:status': [
          {
            componentId: checks['myId-subscriber:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['myId-subscriber:status'][0].time,
          },
        ],
      });
      await adapter.start();
      await adapter.stop();
    }, 300);
    it('Should publish message properly to all the nodes', done => {
      const adapter = new RedisProducerAdapter({ id: 'myId' });
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.publisher.client, 'publish')
        .mockImplementation((channel: string | Buffer, message: string | Buffer) => {
          expect(channel).toEqual('oc2.cmd.all');
          expect(message).toEqual(JSON.stringify(COMMAND));
          done();
          return Promise.resolve(1);
        });
      adapter.publish(COMMAND).then();
    }, 300);
    it('Should publish message properly tos single node and actuators', done => {
      const adapter = new RedisProducerAdapter({ id: 'myId' });
      let messages = 0;
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.publisher.client, 'publish')
        .mockImplementation((channel: string | Buffer, message: string | Buffer) => {
          messages++;
          expect(
            ['oc2.cmd.ap.myActuator', 'oc2.cmd.device.actuator1'].includes(channel as string)
          ).toBeTruthy();
          expect(message).toEqual(
            JSON.stringify({
              ...COMMAND,
              to: ['actuator1'],
              content: { ...COMMAND.content, actuator: { myActuator: {} } },
            })
          );
          if (messages === 2) {
            done();
          }
          return Promise.resolve(1);
        });
      adapter
        .publish({
          ...COMMAND,
          to: ['actuator1'],
          content: { ...COMMAND.content, actuator: { myActuator: {} } },
        })
        .then();
    }, 300);
    it('Should process incoming responses properly', done => {
      const adapter = new RedisProducerAdapter({ id: 'myId' });
      adapter.on(RESPONSE.request_id, (response: Control.ResponseMessage) => {
        expect(response).toEqual(RESPONSE);
        done();
      });
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit('pmessage', 'oc2.rsp', 'oc2.rsp', JSON.stringify(RESPONSE));
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should start/stop the instance properly', done => {
      const adapter = new RedisProducerAdapter({ id: 'myId' });

      //@ts-ignore - Testing private property
      jest.spyOn(adapter.publisher, 'start').mockRejectedValue(new Error('myError'));
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.publisher, 'stop').mockRejectedValue(new Error('myError'));
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
      const adapter = new RedisProducerAdapter({ id: 'myId' });
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.publisher.client, 'publish').mockRejectedValue(new Error('myError'));
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
    it('Should emit an error if there is a problem processing incoming responses', done => {
      const adapter = new RedisProducerAdapter({ id: 'myId' });
      adapter.on('error', error => {
        expect(error.message).toEqual(
          'Error performing the adaptation of the incoming message: Unexpected end of JSON input'
        );
        done();
      });
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit('pmessage', 'oc2.rsp', 'oc2.rsp', '{');
    }, 300);
  });
});
