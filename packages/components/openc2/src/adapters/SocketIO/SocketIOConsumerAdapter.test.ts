/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Control } from '@mdf.js/openc2-core';
import { SocketIOConsumerAdapter } from './SocketIOConsumerAdapter';

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
      const adapter = new SocketIOConsumerAdapter({
        id: 'myId',
        separator: ':',
      });
      expect(adapter).toBeInstanceOf(SocketIOConsumerAdapter);
      expect(adapter.name).toEqual('myId');
      //@ts-ignore - Testing private property
      expect(adapter.separator).toEqual(':');
      //@ts-ignore - Testing private property
      expect(adapter.subscriptions).toEqual(['oc2:cmd:all', 'oc2:cmd:device:myId']);
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
      const adapter = new SocketIOConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      expect(adapter).toBeInstanceOf(SocketIOConsumerAdapter);
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
    it('Should subscribe/unsubcribe the instance properly', async () => {
      const adapter = new SocketIOConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {};
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.all')).toBeFalsy();
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.device.myId')).toBeFalsy();
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.ap.actuator1')).toBeFalsy();
      //@ts-ignore - Testing private property
      expect(adapter.handler).toBeUndefined();

      await adapter.subscribe(myHandler);
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.all')).toBeTruthy();
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.device.myId')).toBeTruthy();
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.ap.actuator1')).toBeTruthy();
      //@ts-ignore - Testing private property
      expect(adapter.handler).toEqual(myHandler);

      await adapter.unsubscribe(myHandler);
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.all')).toBeFalsy();
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.device.myId')).toBeFalsy();
      //@ts-ignore - Testing private property
      expect(adapter.provider.client.hasListeners('oc2.cmd.ap.actuator1')).toBeFalsy();
      //@ts-ignore - Testing private property
      expect(adapter.handler).toBeUndefined();
    }, 300);
    it('Should process incoming messages properly and publish the response FOR ONE DESTINATION', done => {
      const adapter = new SocketIOConsumerAdapter({
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
      const acknowledge = (message: Control.ResponseMessage) => {
        expect(message).toEqual(RESPONSE);
        done();
      };
      //@ts-ignore - Testing private property
      adapter.subscriptionAdapter(COMMAND, acknowledge);
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should reject if there is a problem starting/stopping', done => {
      const adapter = new SocketIOConsumerAdapter({ id: 'myId' });
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
    it('Should emit an error if the consumer report an error', done => {
      const adapter = new SocketIOConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {
        done(new Error('myError'));
      };
      const acknowledge = (message: Control.ResponseMessage) => {
        expect(message).toEqual(RESPONSE);
      };
      adapter.on('error', error => {
        expect(error.message).toEqual('myError');
        done();
      });
      adapter.subscribe(myHandler).then();
      //@ts-ignore - Testing private property
      adapter.subscriptionAdapter(COMMAND, acknowledge);
    }, 300);
    it('Should emit an error if there is a problem in the handler', done => {
      const adapter = new SocketIOConsumerAdapter({
        id: 'myId',
        actuators: ['actuator1'],
      });
      const myHandler = (
        message: Control.CommandMessage,
        done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
      ) => {
        throw new Error('myError');
      };
      const acknowledge = (message: Control.ResponseMessage) => {
        expect(message).toEqual(RESPONSE);
      };
      adapter.on('error', error => {
        expect(error.message).toEqual(
          'Error performing the adaptation of the incoming message: myError'
        );
        done();
      });
      adapter.subscribe(myHandler).then();
      //@ts-ignore - Testing private property
      adapter.subscriptionAdapter(COMMAND, acknowledge);
    }, 300);
  });
});
