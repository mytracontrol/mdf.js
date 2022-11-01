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

import EventEmitter from 'events';
import { v4 } from 'uuid';
import { Control, ProducerAdapter, ProducerOptions } from '../../types';
import { Producer } from './Producer';

const options: ProducerOptions = {
  id: 'myId',
  registerLimit: 2,
  lookupInterval: 1000,
  lookupTimeout: 500,
};
class MyAdapter extends EventEmitter implements ProducerAdapter {
  name = 'myAdapter';
  componentId = v4();
  checks = {};
  publish(
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | Control.ResponseMessage[] | void> {
    this.emit('message', message);
    return Promise.resolve();
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
  stop(): Promise<void> {
    return Promise.resolve();
  }
  subcomponents = [];
  publishers = [];
  subscribers = [];
}
const COMMAND: Control.CommandMessage = {
  content_type: 'application/openc2',
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
describe('#OpenC2 #Producer', () => {
  describe('#Happy path', () => {
    it(`Should create a valid producer`, () => {
      const adapter = new MyAdapter();
      const producer = new Producer(adapter, options);
      expect(producer).toBeInstanceOf(Producer);
      expect(producer.links).toEqual({
        openc2: {
          jobs: '/openc2/jobs',
          pendingJobs: '/openc2/pendingJobs',
          messages: '/openc2/messages',
        },
      });
      expect(producer.router).toBeDefined();
      const checks = producer.checks;
      expect(checks).toEqual({
        'myAdapter:lastOperation': [
          {
            componentId: checks['myAdapter:lastOperation'][0].componentId,
            componentType: 'adapter',
            observedUnit: 'result of last operation',
            observedValue: 'ok',
            output: undefined,
            status: 'pass',
            time: undefined,
          },
        ],
        'myId:consumers': [],
        'myId:commands': [
          {
            componentId: checks['myId:commands'][0].componentId,
            componentType: 'source',
            observedUnit: 'pending commands',
            observedValue: 0,
            output: undefined,
            status: 'pass',
            time: checks['myId:commands'][0].time,
          },
        ],
      });
      //@ts-ignore - Test environment
      expect(producer.adapter.name).toEqual('myAdapter');
      //@ts-ignore - Test environment
      expect(producer.adapter.componentId).toBeDefined();
    }, 300);
    it(`Should start and stop properly`, async () => {
      const adapter = new MyAdapter();
      const producer = new Producer(adapter, options);
      //@ts-ignore - Test environment
      expect(producer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('status')).toEqual(0);
      //@ts-ignore - Test environment
      expect(producer.lookupTimer).toBeUndefined();
      await producer.start();
      //@ts-ignore - Test environment
      expect(producer.lookupTimer).toBeDefined();
      //@ts-ignore - Test environment
      expect(producer.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('status')).toEqual(1);
      await producer.start();
      //@ts-ignore - Test environment
      expect(producer.lookupTimer).toBeDefined();
      //@ts-ignore - Test environment
      expect(producer.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('status')).toEqual(1);
      await producer.stop();
      //@ts-ignore - Test environment
      expect(producer.lookupTimer).toBeUndefined();
      //@ts-ignore - Test environment
      expect(producer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('status')).toEqual(0);
      await producer.stop();
      //@ts-ignore - Test environment
      expect(producer.lookupTimer).toBeUndefined();
      //@ts-ignore - Test environment
      expect(producer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(producer.health.listenerCount('status')).toEqual(0);
      const checks = producer.checks;
      expect(checks).toEqual({
        'myAdapter:lastOperation': [
          {
            componentId: checks['myAdapter:lastOperation'][0].componentId,
            componentType: 'adapter',
            observedUnit: 'result of last operation',
            observedValue: 'ok',
            output: undefined,
            status: 'pass',
            time: checks['myAdapter:lastOperation'][0].time,
          },
        ],
        'myId:consumers': [],
        'myId:commands': [
          {
            componentId: checks['myId:commands'][0].componentId,
            componentType: 'source',
            observedUnit: 'pending commands',
            observedValue: 0,
            output: undefined,
            status: 'pass',
            time: checks['myId:commands'][0].time,
          },
        ],
      });
    }, 300);
    it(`Should try to publish a command several times if its rejected`, async () => {
      const adapter = new MyAdapter();
      jest
        .spyOn(adapter, 'publish')
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce();
      const producer = new Producer(adapter, {
        ...options,
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      producer.on('status', status => {
        expect(status).toEqual('fail');
        const checks = producer.checks;
        expect(checks).toEqual({
          'myId:commands': [
            {
              status: 'pass',
              componentId: checks['myId:commands'][0].componentId,
              componentType: 'source',
              observedValue: 0,
              observedUnit: 'pending commands',
              time: checks['myId:commands'][0].time,
              output: undefined,
            },
          ],
          'myAdapter:lastOperation': [
            {
              status: 'fail',
              componentId: checks['myAdapter:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedValue: 'error',
              observedUnit: 'result of last operation',
              time: checks['myAdapter:lastOperation'][0].time,
              output: ['Error: Error', 'caused by Error: Error'],
            },
          ],
          'myId:consumers': [],
        });
      });
      await producer.start();
      const messages = await producer.command({ ...COMMAND, created: new Date().getTime() });
      expect(messages).toHaveLength(0);
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should throw an error if the adapter is not valid`, () => {
      //@ts-ignore - Test environment
      expect(() => new Producer(undefined, options)).toThrowError(
        'AdapterWrapper requires an adapter instance'
      );
      //@ts-ignore - Test environment
      expect(() => new Producer({ name: 'myAdapter' }, options)).toThrowError(
        'Adapter myAdapter does not implement the publish method'
      );
    }, 300);
    it(`Should fail to command if not valid parameters are provided`, async () => {
      const adapter = new MyAdapter();
      const producer = new Producer(adapter, {
        ...options,
        lookupInterval: 0,
        lookupTimeout: 0,
        retryOptions: { attempts: 1 },
      });
      await producer.start();

      try {
        //@ts-ignore - Test environment
        await producer.command();
        throw new Error('Should not reach this point');
      } catch (error: any) {
        expect(error.message).toEqual('Invalid type of parameters in command creation');
      }
    }, 300);
    it(`Should fail to command if publish method rejects when the command is for several consumers`, done => {
      const adapter = new MyAdapter();
      jest.spyOn(adapter, 'publish').mockRejectedValue(new Error('Error'));
      const producer = new Producer(adapter, {
        ...options,
        lookupInterval: 0,
        lookupTimeout: 0,
        retryOptions: { attempts: 1 },
      });
      producer.on('status', status => {
        expect(status).toEqual('fail');
        const checks = producer.checks;
        expect(checks).toEqual({
          'myId:commands': [
            {
              status: 'pass',
              componentId: checks['myId:commands'][0].componentId,
              componentType: 'source',
              observedValue: 0,
              observedUnit: 'pending commands',
              time: checks['myId:commands'][0].time,
              output: undefined,
            },
          ],
          'myAdapter:lastOperation': [
            {
              status: 'fail',
              componentId: checks['myAdapter:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedValue: 'error',
              observedUnit: 'result of last operation',
              time: checks['myAdapter:lastOperation'][0].time,
              output: ['Error: Error', 'caused by Error: Error'],
            },
          ],
          'myId:consumers': [],
        });
      });
      producer
        .start()
        .then(() => producer.command({ ...COMMAND, created: new Date().getTime() }))
        .then(() => {
          throw new Error('Should not reach this point');
        })
        .catch(error => {
          expect(error.message).toEqual(
            'Error publishing command to control channel: Too much attempts [1], the promise will not be retried'
          );
          const checks = producer.checks;
          expect(checks).toEqual({
            'myId:commands': [
              {
                status: 'pass',
                componentId: checks['myId:commands'][0].componentId,
                componentType: 'source',
                observedValue: 0,
                observedUnit: 'pending commands',
                time: checks['myId:commands'][0].time,
                output: undefined,
              },
            ],
            'myAdapter:lastOperation': [
              {
                status: 'fail',
                componentId: checks['myAdapter:lastOperation'][0].componentId,
                componentType: 'adapter',
                observedValue: 'error',
                observedUnit: 'result of last operation',
                time: checks['myAdapter:lastOperation'][0].time,
                output: [
                  'CrashError: Error performing [mockConstructor] operation on myAdapter plug',
                  'caused by InterruptionError: Too much attempts [1], the promise will not be retried',
                  'caused by Error: Error',
                  'caused by Error: Error',
                ],
              },
            ],
            'myId:consumers': [],
          });
          done();
        });
    }, 300);
    it(`Should fail to command if publish method rejects when the command is for one consumer`, async () => {
      const adapter = new MyAdapter();
      jest.spyOn(adapter, 'publish').mockRejectedValue(new Error('Error'));
      const producer = new Producer(adapter, {
        ...options,
        lookupInterval: 0,
        lookupTimeout: 0,
        retryOptions: { attempts: 1 },
      });
      await producer.start();

      try {
        await producer.command({ ...COMMAND, to: ['consumer1'], created: new Date().getTime() });
        throw new Error('Should not reach this point');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error publishing command to control channel: Too much attempts [1], the promise will not be retried'
        );
      }
    }, 300);
    it(`Should fail to lookup if the is a problem in the publish method`, done => {
      const adapter = new MyAdapter();
      const producer = new Producer(adapter, { ...options, lookupInterval: 50, lookupTimeout: 25 });
      //@ts-ignore - Test environment
      jest.spyOn(producer, 'command').mockRejectedValue(new Error('Error'));
      producer.on('error', error => {
        expect(error.message).toEqual('Error performing a new lookup: Error');
        const checks = producer.checks;
        expect(checks).toEqual({
          'myAdapter:lastOperation': [
            {
              componentId: checks['myAdapter:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedUnit: 'result of last operation',
              observedValue: 'ok',
              output: undefined,
              status: 'pass',
              time: checks['myAdapter:lastOperation'][0].time,
            },
          ],
          'myId:consumers': [],
          'myId:commands': [
            {
              componentId: checks['myId:commands'][0].componentId,
              componentType: 'source',
              observedUnit: 'pending commands',
              observedValue: 0,
              output: undefined,
              status: 'pass',
              time: checks['myId:commands'][0].time,
            },
          ],
        });
        producer.stop().then();
        done();
      });
      producer.start().then();
    }, 300);
  });
});
