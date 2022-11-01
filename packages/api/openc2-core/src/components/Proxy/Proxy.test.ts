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
import {
  ConsumerAdapter,
  Control,
  OnCommandHandler,
  ProducerAdapter,
  ProxyOptions,
} from '../../types';
import { Proxy } from './Proxy';

const options: ProxyOptions = {
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

describe('#OpenC2 #Proxy', () => {
  describe('#Happy path', () => {
    it(`Should create a valid proxy`, () => {
      const consumer = new MyConsumerAdapter();
      const producer = new MyProducerAdapter();
      const proxy = new Proxy(consumer, producer, {
        ...options,
        lookupInterval: 1000000,
        lookupTimeout: 1000000 / 2 - 1,
      });
      expect(proxy).toBeInstanceOf(Proxy);
      expect(proxy.links).toEqual({
        openc2: {
          jobs: '/openc2/jobs',
          pendingJobs: '/openc2/pendingJobs',
          messages: '/openc2/messages',
        },
      });
      expect(proxy.router).toBeDefined();
      const checks = proxy.checks;
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
      const proxy = new Proxy(consumer, producer, options);
      //@ts-ignore - Test environment
      expect(proxy.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('status')).toEqual(0);
      //@ts-ignore - Test environment
      expect(proxy.started).toEqual(false);
      await proxy.start();
      //@ts-ignore - Test environment
      expect(proxy.started).toEqual(true);
      //@ts-ignore - Test environment
      expect(proxy.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('status')).toEqual(1);
      await proxy.start();
      //@ts-ignore - Test environment
      expect(proxy.started).toBeTruthy();
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('error')).toEqual(1);
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('status')).toEqual(1);
      await proxy.stop();
      //@ts-ignore - Test environment
      expect(proxy.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('status')).toEqual(0);
      await proxy.stop();
      //@ts-ignore - Test environment
      expect(proxy.started).toBeFalsy();
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('error')).toEqual(0);
      //@ts-ignore - Test environment
      expect(proxy.health.listenerCount('status')).toEqual(0);
      const checks = proxy.checks;
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
