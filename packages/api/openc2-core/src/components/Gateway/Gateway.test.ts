/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import EventEmitter from 'events';
import { v4 } from 'uuid';
import {
  ConsumerAdapter,
  Control,
  GatewayOptions,
  OnCommandHandler,
  ProducerAdapter,
} from '../../types';
import { Gateway } from './Gateway';

const options: GatewayOptions = {
  id: 'myId',
  actionTargetPairs: {
    query: ['features', 'x-netin:alarms', 'x-netin:devices'],
  },
  profiles: ['x-netin'],
  actuator: ['myActuator'],
  registerLimit: 2,
};
class MyConsumerAdapter extends EventEmitter implements ConsumerAdapter {
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
class MyProducerAdapter extends EventEmitter implements ProducerAdapter {
  name = 'myAdapter';
  componentId = v4();
  checks = {};
  publish(
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | Control.ResponseMessage[] | void> {
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

describe('#OpenC2 #Gateway', () => {
  describe('#Happy path', () => {
    it(`Should create a valid gateway`, () => {
      const consumer = new MyConsumerAdapter();
      const producer = new MyProducerAdapter();
      const gateway = new Gateway(consumer, producer, {
        ...options,
        lookupInterval: 1000000,
        lookupTimeout: 1000000 / 2 - 1,
      });
      expect(gateway).toBeInstanceOf(Gateway);
      expect(gateway.links).toEqual({
        openc2: {
          jobs: '/openc2/jobs',
          pendingJobs: '/openc2/pendingJobs',
          messages: '/openc2/messages',
        },
      });
      expect(gateway.router).toBeDefined();
      const checks = gateway.checks;
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
    }, 300);
    it(`Should start and stop properly`, async () => {
      const consumer = new MyConsumerAdapter();
      const producer = new MyProducerAdapter();
      const gateway = new Gateway(consumer, producer, options);
      //@ts-ignore - Test environment
      expect(gateway.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('status')).toEqual(0);
      //@ts-ignore - Test environment
      expect(gateway.started).toEqual(false);
      await gateway.start();
      //@ts-ignore - Test environment
      expect(gateway.started).toEqual(true);
      //@ts-ignore - Test environment
      expect(gateway.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('status')).toEqual(1);
      await gateway.start();
      //@ts-ignore - Test environment
      expect(gateway.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('status')).toEqual(1);
      await gateway.stop();
      //@ts-ignore - Test environment
      expect(gateway.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('status')).toEqual(0);
      await gateway.stop();
      //@ts-ignore - Test environment
      expect(gateway.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(gateway.health.listenerCount('status')).toEqual(0);
      const checks = gateway.checks;
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
  });
  describe('#Sad path', () => {});
});
