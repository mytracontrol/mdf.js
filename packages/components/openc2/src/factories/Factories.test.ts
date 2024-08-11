/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Consumer, Gateway, Producer, Registry } from '@mdf.js/openc2-core';
import cluster from 'cluster';
import { ConsumerFactory } from './ConsumerFactory';
import { GatewayFactory } from './GatewayFactory';
import { ProducerFactory } from './ProducerFactory';

describe('#Factories', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
    it('Should create a valid instance of redis based consumer', () => {
      const registry = new Registry('myId');
      const simple = ConsumerFactory.Redis({ id: 'myId', actionTargetPairs: {} });
      const simpleWithRegistry = ConsumerFactory.Redis({
        id: 'myId',
        actionTargetPairs: {},
        registry,
      });
      expect(simple).toBeInstanceOf(Consumer);
      expect(simpleWithRegistry).toBeInstanceOf(Consumer);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => ConsumerFactory.Redis({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Consumer can not be instantiated in a worker process'
      );
    }, 300);
    it('Should create a valid instance of socket.io based consumer', () => {
      const registry = new Registry('myId');
      const simple = ConsumerFactory.SocketIO({ id: 'myId', actionTargetPairs: {} });
      const simpleWithRegistry = ConsumerFactory.SocketIO({
        id: 'myId',
        actionTargetPairs: {},
        registry,
      });
      expect(simple).toBeInstanceOf(Consumer);
      expect(simpleWithRegistry).toBeInstanceOf(Consumer);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => ConsumerFactory.SocketIO({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Consumer can not be instantiated in a worker process'
      );
    }, 300);
    it('Should create a valid instance of redis based producer', () => {
      const registry = new Registry('myId');
      const simple = ProducerFactory.Redis({ id: 'myId' });
      const simpleWithRegistry = ProducerFactory.Redis({
        id: 'myId',
        registry,
      });
      expect(simple).toBeInstanceOf(Producer);
      expect(simpleWithRegistry).toBeInstanceOf(Producer);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => ProducerFactory.Redis({ id: 'myId' })).toThrow(
        'OpenC2 Producer can not be instantiated in a worker process'
      );
    }, 300);
    it('Should create a valid instance of socket.io based consumer', () => {
      const registry = new Registry('myId');
      const simple = ProducerFactory.SocketIO({ id: 'myId' });
      const simpleWithRegistry = ProducerFactory.SocketIO({
        id: 'myId',
        registry,
      });
      expect(simple).toBeInstanceOf(Producer);
      expect(simpleWithRegistry).toBeInstanceOf(Producer);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => ProducerFactory.SocketIO({ id: 'myId' })).toThrow(
        'OpenC2 Producer can not be instantiated in a worker process'
      );
    }, 300);
    it('Should create a valid instance of redis to socket.io based gateway', () => {
      const registry = new Registry('myId');
      const simple = GatewayFactory.RedisToWebSocketIO({ id: 'myId', actionTargetPairs: {} });
      const simpleWithRegistry = GatewayFactory.RedisToWebSocketIO({
        id: 'myId',
        actionTargetPairs: {},
        registry,
      });
      expect(simple).toBeInstanceOf(Gateway);
      expect(simpleWithRegistry).toBeInstanceOf(Gateway);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() =>
        GatewayFactory.RedisToWebSocketIO({ id: 'myId', actionTargetPairs: {} })
      ).toThrow('OpenC2 Gateway can not be instantiated in a worker process');
    }, 300);
    it('Should create a valid instance of socket.io to redis based gateway', () => {
      const registry = new Registry('myId');
      const simple = GatewayFactory.SocketIOToRedis({ id: 'myId', actionTargetPairs: {} });
      const simpleWithRegistry = GatewayFactory.SocketIOToRedis({
        id: 'myId',
        registry,
        actionTargetPairs: {},
      });
      expect(simple).toBeInstanceOf(Gateway);
      expect(simpleWithRegistry).toBeInstanceOf(Gateway);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => GatewayFactory.SocketIOToRedis({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Gateway can not be instantiated in a worker process'
      );
    }, 300);
    it('Should create a valid instance of dummy based consumer', () => {
      const registry = new Registry('myId');
      const simple = ConsumerFactory.Dummy({ id: 'myId', actionTargetPairs: {} });
      const simpleWithRegistry = ConsumerFactory.Dummy({
        id: 'myId',
        actionTargetPairs: {},
        registry,
      });
      expect(simple).toBeInstanceOf(Consumer);
      expect(simpleWithRegistry).toBeInstanceOf(Consumer);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => ConsumerFactory.Dummy({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Consumer can not be instantiated in a worker process'
      );
    }, 300);
    it('Should create a valid instance of dummy based producer', () => {
      const registry = new Registry('myId');
      const simple = ProducerFactory.Dummy({ id: 'myId' });
      const simpleWithRegistry = ProducerFactory.Dummy({
        id: 'myId',
        registry,
      });
      expect(simple).toBeInstanceOf(Producer);
      expect(simpleWithRegistry).toBeInstanceOf(Producer);
      // @ts-ignore - private property
      expect(simpleWithRegistry.register).toBe(registry);
      // @ts-ignore - private property
      jest.replaceProperty(cluster, 'isWorker', true);
      expect(() => ProducerFactory.Dummy({ id: 'myId' })).toThrow(
        'OpenC2 Producer can not be instantiated in a worker process'
      );
    }, 300);
  });
});
