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
import { Consumer, Gateway, Producer, Registry } from '@mdf.js/openc2-core';
import { mockProperty, undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import { ConsumerFactory } from './ConsumerFactory';
import { GatewayFactory } from './GatewayFactory';
import { ProducerFactory } from './ProducerFactory';

describe('#Factories', () => {
  describe('#Happy path', () => {
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
      mockProperty(cluster, 'isWorker', true);
      expect(() => ConsumerFactory.Redis({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Consumer can not be instantiated in a worker process'
      );
      undoMocks();
    });
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
      mockProperty(cluster, 'isWorker', true);
      expect(() => ConsumerFactory.SocketIO({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Consumer can not be instantiated in a worker process'
      );
      undoMocks();
    });
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
      mockProperty(cluster, 'isWorker', true);
      expect(() => ProducerFactory.Redis({ id: 'myId' })).toThrow(
        'OpenC2 Producer can not be instantiated in a worker process'
      );
      undoMocks();
    });
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
      mockProperty(cluster, 'isWorker', true);
      expect(() => ProducerFactory.SocketIO({ id: 'myId' })).toThrow(
        'OpenC2 Producer can not be instantiated in a worker process'
      );
      undoMocks();
    });
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
      mockProperty(cluster, 'isWorker', true);
      expect(() =>
        GatewayFactory.RedisToWebSocketIO({ id: 'myId', actionTargetPairs: {} })
      ).toThrow('OpenC2 Gateway can not be instantiated in a worker process');
      undoMocks();
    });
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
      mockProperty(cluster, 'isWorker', true);
      expect(() => GatewayFactory.SocketIOToRedis({ id: 'myId', actionTargetPairs: {} })).toThrow(
        'OpenC2 Gateway can not be instantiated in a worker process'
      );
      undoMocks();
    });
  });
});
