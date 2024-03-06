/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { Redis } from 'ioredis';
import {
  REDIS_STORE_DEFAULTS,
  RedisDatastore,
  RedisStoreOptionsComplete,
  STORE_DEFAULTS,
  StoreOptionsComplete,
} from '..';
import { Bottleneck } from '../../bottleneck';
import { IORedisConnection } from '../../ioRedisConnection';

describe('#Puller #RedisDatastore', () => {
  let ioRedisClient: Redis;
  let ioRedisConn: IORedisConnection;
  let storeDefaults: StoreOptionsComplete;
  let redisStoreDefaults: RedisStoreOptionsComplete;
  let redisStoreOptions: RedisStoreOptionsComplete;
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    ioRedisClient = new Redis();
    ioRedisConn = new IORedisConnection({ client: ioRedisClient });
    storeDefaults = { ...STORE_DEFAULTS };
    redisStoreDefaults = { ...REDIS_STORE_DEFAULTS };
    redisStoreOptions = {
      ...redisStoreDefaults,
      connection: ioRedisConn,
    };
  });
  describe('#Happy path', () => {
    it(`Should create an instance of RedisDatastore`, () => {
      const bottleneck = new Bottleneck({});
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      expect(redisDatastore).toBeDefined();
      expect(redisDatastore).toBeInstanceOf(RedisDatastore);
    }, 300);
    it(`Should publish a message`, done => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(0);
      const bottleneck = new Bottleneck({ id: 'testLimiter' });
      const redisSubscriber = new Redis();
      const spyRedisConnReady = jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: redisSubscriber,
      });

      const spyConnAddLimiter = jest.spyOn(ioRedisConn, '__addLimiter__').mockResolvedValue([]);
      jest.spyOn(bottleneck, 'queued').mockReturnValue(0);
      const spyClientPublish = jest.spyOn(ioRedisClient, 'publish').mockResolvedValue(1);

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 1000,
      });
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);

      const promise = redisDatastore.__publish__('Test message');
      process.nextTick(() => {
        promise.then(res => {
          expect(spyRedisConnReady).toHaveBeenCalled();
          expect(spyRunScript).toHaveBeenCalledWith('init', expect.anything());
          expect(spyConnAddLimiter).toHaveBeenCalledWith(bottleneck);
          expect(spyRunScript).toHaveBeenCalledWith('register_client', [0]);
          expect(spyClientPublish).toHaveBeenCalledWith('b_testLimiter', 'message:Test message');
          expect(res).toBe(1);

          jest.advanceTimersByTime(1000);
          expect(spyRunScript).toHaveBeenCalledWith('heartbeat', []);
          expect(spyRunScript).toHaveBeenCalledTimes(3);
          done();
        });
      });
    }, 300);
    it(`Should handle on message and return amount of drained data when message type is 'capacity'`, done => {
      const bottleneck = new Bottleneck({});
      const spyLimiterDrainAll = jest.spyOn(bottleneck, 'drainAll').mockResolvedValue(10);

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      redisDatastore.onMessage('channel1', 'capacity:10').then(res => {
        expect(spyLimiterDrainAll).toHaveBeenCalledWith(10);
        expect(res).toBe(10);
        done();
      });
    }, 300);
    it(`Should handle on message and publish a new message with new capacity when type is 'capacity-priority' and has own 'clientId'`, done => {
      const bottleneck = new Bottleneck({});
      jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyLimiterDrainAll = jest.spyOn(bottleneck, 'drainAll').mockResolvedValue(7);
      jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('clientId1');
      const spyClientPublish = jest.spyOn(ioRedisClient, 'publish').mockResolvedValue(1);
      jest.spyOn(bottleneck, 'channel').mockReturnValue('channel1');

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 10000,
      });
      jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);

      redisDatastore.onMessage('channel1', 'capacity-priority:10:clientId1:5').then(res => {
        expect(spyLimiterDrainAll).toHaveBeenCalledWith(10);
        expect(spyClientPublish).toHaveBeenCalledWith('channel1', 'capacity-priority:3::5');
        expect(res).toBe(1);
        done();
      });
    }, 300);
    it(`Should handle on message, clear counter timeout and return amount of drained data when type is 'capacity-priority' and client is empty string'`, done => {
      const bottleneck = new Bottleneck({});
      jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyLimiterDrainAll = jest.spyOn(bottleneck, 'drainAll').mockResolvedValue(7);
      jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('clientId1');
      jest.spyOn(bottleneck, 'channel').mockReturnValue('channel1');

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 10000,
      });
      jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);
      redisDatastore['_capacityPriorityCounters']['counter1'] = setTimeout(() => 0, 10000);
      const spyClearTimeout = jest.spyOn(global, 'clearTimeout');

      redisDatastore.onMessage('channel1', 'capacity-priority:10::counter1').then(res => {
        expect(spyClearTimeout).toHaveBeenCalled();
        expect(redisDatastore['_capacityPriorityCounters']).not.toHaveProperty('counter1');
        expect(spyLimiterDrainAll).toHaveBeenCalledWith(10);
        expect(res).toBe(7);
        done();
      });
    }, 300);
    it(`Should handle on message, set counter timeout to run 'blacklist_client' script and return amount of drained data when type is 'capacity-priority' and it has not own client nor empty string`, done => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(0);
      const bottleneck = new Bottleneck({});
      jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyLimiterDrainAll = jest.spyOn(bottleneck, 'drainAll').mockResolvedValue(7);
      jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('clientId1');
      jest.spyOn(bottleneck, 'channel').mockReturnValue('channel1');

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 10000,
      });
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);
      const spySetTimeout = jest.spyOn(global, 'setTimeout');

      const flushPromises = () => new Promise(resolve => process.nextTick(resolve));
      const promise = redisDatastore.onMessage(
        'channel1',
        'capacity-priority:10:clientId99:counter1'
      );

      flushPromises()
        .then(() => {
          return promise;
        })
        .then(res => {
          expect(spySetTimeout).toHaveBeenCalled();
          expect(redisDatastore['_capacityPriorityCounters']['counter1']).toBeDefined();
          expect(res).toBeUndefined();

          jest.advanceTimersByTime(1000);
          return flushPromises();
        })
        .then(() => {
          expect(spyRunScript).toHaveBeenCalledWith('blacklist_client', ['clientId99']);
          expect(spyLimiterDrainAll).toHaveBeenCalledWith(10);
          done();
        });
    }, 300);
    it(`Should handle on message and trigger a 'message' event when type is 'message`, done => {
      const bottleneck = new Bottleneck({});
      jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyLimiterDrainAll = jest.spyOn(bottleneck, 'drainAll');
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 10000,
      });
      jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);

      redisDatastore.onMessage('channel1', 'message:Test message').then(res => {
        expect(spyLimiterDrainAll).not.toHaveBeenCalled();
        expect(res).toBeUndefined();
        expect(spyEventsTrigger).toHaveBeenCalledWith('message', 'Test message');
        done();
      });
    }, 300);
    it(`Should handle on message and drop all queued jobs by calling 'dropAllQueued' of Bottleneck when type is 'blocked`, done => {
      const bottleneck = new Bottleneck({});
      jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyLimiterDrainAll = jest.spyOn(bottleneck, 'drainAll');
      const spyLimiterDropAllQueued = jest.spyOn(bottleneck, 'dropAllQueued').mockReturnValue();

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 10000,
      });
      jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);

      redisDatastore.onMessage('channel1', 'blocked:Test message').then(res => {
        expect(spyLimiterDrainAll).not.toHaveBeenCalled();
        expect(res).toBeUndefined();
        expect(spyLimiterDropAllQueued).toHaveBeenCalledWith();
        done();
      });
    }, 300);
    it(`Should disconnect by removing limiter from ioredis connection when it is shared (i.e. passed in options)`, done => {
      const bottleneck = new Bottleneck({});
      const spyClearInterval = jest.spyOn(global, 'clearInterval');
      const spyRedisConnRemoveLimiter = jest
        .spyOn(ioRedisConn, '__removeLimiter__')
        .mockResolvedValue(undefined);

      // We pass the connection in redisStoreOptions
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      redisDatastore['_heartbeat'] = setInterval(() => 0, 10000);

      redisDatastore.__disconnect__(false).then(res => {
        expect(spyClearInterval).toHaveBeenCalledWith(redisDatastore['_heartbeat']);
        expect(spyRedisConnRemoveLimiter).toHaveBeenCalledWith(bottleneck);
        expect(res).toBeUndefined();
        done();
      });
    }, 300);
    it(`Should disconnect by disconnecting ioredis connection when it is not shared (i.e. created internally and not passed in options)`, done => {
      const bottleneck = new Bottleneck({});
      const spyClearInterval = jest.spyOn(global, 'clearInterval');

      // We do not pass the connection, we pass the client in redisStoreOptions
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreDefaults,
        client: ioRedisClient,
      });
      redisDatastore['_heartbeat'] = setInterval(() => 0, 10000);
      const spyRedisConnDisconnect = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, 'disconnect')
        .mockResolvedValue(['OK', 'OK']);

      redisDatastore.__disconnect__(true).then(res => {
        expect(spyClearInterval).toHaveBeenCalledWith(redisDatastore['_heartbeat']);
        expect(spyRedisConnDisconnect).toHaveBeenCalledWith(true);
        expect(res).toEqual(['OK', 'OK']);
        done();
      });
    }, 300);
    it(`Should run a script waiting first for datastore to be ready when it is not 'init' nor 'register_client'`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      const spyRedisConnScriptArgs = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'test_script_key1', 'test_script_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest.fn().mockImplementation((...args) => {
        const cb = args.pop();
        cb(null, ['reply1', 'reply2']);
      });
      const spyRedisConnScriptFn = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);

      // Checking results
      redisDatastore.runScript('test_script', ['arg1', 2]).then(res => {
        expect(spyReady).toHaveBeenCalledTimes(1);
        expect(spyEventsTrigger).toHaveBeenCalledWith(
          'debug',
          'Calling Redis script test_script.lua',
          [1234, 'clientId1', 'arg1', 2]
        );
        expect(spyRedisConnScriptArgs).toHaveBeenCalledWith(
          'test_script',
          'limiterId1',
          [1234, 'clientId1', 'arg1', 2],
          expect.any(Function)
        );
        expect(spyRedisConnScriptFn).toHaveBeenCalledWith('test_script');
        expect(spyRedisConnScriptFnBounded).toHaveBeenCalledWith(
          2,
          'test_script_key1',
          'test_script_key2',
          'arg1',
          2,
          expect.any(Function)
        );
        expect(res).toEqual(['reply1', 'reply2']);
        done();
      });
    }, 300);
    it(`Should run a script without waiting first for datastore to be ready when it is 'init'`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      const spyRedisConnScriptArgs = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'init_key1', 'init_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest.fn().mockImplementation((...args) => {
        const cb = args.pop();
        cb(null, ['reply1', 'reply2']);
      });
      const spyRedisConnScriptFn = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);

      // Checking results
      redisDatastore.runScript('init', ['arg1', 2]).then(res => {
        expect(spyReady).toHaveBeenCalledTimes(0);
        expect(spyEventsTrigger).toHaveBeenCalledWith('debug', 'Calling Redis script init.lua', [
          1234,
          'clientId1',
          'arg1',
          2,
        ]);
        expect(spyRedisConnScriptArgs).toHaveBeenCalledWith(
          'init',
          'limiterId1',
          [1234, 'clientId1', 'arg1', 2],
          expect.any(Function)
        );
        expect(spyRedisConnScriptFn).toHaveBeenCalledWith('init');
        expect(spyRedisConnScriptFnBounded).toHaveBeenCalledWith(
          2,
          'init_key1',
          'init_key2',
          'arg1',
          2,
          expect.any(Function)
        );
        expect(res).toEqual(['reply1', 'reply2']);
        done();
      });
    }, 300);
    it(`Should run a script without waiting first for datastore to be ready when it is 'register_client'`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      const spyRedisConnScriptArgs = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'register_client_key1', 'register_client_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest.fn().mockImplementation((...args) => {
        const cb = args.pop();
        cb(null, ['reply1', 'reply2']);
      });
      const spyRedisConnScriptFn = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);

      // Checking results
      redisDatastore.runScript('register_client', ['arg1', 2]).then(res => {
        expect(spyReady).toHaveBeenCalledTimes(0);
        expect(spyEventsTrigger).toHaveBeenCalledWith(
          'debug',
          'Calling Redis script register_client.lua',
          [1234, 'clientId1', 'arg1', 2]
        );
        expect(spyRedisConnScriptArgs).toHaveBeenCalledWith(
          'register_client',
          'limiterId1',
          [1234, 'clientId1', 'arg1', 2],
          expect.any(Function)
        );
        expect(spyRedisConnScriptFn).toHaveBeenCalledWith('register_client');
        expect(spyRedisConnScriptFnBounded).toHaveBeenCalledWith(
          2,
          'register_client_key1',
          'register_client_key2',
          'arg1',
          2,
          expect.any(Function)
        );
        expect(res).toEqual(['reply1', 'reply2']);
        done();
      });
    }, 300);
    it(`Should update settings by running 'update_settings' script and overwriting '_store_options' property`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);

      expect(redisDatastore['_storeOptions']['minTime']).toBe(0);
      expect(redisDatastore['_storeOptions']['maxConcurrent']).toBeNull();

      redisDatastore.__updateSettings__({ minTime: 5000, maxConcurrent: 1 }).then(() => {
        expect(redisDatastore['_storeOptions']['minTime']).toBe(5000);
        expect(redisDatastore['_storeOptions']['maxConcurrent']).toBe(1);
        expect(spyRunScript).toHaveBeenCalledWith('update_settings', [
          'minTime',
          '5000',
          'maxConcurrent',
          '1',
        ]);
        expect(redisDatastore['_storeOptions']).toEqual({
          ...storeDefaults,
          minTime: 5000,
          maxConcurrent: 1,
        });
        done();
      });
    }, 300);
    it(`Should execute 'running' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(5);

      redisDatastore.__running__().then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('running', []);
        expect(res).toBe(5);
        done();
      });
    }, 300);
    it(`Should execute 'queued' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(5);

      redisDatastore.__queued__().then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('queued', []);
        expect(res).toBe(5);
        done();
      });
    }, 300);
    it(`Should execute 'done' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(5);

      redisDatastore.__done__().then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('done', []);
        expect(res).toBe(5);
        done();
      });
    }, 300);
    it(`Should execute 'group_check' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(0);

      redisDatastore.__groupCheck__().then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('group_check', []);
        expect(res).toBe(false);
        done();
      });
    }, 300);
    it(`Should execute 'increment_reservoir' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(5);

      redisDatastore.__incrementReservoir__(5).then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('increment_reservoir', [5]);
        expect(res).toBe(5);
        done();
      });
    }, 300);
    it(`Should execute 'current_reservoir' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(5);

      redisDatastore.__currentReservoir__().then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('current_reservoir', []);
        expect(res).toBe(5);
        done();
      });
    }, 300);
    it(`Should execute 'check' script`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(1);

      redisDatastore.__check__(5).then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('check', ['5']);
        expect(res).toBe(true);
        done();
      });
    }, 300);
    it(`Should register by running 'register' script and return registration result`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue([1, 2000, 10]);

      redisDatastore.__register__('testIndex', 5, 1000).then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('register', ['testIndex', '5', '1000']);
        expect(res).toEqual({
          success: true,
          wait: 2000,
          reservoir: 10,
        });
        done();
      });
    }, 300);
    it(`Should submit by running 'submit' script and return submission result when it succeeds`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue([0, 1, 2]);

      redisDatastore.__submit__(2, 5).then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('submit', ['2', '5']);
        expect(res).toEqual({
          reachedHWM: false,
          blocked: true,
          strategy: 2,
        });
        done();
      });
    }, 300);
    it(`Should free by running 'free' script and return free result`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(2);

      redisDatastore.__free__('testIndex', 5).then(res => {
        expect(spyRunScript).toHaveBeenCalledWith('free', ['testIndex']);
        expect(res).toEqual({
          running: 2,
        });
        done();
      });
    }, 300);
  });

  describe('#Sad path', () => {
    it(`Should not create an instance of RedisDatastore when neither connection nor client options are provided`, () => {
      const bottleneck = new Bottleneck({});
      let datastore: RedisDatastore | undefined;
      try {
        datastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreDefaults);
      } catch (error: any) {
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toBe(
          'Either client or connection must be provided for Redis datastore'
        );
        expect(datastore).toBeUndefined();
      }
    });
    it(`Should trigger an error event when heartbeat script run on intervals fails`, done => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(0);
      const bottleneck = new Bottleneck({ id: 'testLimiter' });
      const redisClient = new Redis();
      const redisSubscriber = new Redis();
      const spyRedisConnReady = jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: redisClient,
        subscriber: redisSubscriber,
      });
      const spyConnAddLimiter = jest.spyOn(ioRedisConn, '__addLimiter__').mockResolvedValue([]);
      jest.spyOn(bottleneck, 'queued').mockReturnValue(0);

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 1000,
      });
      const spyRunScript = jest
        .spyOn(redisDatastore, 'runScript')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Test error heartbeat script'));
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);

      const flushPromises = () => new Promise(resolve => process.nextTick(resolve));

      const promise = redisDatastore.ready;
      flushPromises()
        .then(() => {
          return promise;
        })
        .then(res => {
          expect(spyRedisConnReady).toHaveBeenCalled();
          expect(spyRunScript).toHaveBeenCalledWith('init', expect.anything());
          expect(spyConnAddLimiter).toHaveBeenCalledWith(bottleneck);
          expect(spyRunScript).toHaveBeenCalledWith('register_client', [0]);
          expect(res).toEqual({
            client: redisClient,
            subscriber: redisSubscriber,
          });

          jest.advanceTimersByTime(1000);
          return flushPromises();
        })
        .then(() => {
          expect(spyRunScript).toHaveBeenCalledWith('heartbeat', []);
          expect(spyRunScript).toHaveBeenCalledTimes(3);
          expect(spyEventsTrigger).toHaveBeenCalledWith(
            'error',
            new Error('Test error heartbeat script')
          );
          done();
        });
    });
    it(`Should throw an 'error' event any step fails on message handling when type is 'capacity-priority' and it hast not own client or empty string`, done => {
      jest.useFakeTimers({ doNotFake: ['nextTick'] }).setSystemTime(0);
      const bottleneck = new Bottleneck({});
      jest.spyOn(ioRedisConn, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyLimiterDrainAll = jest
        .spyOn(bottleneck, 'drainAll')
        .mockRejectedValue(new Error('drainAll failed'));
      jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('clientId1');

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, {
        ...redisStoreOptions,
        heartbeatInterval: 10000,
      });
      jest.spyOn(redisDatastore, 'runScript').mockResolvedValue(undefined);
      const spySetTimeout = jest.spyOn(global, 'setTimeout');
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);

      const flushPromises = () => new Promise(resolve => process.nextTick(resolve));
      const promise = redisDatastore.onMessage(
        'channel1',
        'capacity-priority:10:clientId99:counter1'
      );

      flushPromises()
        .then(() => {
          return promise;
        })
        .then(res => {
          expect(spySetTimeout).toHaveBeenCalled();
          expect(redisDatastore['_capacityPriorityCounters']['counter1']).toBeDefined();
          expect(res).toBeUndefined();

          jest.advanceTimersByTime(1000);
          return flushPromises();
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(() => {
          expect(spyLimiterDrainAll).toHaveBeenCalledWith(10);
          expect(spyEventsTrigger).toHaveBeenCalledWith('error', new Error('drainAll failed'));
          done();
        });
    });
    it(`Should trigger an 'error' event when any step on message handling fails`, done => {
      const bottleneck = new Bottleneck({});
      const spyLimiterDrainAll = jest
        .spyOn(bottleneck, 'drainAll')
        .mockRejectedValue(new Error('drainAll failed for type capacity'));
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);

      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      redisDatastore
        .onMessage('channel1', 'capacity:10')
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(() => {
          expect(spyLimiterDrainAll).toHaveBeenCalledWith(10);
          expect(spyEventsTrigger).toHaveBeenCalledWith(
            'error',
            new Error('drainAll failed for type capacity')
          );
          done();
        });
    });
    it(`Should return nothing when running script 'heartbeat' fails with 'SETTINGS_KEY_NOT_FOUND' error message`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      const spyEventsTrigger = jest
        .spyOn(bottleneck.events, 'trigger')
        .mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      const spyRedisConnScriptArgs = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'heartbeat_key1', 'heartbeat_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest.fn().mockImplementation((...args) => {
        const cb = args.pop();
        cb(new Error('SETTINGS_KEY_NOT_FOUND'), null);
      });
      const spyRedisConnScriptFn = jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);

      // Checking results
      redisDatastore.runScript('heartbeat', ['arg1', 2]).then(res => {
        expect(spyReady).toHaveBeenCalledTimes(1);
        expect(spyEventsTrigger).toHaveBeenCalledWith(
          'debug',
          'Calling Redis script heartbeat.lua',
          [1234, 'clientId1', 'arg1', 2]
        );
        expect(spyRedisConnScriptArgs).toHaveBeenCalledWith(
          'heartbeat',
          'limiterId1',
          [1234, 'clientId1', 'arg1', 2],
          expect.any(Function)
        );
        expect(spyRedisConnScriptFn).toHaveBeenCalledWith('heartbeat');
        expect(spyRedisConnScriptFnBounded).toHaveBeenCalledWith(
          2,
          'heartbeat_key1',
          'heartbeat_key2',
          'arg1',
          2,
          expect.any(Function)
        );
        expect(res).toBeUndefined();
        done();
      });
    });
    it(`Should re-run a script (except heartbeat) after 'init' when it fails with 'SETTINGS_KEY_NOT_FOUND' error message`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      jest.spyOn(bottleneck.events, 'trigger').mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'test_script_key1', 'test_script_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest
        .fn()
        .mockImplementationOnce((...args) => {
          const cb = args.pop();
          cb(new Error('SETTINGS_KEY_NOT_FOUND'), null);
        })
        .mockImplementation((...args) => {
          const cb = args.pop();
          cb(null, ['lastReply1']);
        });
      jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript'); // to check recursive calls

      const expectedInitArgs = [
        '0',
        '2.19.5',
        'maxConcurrent',
        '',
        'minTime',
        '0',
        'highWater',
        '',
        'strategy',
        '1',
        'penalty',
        '',
        'reservoir',
        '',
        'reservoirRefreshInterval',
        '',
        'reservoirRefreshAmount',
        '',
        'reservoirIncreaseInterval',
        '',
        'reservoirIncreaseAmount',
        '',
        'reservoirIncreaseMaximum',
        '',
        'id',
        'limiterId1',
        'version',
        '2.19.5',
        'groupTimeout',
        '',
        'clientTimeout',
        '10000',
      ];

      // Checking results
      redisDatastore.runScript('test_script', ['arg1', 2]).then(res => {
        expect(spyRunScript).toHaveBeenCalledTimes(3);
        expect(spyRunScript.mock.calls[0]).toEqual(['test_script', ['arg1', 2]]);
        expect(spyRunScript.mock.calls[1]).toEqual(['init', expectedInitArgs]);
        expect(spyRunScript.mock.calls[2]).toEqual(['test_script', ['arg1', 2]]);

        expect(spyReady).toHaveBeenCalledTimes(2);
        expect(res).toEqual(['lastReply1']);
        done();
      });
    });
    it(`Should re-run a script after 'register_client' when it fails with 'UNKNOWN_CLIENT' error message`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      jest.spyOn(bottleneck.events, 'trigger').mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'test_script_key1', 'test_script_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest
        .fn()
        .mockImplementationOnce((...args) => {
          const cb = args.pop();
          cb(new Error('UNKNOWN_CLIENT'), null);
        })
        .mockImplementation((...args) => {
          const cb = args.pop();
          cb(null, ['lastReply1']);
        });
      jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);
      jest.spyOn(bottleneck, 'queued').mockReturnValue(5);
      const spyRunScript = jest.spyOn(redisDatastore, 'runScript'); // to check recursive calls

      // Checking results
      redisDatastore.runScript('test_script', ['arg1', 2]).then(res => {
        expect(spyRunScript).toHaveBeenCalledTimes(3);
        expect(spyRunScript.mock.calls[0]).toEqual(['test_script', ['arg1', 2]]);
        expect(spyRunScript.mock.calls[1]).toEqual(['register_client', [5]]);
        expect(spyRunScript.mock.calls[2]).toEqual(['test_script', ['arg1', 2]]);

        expect(spyReady).toHaveBeenCalledTimes(2);
        expect(res).toEqual(['lastReply1']);
        done();
      });
    });
    it(`Should reject with error when running a script fails with error message different to 'SETTINGS_KEY_NOT_FOUND' and 'UNKNOWN_CLIENT'`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);

      // Mocks
      jest.spyOn(redisDatastore, 'clientId', 'get').mockReturnValue('clientId1');
      const spyReady = jest.spyOn(redisDatastore, 'ready', 'get').mockResolvedValue({
        client: ioRedisClient,
        subscriber: new Redis(),
      });
      jest.spyOn(bottleneck.events, 'trigger').mockResolvedValue(undefined);
      jest.spyOn(Date, 'now').mockReturnValue(1234);
      jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptArgs__')
        .mockImplementation((name: string, id: string, args: any[], cb: any) => {
          return [2, 'test_script_key1', 'test_script_key2', 'arg1', 2, cb];
        });
      const spyRedisConnScriptFnBounded = jest.fn().mockImplementation((...args) => {
        const cb = args.pop();
        cb(new Error('ERROR_RUNNING_SCRIPT'), null);
      });
      jest
        .spyOn(redisDatastore['_connection'] as IORedisConnection, '__scriptFn__')
        .mockReturnValue(spyRedisConnScriptFnBounded);
      jest.spyOn(bottleneck, 'queued').mockReturnValue(5);

      // Checking results
      redisDatastore
        .runScript('test_script', ['arg1', 2])
        .then(res => {
          throw new Error('Should not be here');
        })
        .catch(err => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toEqual('ERROR_RUNNING_SCRIPT');
          done();
        });
    });
    it(`Should submit by running 'submit' script and throw an error informing about weight and maxConcurrent values when it fails due to 'OVERWEIGHT'`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest
        .spyOn(redisDatastore, 'runScript')
        .mockRejectedValue(new Error('OVERWEIGHT:5:1'));

      redisDatastore
        .__submit__(2, 5)
        .then(res => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(spyRunScript).toHaveBeenCalledWith('submit', ['2', '5']);
          expect(error).toBeInstanceOf(Crash);
          expect(error.message).toBe(
            'Impossible to add a job having a weight of 5 to a limiter having a maxConcurrent setting of 1'
          );
          done();
        });
    });
    it(`Should submit by running 'submit' script and throw the received error it does not fail due to 'OVERWEIGHT'`, done => {
      const bottleneck = new Bottleneck({ id: 'limiterId1' });
      const redisDatastore = new RedisDatastore(bottleneck, storeDefaults, redisStoreOptions);
      const spyRunScript = jest
        .spyOn(redisDatastore, 'runScript')
        .mockRejectedValue(new Error('Submit script failed'));

      redisDatastore
        .__submit__(2, 5)
        .then(res => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(spyRunScript).toHaveBeenCalledWith('submit', ['2', '5']);
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('Submit script failed');
          done();
        });
    });
  });
});
