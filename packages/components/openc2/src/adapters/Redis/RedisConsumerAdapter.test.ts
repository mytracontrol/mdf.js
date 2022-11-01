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

import { Crash } from '@mdf.js/crash';
import { Control } from '@mdf.js/openc2-core';
import { RedisConsumerAdapter } from './RedisConsumerAdapter';

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

describe('#RedisConsumerAdapter', () => {
  describe('#Happy path', () => {
    it('Should create a valid instance', () => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
        separator: ':',
      });
      expect(adapter).toBeInstanceOf(RedisConsumerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual(':');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual([
        'oc2:cmd:all',
        'oc2:cmd:device:myId',
        'oc2:cmd:ap:actuator1',
      ]);
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
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      expect(adapter).toBeInstanceOf(RedisConsumerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual('.');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual([
        'oc2.cmd.all',
        'oc2.cmd.device.myId',
        'oc2.cmd.ap.actuator1',
      ]);
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
    it('Should subscribe/unsubcribe the instance properly', async () => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {};
      //@ts-ignore - Testing private property
      expect(adapter.subscriber.client.listenerCount('pmessage')).toEqual(0);
      //@ts-ignore - Testing private property
      expect(adapter.handler).toBeUndefined();

      await adapter.subscribe(myHandler);
      //@ts-ignore - Testing private property
      expect(adapter.subscriber.client.listenerCount('pmessage')).toEqual(1);
      //@ts-ignore - Testing private property
      expect(adapter.handler).toEqual(myHandler);

      await adapter.unsubscribe(myHandler);
      //@ts-ignore - Testing private property
      expect(adapter.handler).toBeUndefined();
      //@ts-ignore - Testing private property
      expect(adapter.subscriber.client.listenerCount('pmessage')).toEqual(0);
    }, 300);
    it('Should process incoming messages properly and publish the response FOR ONE DESTINATION', done => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {
        done(undefined, RESPONSE);
      };
      adapter.subscribe(myHandler).then();
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.publisher.client, 'publish')
        .mockImplementation((topic: string | Buffer, message: string | Buffer, cb?: any) => {
          expect(topic).toEqual('oc2.rsp.myProducer');
          expect(message).toEqual(JSON.stringify(RESPONSE));
          done();
          return Promise.resolve(1);
        });
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit(
        'pmessage',
        'oc2.cmd.all',
        'oc2.cmd.all',
        JSON.stringify(COMMAND)
      );

      adapter.unsubscribe(myHandler).then();
    }, 300);
    it('Should process incoming messages properly and publish the response FOR SEVERAL DESTINATIONS', done => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {
        done(undefined, { ...RESPONSE, to: ['*'] });
      };
      adapter.subscribe(myHandler).then();
      jest
        //@ts-ignore - Testing private property
        .spyOn(adapter.publisher.client, 'publish')
        .mockImplementation((topic: string | Buffer, message: string | Buffer, cb?: any) => {
          expect(topic).toEqual('oc2.rsp');
          expect(message).toEqual(JSON.stringify({ ...RESPONSE, to: ['*'] }));
          done();
          return Promise.resolve(1);
        });
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit(
        'pmessage',
        'oc2.cmd.all',
        'oc2.cmd.all',
        JSON.stringify(COMMAND)
      );

      adapter.unsubscribe(myHandler).then();
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should reject if there is a problem starting/stopping', done => {
      const adapter = new RedisConsumerAdapter({ id: 'myId' });

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
    it('Should emit an error if there is a problem publishing the response', done => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {
        done(undefined, RESPONSE);
      };
      adapter.on('error', error => {
        expect(error.message).toEqual('Error performing the publication of the message: myError');
        done();
      });
      adapter.subscribe(myHandler).then();
      //@ts-ignore - Testing private property
      jest.spyOn(adapter.publisher.client, 'publish').mockRejectedValue(new Error('myError'));
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit(
        'pmessage',
        'oc2.cmd.all',
        'oc2.cmd.all',
        JSON.stringify(COMMAND)
      );
    }, 300);
    it('Should emit an error if the consumer report an error', done => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {
        done(new Error('myError'));
      };
      adapter.on('error', error => {
        expect(error.message).toEqual('myError');
        done();
      });
      adapter.subscribe(myHandler).then();
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit(
        'pmessage',
        'oc2.cmd.all',
        'oc2.cmd.all',
        JSON.stringify(COMMAND)
      );
    }, 300);
    it('Should emit an error if there is a problem parsing the message', done => {
      const adapter = new RedisConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {};
      adapter.on('error', error => {
        expect(error.message).toEqual(
          'Error performing the adaptation of the incoming message: Unexpected end of JSON input'
        );
        done();
      });
      adapter.subscribe(myHandler).then();
      //@ts-ignore - Testing private property
      adapter.subscriber.client.emit('pmessage', 'oc2.cmd.all', 'oc2.cmd.all', '{');
    }, 300);
  });
});
