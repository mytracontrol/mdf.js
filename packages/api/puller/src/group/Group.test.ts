/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Redis } from 'ioredis';
import { Group } from '.';
import { Bottleneck } from '../bottleneck';
import { LocalDatastore } from '../datastores';
import { IORedisConnection } from '../ioRedisConnection';

/**
 * In this file we implement the unit tests
 * for the Group class in typescript using jest.
 */
describe('#Puller #Group', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  describe('#Happy path', () => {
    it(`Should create an instance of Group with ioredis datastore when connection is not provided`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        datastore: 'ioredis',
        client: new Redis(),
      });
      expect(group).toBeDefined();
      expect(group).toBeInstanceOf(Group);
      expect(group['_timeout']).toBe(6000);
      expect(group['_id']).toBe('group-key');
      expect(group['_connection']).toBeInstanceOf(IORedisConnection);
    });

    it(`Should create an instance of Group with ioredis datastore when connection is provided`, () => {
      const redisClient = new Redis();
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        datastore: 'ioredis',
        connection: new IORedisConnection({ client: redisClient }),
      });
      expect(group).toBeDefined();
      expect(group).toBeInstanceOf(Group);
      expect(group['_timeout']).toBe(6000);
      expect(group['_id']).toBe('group-key');
      expect(group['_connection']).toBeInstanceOf(IORedisConnection);
      expect(group['_connection']['_client']).toBe(redisClient);
      expect(group['_sharedConnection']).toBe(true);
    });

    it(`Should create an instance of Group with local datastore`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        datastore: 'local',
      });
      expect(group).toBeDefined();
      expect(group).toBeInstanceOf(Group);
      expect(group['_timeout']).toBe(6000);
      expect(group['_id']).toBe('group-key');
      expect(group['_connection']).toBeNull();
    });

    it(`Should return the limiter of the given key and create it when it does not exist`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      const limiter = group.key('test-limiter');
      expect(limiter).toBeDefined();
      expect(limiter).toBeInstanceOf(Bottleneck);
      expect(limiter.store).toBeInstanceOf(LocalDatastore);
      expect(limiter.id).toBe('test-group-test-limiter');
    });

    it(`Should return the limiter of the given key when it does exist`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      const limiter1 = group.key('test-limiter');
      const limiter2 = group.key();
      expect(group.key('test-limiter')).toBe(limiter1);
      expect(group.key('')).toBe(limiter2);
    });

    it(`Should delete the limiter of the given key when using local datastore`, done => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      const limiter1 = group.key('test-limiter');
      const spyLimiterDisconnect = jest.spyOn(limiter1, 'disconnect').mockResolvedValue(undefined);

      group.deleteKey('test-limiter').then(result => {
        expect(result).toBe(true);
        expect(spyLimiterDisconnect).toHaveBeenCalled();
        expect(group.keys()).not.toContain('test-limiter');
        done();
      });
    });

    it(`Should delete the limiter of the given key when using redis datastore`, done => {
      const redisConnection = new IORedisConnection({ client: new Redis() });
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
        datastore: 'ioredis',
        connection: redisConnection,
      });
      const spyRedisConnRunCommand = jest
        .spyOn(redisConnection, '__runCommand__')
        .mockResolvedValue(1);
      const limiter1 = group.key('test-limiter');
      const spyLimiterDisconnect = jest.spyOn(limiter1, 'disconnect').mockResolvedValue(undefined);

      group.deleteKey('test-limiter').then(result => {
        expect(result).toBe(true);
        expect(spyRedisConnRunCommand).toHaveBeenCalledWith([
          'del',
          'b_test-group-test-limiter_settings',
          'b_test-group-test-limiter_job_weights',
          'b_test-group-test-limiter_job_expirations',
          'b_test-group-test-limiter_job_clients',
          'b_test-group-test-limiter_client_running',
          'b_test-group-test-limiter_client_num_queued',
          'b_test-group-test-limiter_client_last_registered',
          'b_test-group-test-limiter_client_last_seen',
        ]);
        expect(spyLimiterDisconnect).toHaveBeenCalled();
        expect(group.keys()).not.toContain('test-limiter');
        done();
      });
    });

    it(`Should return an array of limiters with their corresponding keys`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      const limiter1 = group.key('test-limiter1');
      const limiter2 = group.key('test-limiter2');

      const limiters = group.limiters();
      expect(limiters).toEqual([
        { key: 'test-limiter1', limiter: limiter1 },
        { key: 'test-limiter2', limiter: limiter2 },
      ]);
    });

    it(`Should return an array with the existing limiters keys`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      group.key('test-limiter1');
      group.key('test-limiter2');

      const keys = group.keys();
      expect(keys).toEqual(['test-limiter1', 'test-limiter2']);
    });

    it(`Should return local stored limiters keys when using local datastore (no cluster)`, done => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      group.key('test-limiter1');
      group.key('test-limiter2');

      group.clusterKeys().then(keys => {
        expect(keys).toEqual(['test-limiter1', 'test-limiter2']);
        done();
      });
    });

    it(`Should return clustered limiters keys when using ioredis datastore`, done => {
      const redisConnection = new IORedisConnection({ client: new Redis() });
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
        datastore: 'ioredis',
        connection: redisConnection,
      });
      const spyRedisConnRunCommand = jest
        .spyOn(redisConnection, '__runCommand__')
        .mockResolvedValueOnce([1, ['b_test-group-test-limiter1_settings']])
        .mockResolvedValueOnce([0, ['b_test-group-test-limiter2_settings']]);

      group.key('test-limiter1');
      group.key('test-limiter2');

      group.clusterKeys().then(keys => {
        expect(keys).toEqual(['test-limiter1', 'test-limiter2']);
        expect(spyRedisConnRunCommand).toHaveBeenCalledTimes(2);
        expect(spyRedisConnRunCommand).toHaveBeenCalledWith([
          'scan',
          0,
          'match',
          'b_test-group-*_settings',
          'count',
          10000,
        ]);
        expect(spyRedisConnRunCommand).toHaveBeenCalledWith([
          'scan',
          1,
          'match',
          'b_test-group-*_settings',
          'count',
          10000,
        ]);
        done();
      });
    });

    it(`Should update settings for new limiters without starting auto cleanup when timeout option is not provided`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });
      const limiter1 = group.key('test-limiter1');
      const result = group.updateSettings({ minTime: 2000 });
      const limiter2 = group.key('test-limiter2');

      expect(result).toBeUndefined();
      // limiter1 created before updateSettings, keeps old settings
      expect((limiter1.store as LocalDatastore)['_storeOptions']['minTime']).toBe(1000);
      // limiter2 created after updateSettings, has new settings
      expect((limiter2.store as LocalDatastore)['_storeOptions']['minTime']).toBe(2000);
    });

    it(`Should update settings for new limiters starting auto cleanup when timeout option is provided`, done => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(0);
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });

      // Limiter1
      const limiter1 = group.key('test-limiter1');
      const spyLimiter1GroupCheck = jest
        .spyOn(limiter1.store as LocalDatastore, '__groupCheck__')
        .mockResolvedValue(true); //delete
      jest.spyOn(limiter1, 'disconnect').mockResolvedValue();
      // Update settings
      const result = group.updateSettings({ minTime: 2000, timeout: 8000 });
      // Limiter2
      const limiter2 = group.key('test-limiter2');
      const spyLimiter2GroupCheck = jest
        .spyOn(limiter2.store as LocalDatastore, '__groupCheck__')
        .mockResolvedValue(false); // do not delete
      jest.spyOn(limiter2, 'disconnect').mockResolvedValue();

      expect(result).toBeDefined();
      expect((limiter1.store as LocalDatastore)['_storeOptions']['minTime']).toBe(1000);
      expect((limiter2.store as LocalDatastore)['_storeOptions']['minTime']).toBe(2000);

      jest.advanceTimersByTime(3000);
      // Would have been called at 3s but settings were updated to be at 4s (timeout/2)
      expect(spyLimiter1GroupCheck).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1000);
      process.nextTick(() => {
        expect(spyLimiter1GroupCheck).toHaveBeenCalledTimes(1);
        expect(spyLimiter2GroupCheck).toHaveBeenCalledTimes(1);
        expect(group.keys()).toEqual(['test-limiter2']);
        done();
      });
    });

    it(`Should disconnect the group connection when it is not shared (i.e. created internally and not passed in options)`, done => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
        datastore: 'ioredis',
        client: new Redis(), // we pass the client, not the connection
      });
      const spyConnectionDisconnect = jest
        .spyOn(group['_connection'], 'disconnect')
        .mockResolvedValue(['OK', 'OK']);

      group.disconnect().then(result => {
        expect(spyConnectionDisconnect).toHaveBeenCalledTimes(1);
        expect(spyConnectionDisconnect).toHaveBeenCalledWith(true);
        expect(result).toEqual(['OK', 'OK']);
        done();
      });
    });

    it(`Should not disconnect the group connection when it is shared (i.e. passed in options)`, () => {
      const redisConnection = new IORedisConnection({ client: new Redis() });
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
        datastore: 'ioredis',
        connection: redisConnection, // we pass the connection
      });
      const spyConnectionDisconnect = jest.spyOn(group['_connection'], 'disconnect');

      group.disconnect().then(result => {
        expect(spyConnectionDisconnect).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
      });
    });

    it(`Should not disconnect when there is no connection (local datastore)`, () => {
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
        datastore: 'local',
      });

      group.disconnect().then(result => {
        expect(result).toBeUndefined();
      });
    });
  });

  describe('#Sad path', () => {
    it(`Should trigger an error event on auto cleanup when group check fails`, done => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(0);
      const group = new Group({
        minTime: 1000,
        maxConcurrent: 1,
        timeout: 6000,
        id: 'test-group',
      });

      const limiter1 = group.key('test-limiter1');
      const spyLimiter1GroupCheck = jest
        .spyOn(limiter1.store as LocalDatastore, '__groupCheck__')
        .mockRejectedValue(new Error('Group check failed'));
      const spyDeleteKey = jest.spyOn(group, 'deleteKey');
      const spyEventsTrigger = jest.spyOn(limiter1.events, 'trigger').mockImplementation();

      jest.advanceTimersByTime(3000);
      process.nextTick(() => {
        expect(spyLimiter1GroupCheck).toHaveBeenCalledTimes(1);
        expect(spyDeleteKey).not.toHaveBeenCalled();
        expect(spyEventsTrigger).toHaveBeenCalledWith('error', new Error('Group check failed'));
        expect(group.keys()).toEqual(['test-limiter1']);
        done();
      });
    });
  });
});
