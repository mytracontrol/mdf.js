/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import EventEmitter from 'events';
import { v4 } from 'uuid';
import { ConsumerAdapter, ConsumerOptions, OnCommandHandler } from '../../types';
import { Consumer } from './Consumer';

const options: ConsumerOptions = {
  id: 'myId',
  actionTargetPairs: {
    query: ['features', 'x-netin:alarms', 'x-netin:devices'],
  },
  profiles: ['x-netin'],
  actuator: ['myActuator'],
  registerLimit: 2,
};
const NOOP: () => void = () => {};
class MyAdapter extends EventEmitter implements ConsumerAdapter {
  name = 'myAdapter';
  componentId = v4();
  checks = {};
  subscribe(handler: OnCommandHandler): Promise<void> {
    this.on('data', handler);
    return Promise.resolve();
  }
  unsubscribe(handler: OnCommandHandler): Promise<void> {
    this.off('data', handler);
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
describe('#OpenC2 #Consumer', () => {
  describe('#Happy path', () => {
    it(`Should create a valid Consumer with getters and setters`, () => {
      const adapter = new MyAdapter();
      const consumer = new Consumer(adapter, options);
      expect(consumer).toBeInstanceOf(Consumer);
      expect(consumer.actuator).toEqual(['myActuator']);
      consumer.actuator = ['myActuator2'];
      expect(consumer.actuator).toEqual(['myActuator2']);
      expect(consumer.profiles).toEqual(['x-netin']);
      consumer.profiles = ['x-netin2'];
      expect(consumer.profiles).toEqual(['x-netin2']);
      expect(consumer.pairs).toEqual({
        query: ['features', 'x-netin:alarms', 'x-netin:devices'],
      });
      consumer.pairs = {
        query: ['features', 'x-netin1:alarms', 'x-netin1:devices'],
      };
      expect(consumer.pairs).toEqual({
        query: ['features', 'x-netin1:alarms', 'x-netin1:devices'],
      });
      expect(consumer.links).toEqual({
        openc2: {
          jobs: '/openc2/jobs',
          pendingJobs: '/openc2/pendingJobs',
          messages: '/openc2/messages',
        },
      });
      expect(consumer.router).toBeDefined();
      const checks = consumer.checks;
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
      expect(consumer.adapter.name).toEqual('myAdapter');
      //@ts-ignore - Test environment
      expect(consumer.adapter.componentId).toBeDefined();
    }, 300);
    it(`Should start and stop properly`, async () => {
      const adapter = new MyAdapter();
      const consumer = new Consumer(adapter, options);

      //@ts-ignore - Test environment
      expect(consumer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(0);
      await consumer.start();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(1);
      await consumer.start();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(1);
      await consumer.stop();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(0);
      await consumer.stop();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(0);
      const checks = consumer.checks;
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
    it(`Should restart start and stop if subscribe or unsubscribe methods rejects`, async () => {
      const adapter = new MyAdapter();
      jest.spyOn(adapter, 'subscribe').mockRejectedValueOnce(new Error('error'));
      jest.spyOn(adapter, 'unsubscribe').mockRejectedValueOnce(new Error('error'));
      const consumer = new Consumer(adapter, {
        ...options,
        retryOptions: { attempts: 2, waitTime: 50, maxWaitTime: 100 },
      });

      //@ts-ignore - Test environment
      expect(consumer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(0);
      await consumer.start();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(1);
      await consumer.start();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(1);
      await consumer.stop();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(0);
      await consumer.stop();
      //@ts-ignore - Test environment
      expect(consumer.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(consumer.health.listenerCount('status')).toEqual(0);
      const checks = consumer.checks;
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
  });
  describe('#Sad path', () => {
    it(`Should throw an error if the adapter is not valid`, () => {
      //@ts-ignore - Test environment
      expect(() => new Consumer(undefined, options)).toThrowError(
        'AdapterWrapper requires an adapter instance'
      );
      //@ts-ignore - Test environment
      expect(() => new Consumer({ name: 'myAdapter' }, options)).toThrowError(
        'Adapter myAdapter does not implement the subscribe method'
      );
      //@ts-ignore - Test environment
      expect(() => new Consumer({ name: 'myAdapter', subscribe: () => {} }, options)).toThrowError(
        'Adapter myAdapter does not implement the unsubscribe method'
      );
    });
    it(`Should fail to start if subscribe method rejects`, async () => {
      const adapter = new MyAdapter();
      jest.spyOn(adapter, 'subscribe').mockRejectedValueOnce(new Error('error'));
      const consumer = new Consumer(adapter, {
        ...options,
        retryOptions: { attempts: 1, waitTime: 50, maxWaitTime: 100 },
      });
      try {
        await consumer.start();
      } catch (error: any) {
        expect(error.message).toEqual('Too much attempts [1], the promise will not be retried');
        const checks = consumer.checks;
        expect(checks).toEqual({
          'myAdapter:lastOperation': [
            {
              componentId: checks['myAdapter:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedUnit: 'result of last operation',
              observedValue: 'error',
              output: [
                'CrashError: Error performing [mockConstructor] operation on myAdapter plug',
                'caused by InterruptionError: Too much attempts [1], the promise will not be retried',
                'caused by Error: error',
              ],
              status: 'fail',
              time: checks['myAdapter:lastOperation'][0].time,
            },
          ],
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
      }
    }, 300);
  });
});
