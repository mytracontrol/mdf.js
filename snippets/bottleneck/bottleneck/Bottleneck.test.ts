/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { Redis } from 'ioredis';
import { Bottleneck, DEFAULT_STATES_NAMES } from '.';
import { LocalDatastore, RedisDatastore } from '../datastores';
import { DLList } from '../dlList';
import { Job } from '../job';
import { States } from '../states';

/**
 * In this file we implement the unit tests
 * for the Bottleneck class in typescript using jest.
 */
describe('#Puller #Bottleneck', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  describe('#Happy path', () => {
    it(`Should create an instance of Bottleneck with Redis Datastore`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'ioredis',
        client: new Redis(),
      });
      expect(bottleneck).toBeDefined();
      expect(bottleneck).toBeInstanceOf(Bottleneck);
      expect(bottleneck.store).toBeInstanceOf(RedisDatastore);
    }, 300);
    it(`Should create an instance of Bottleneck with Local Datastore`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      expect(bottleneck).toBeDefined();
      expect(bottleneck).toBeInstanceOf(Bottleneck);
      expect(bottleneck.store).toBeInstanceOf(LocalDatastore);
    }, 300);
    it(`Should return the ready property of the store`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyReady = jest.spyOn(bottleneck.store, 'ready', 'get').mockResolvedValue();
      bottleneck.ready().then(ready => {
        expect(spyReady).toHaveBeenCalled();
        expect(ready).toBeUndefined(); //returned Promise<void>
      });
    }, 300);
    it(`Should return the clients property of the store`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyClients = jest.spyOn(bottleneck.store, 'clients', 'get').mockReturnValue({});
      const clients = bottleneck.clients();
      expect(spyClients).toHaveBeenCalled();
      expect(clients).toEqual({});
    }, 300);
    it(`Should return the channel id`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
        id: 'testId',
      });
      expect(bottleneck.channel()).toEqual('b_testId');
    }, 300);
    it(`Should return the channel client id`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
        id: 'testId',
      });
      jest.spyOn(bottleneck['_store'], 'clientId', 'get').mockReturnValue('testClientId');
      expect(bottleneck.channel_client()).toEqual('b_testId_testClientId');
    }, 300);
    it(`Should publish a message by calling the 'publish' method of the store`, done => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
        id: 'testId',
      });
      const spyPublish = jest.spyOn(bottleneck.store, '__publish__').mockResolvedValue();
      bottleneck.publish('test message').then(() => {
        expect(spyPublish).toHaveBeenCalledWith('test message');
        done();
      });
    }, 300);
    it(`Should disconnect by calling the 'disconnect' method of the store`, done => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
        id: 'testId',
      });
      const spyDisconnect = jest.spyOn(bottleneck.store, '__disconnect__').mockResolvedValue();
      bottleneck.disconnect().then(() => {
        expect(spyDisconnect).toHaveBeenCalledWith(true);
        done();
      });
    }, 300);
    it(`Should save the chained limiter instance to this instance`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
        id: 'testId',
      });
      const chainedLimiter = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
        id: 'chainedTestId',
      });
      const result = bottleneck.chain(chainedLimiter);
      expect(result).toBeInstanceOf(Bottleneck);
      expect(result).toBe(bottleneck);
      expect(bottleneck['_limiter']).toBe(chainedLimiter);
    }, 300);
    it(`Should return the total number of queued jobs by calling 'queued' method of Queues when priority is not provided`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
      });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(5);
      const result = bottleneck.queued();
      expect(spyQueued).toHaveBeenCalledWith(undefined);
      expect(result).toBe(5);
    }, 300);
    it(`Should return the number of queued jobs for the given priority by calling 'queued' method of Queues`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
      });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(5);
      const result = bottleneck.queued(3);
      expect(spyQueued).toHaveBeenCalledWith(3);
      expect(result).toBe(5);
    }, 300);
    it(`Should return the total number of queued jobs by calling 'queued' method of the store`, done => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
      });
      const spyStoreQueued = jest.spyOn(bottleneck.store, '__queued__').mockResolvedValue(5);
      bottleneck.clusterQueued().then(result => {
        expect(spyStoreQueued).toHaveBeenCalledWith();
        expect(result).toBe(5);
        done();
      });
    }, 300);
    it(`Should return true when number of queued jobs is 0 and submit lock is empty`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
      });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(0);
      const spyLockEmpty = jest.spyOn(bottleneck['_submitLock'], 'isEmpty').mockReturnValue(true);
      const result = bottleneck.empty();
      expect(spyQueued).toHaveBeenCalledWith(undefined);
      expect(spyLockEmpty).toHaveBeenCalledWith();
      expect(result).toBe(true);
    }, 300);
    it(`Should return false when number of queued jobs is not 0`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
      });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(5);
      const result = bottleneck.empty();
      expect(spyQueued).toHaveBeenCalledWith(undefined);
      expect(result).toBe(false);
    }, 300);
    it(`Should return false when submit lock is not empty`, () => {
      const bottleneck = new Bottleneck({
        minTime: 100,
        maxConcurrent: 5,
        datastore: 'local',
      });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(0);
      const spyLockEmpty = jest.spyOn(bottleneck['_submitLock'], 'isEmpty').mockReturnValue(false);
      const result = bottleneck.empty();
      expect(spyQueued).toHaveBeenCalledWith(undefined);
      expect(spyLockEmpty).toHaveBeenCalledWith();
      expect(result).toBe(false);
    }, 300);
    it(`Should return running property of the store`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyRunning = jest.spyOn(bottleneck.store, '__running__').mockResolvedValue(5);
      bottleneck.running().then(result => {
        expect(spyRunning).toHaveBeenCalledWith();
        expect(result).toBe(5);
      });
    }, 300);
    it(`Should return done property of the store`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyDone = jest.spyOn(bottleneck.store, '__done__').mockResolvedValue(5);
      bottleneck.done().then(result => {
        expect(spyDone).toHaveBeenCalledWith();
        expect(result).toBe(5);
      });
    }, 300);
    it(`Should return status of the given job id by calling 'jobStatus' method of States`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyJobStatus = jest.spyOn(bottleneck['_states'], 'jobStatus').mockReturnValue('done');
      const result = bottleneck.jobStatus('testJobId');
      expect(spyJobStatus).toHaveBeenCalledWith('testJobId');
      expect(result).toBe('done');
    }, 300);
    it(`Should return the ids of the jobs at the given status by calling 'statusJobs' method of States`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyStatusJobs = jest
        .spyOn(bottleneck['_states'], 'statusJobs')
        .mockReturnValue(['job1', 'job2']);
      const result = bottleneck.jobs('done');
      expect(spyStatusJobs).toHaveBeenCalledWith('done');
      expect(result).toEqual(['job1', 'job2']);
    }, 300);
    it(`Should return number of jobs at each status by calling 'statusCounts' method of States`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyStatusCounts = jest
        .spyOn(bottleneck['_states'], 'statusCounts')
        .mockReturnValue({ done: 2, running: 3 });
      const result = bottleneck.counts();
      expect(spyStatusCounts).toHaveBeenCalledWith();
      expect(result).toEqual({ done: 2, running: 3 });
      // expect(job.options.id).toContain('<no-id>-');
      // expect(job.options.id.slice(8).length).toBeGreaterThan(0);
    }, 300);
    it(`Should return a random index`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyRandom = jest.spyOn(global.Math, 'random').mockReturnValue(0.12345);
      const result = bottleneck.randomIndex();
      expect(spyRandom).toHaveBeenCalledWith();
      expect(result).toEqual('4fzolfdnfyf');
    }, 300);
    it(`Should check weight conditions by calling the method 'check' of the store`, done => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyCheck = jest.spyOn(bottleneck.store, '__check__').mockResolvedValue(true);
      bottleneck.check().then(result => {
        expect(spyCheck).toHaveBeenCalledWith(1);
        expect(result).toBe(true);
        done();
      });
    }, 300);
    it(`Should drain nothing when number of queued jobs is 0`, done => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(0);
      bottleneck.drainAll(10).then(totalDrained => {
        expect(spyQueued).toHaveBeenCalledWith(undefined);
        expect(totalDrained).toBe(0);
        done();
      });
    }, 300);
    it(`Should drain nothing when job weight is greater than capacity`, done => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyQueued = jest.spyOn(bottleneck['_queues'], 'queued').mockReturnValue(1);
      const mockDLList = new DLList<Job>(
        () => jest.fn(),
        () => jest.fn()
      );
      const mockJob1 = new Job(
        jest.fn(),
        [],
        { weight: 15 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const spyQueuesGetFirst = jest
        .spyOn(bottleneck['_queues'], 'getFirst')
        .mockReturnValue(mockDLList);
      const spyQueueFirstJob = jest.spyOn(mockDLList, 'first').mockReturnValue(mockJob1);

      bottleneck.drainAll(10).then(totalDrained => {
        expect(spyQueued).toHaveBeenCalledWith(undefined);
        expect(spyQueuesGetFirst).toHaveBeenCalledWith();
        expect(spyQueueFirstJob).toHaveBeenCalledWith();
        expect(totalDrained).toBe(0);
        done();
      });
    }, 300);
    it(`Should drain a job when its weight is lesser than capacity, and trigger 'empty' and 'depleted' events`, done => {
      jest.useFakeTimers().setSystemTime(0);
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyQueued = jest
        .spyOn(bottleneck, 'queued')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(0);
      const mockDLList = new DLList<Job>(
        () => jest.fn(),
        () => jest.fn()
      );
      const mockJob1 = new Job(
        jest.fn(),
        [],
        { weight: 5, expiration: 100 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const spyQueuesGetFirst = jest
        .spyOn(bottleneck['_queues'], 'getFirst')
        .mockReturnValue(mockDLList);
      const spyQueueFirstJob = jest.spyOn(mockDLList, 'first').mockReturnValue(mockJob1);
      const spyEventsTrigger = jest.spyOn(bottleneck.events, 'trigger').mockImplementation();
      const spyRandomIndex = jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('randomIdx');
      const spyStoreRegister = jest.spyOn(bottleneck.store, '__register__').mockResolvedValue({
        success: true,
        wait: 100,
        reservoir: 0,
      });
      const spyQueueShift = jest.spyOn(mockDLList, 'shift').mockReturnValue(mockJob1);
      const spyEmpty = jest.spyOn(bottleneck, 'empty').mockReturnValue(true);
      const spyJobDoRun = jest.spyOn(mockJob1, 'doRun').mockImplementation();
      const spyJobDoExecute = jest.spyOn(mockJob1, 'doExecute').mockImplementation();
      const spyJobDoExpire = jest.spyOn(mockJob1, 'doExpire').mockImplementation();

      bottleneck.drainAll(10).then(totalDrained => {
        expect(spyQueued).toHaveBeenCalledWith();
        expect(spyQueuesGetFirst).toHaveBeenCalledWith();
        expect(spyQueueFirstJob).toHaveBeenCalledWith();
        expect(spyStoreRegister).toHaveBeenCalledWith('randomIdx', 5, 100);
        expect(spyQueueShift).toHaveBeenCalledWith();
        expect(spyEmpty).toHaveBeenCalledWith();
        expect(spyEventsTrigger).toHaveBeenCalledWith('empty');
        expect(spyEventsTrigger).toHaveBeenCalledWith('depleted', true);
        expect(spyJobDoRun).toHaveBeenCalled();
        expect(bottleneck['_scheduled']['randomIdx']['job']).toBe(mockJob1);

        jest.advanceTimersByTime(100);
        expect(spyJobDoExecute).toHaveBeenCalled();

        jest.advanceTimersByTime(100);
        expect(spyJobDoExpire).toHaveBeenCalled();

        expect(totalDrained).toBe(5);
        done();
      });
    }, 300);
    it(`Should drain multiple jobs one by one when their weights are still lesser than capacity in each step`, done => {
      jest.useFakeTimers().setSystemTime(0);
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyQueued = jest
        .spyOn(bottleneck, 'queued')
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(0);
      const mockDLList = new DLList<Job>(
        () => jest.fn(),
        () => jest.fn()
      );
      const mockJob1 = new Job(
        jest.fn(),
        [],
        { weight: 5, expiration: 100 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const mockJob2 = new Job(
        jest.fn(),
        [],
        { weight: 4, expiration: 100 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const spyQueuesGetFirst = jest
        .spyOn(bottleneck['_queues'], 'getFirst')
        .mockReturnValue(mockDLList);
      const spyQueueFirstJob = jest
        .spyOn(mockDLList, 'first')
        .mockReturnValueOnce(mockJob1)
        .mockReturnValueOnce(mockJob2);
      const spyEventsTrigger = jest.spyOn(bottleneck.events, 'trigger').mockImplementation();
      const spyRandomIndex = jest
        .spyOn(bottleneck, 'randomIndex')
        .mockReturnValueOnce('randomIdx1')
        .mockReturnValueOnce('randomIdx2');
      const spyStoreRegister = jest
        .spyOn(bottleneck.store, '__register__')
        .mockResolvedValueOnce({
          success: true,
          wait: 100,
          reservoir: 5,
        })
        .mockResolvedValueOnce({
          success: true,
          wait: 150,
          reservoir: 5,
        });
      const spyQueueShift = jest
        .spyOn(mockDLList, 'shift')
        .mockReturnValueOnce(mockJob1)
        .mockReturnValueOnce(mockJob2);
      const spyEmpty = jest
        .spyOn(bottleneck, 'empty')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      const spyJob1DoRun = jest.spyOn(mockJob1, 'doRun').mockImplementation();
      const spyJob1DoExecute = jest.spyOn(mockJob1, 'doExecute').mockImplementation();
      const spyJob1DoExpire = jest.spyOn(mockJob1, 'doExpire').mockImplementation();
      const spyJob2DoRun = jest.spyOn(mockJob2, 'doRun').mockImplementation();
      const spyJob2DoExecute = jest.spyOn(mockJob2, 'doExecute').mockImplementation();
      const spyJob2DoExpire = jest.spyOn(mockJob2, 'doExpire').mockImplementation();

      bottleneck.drainAll(10).then(totalDrained => {
        expect(spyQueued).toHaveBeenCalledTimes(3);
        expect(spyQueuesGetFirst).toHaveBeenCalledTimes(2);
        expect(spyQueueFirstJob).toHaveBeenCalledTimes(2);
        expect(spyStoreRegister).toHaveBeenCalledTimes(2);
        expect(spyStoreRegister).toHaveBeenNthCalledWith(1, 'randomIdx1', 5, 100);
        expect(spyStoreRegister).toHaveBeenNthCalledWith(2, 'randomIdx2', 4, 100);
        expect(spyQueueShift).toHaveBeenCalledTimes(2);
        expect(spyEmpty).toHaveBeenCalledTimes(2);
        expect(spyEventsTrigger).toHaveBeenCalledWith('empty');
        expect(spyJob1DoRun).toHaveBeenCalled();
        expect(spyJob2DoRun).toHaveBeenCalled();
        expect(bottleneck['_scheduled']['randomIdx1']['job']).toBe(mockJob1);
        expect(bottleneck['_scheduled']['randomIdx2']['job']).toBe(mockJob2);

        jest.advanceTimersByTime(100);
        expect(spyJob1DoExecute).toHaveBeenCalled();

        jest.advanceTimersByTime(50);
        expect(spyJob2DoExecute).toHaveBeenCalled();

        jest.advanceTimersByTime(50);
        expect(spyJob1DoExpire).toHaveBeenCalled();

        jest.advanceTimersByTime(50);
        expect(spyJob2DoExpire).toHaveBeenCalled();

        expect(totalDrained).toBe(9);
        done();
      });
    }, 300);
    it(`Should drop all jobs from all priorities queues by calling the shift all of Queues`, () => {
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const mockJob1 = new Job(
        jest.fn(),
        [],
        { priority: 1 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const mockJob2 = new Job(
        jest.fn(),
        [],
        { priority: 2 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );

      bottleneck['_queues'].push(mockJob1);
      bottleneck['_queues'].push(mockJob2);
      const spyQueuesShiftAll = jest.spyOn(bottleneck['_queues'], 'shiftAll');
      const spyJob1DoDrop = jest.spyOn(mockJob1, 'doDrop').mockImplementation();
      const spyJob2DoDrop = jest.spyOn(mockJob1, 'doDrop').mockImplementation();

      bottleneck.dropAllQueued('Test drop message');
      expect(spyQueuesShiftAll).toHaveBeenCalledTimes(1);
      expect(spyJob1DoDrop).toHaveBeenCalledWith({ message: 'Test drop message' });
      expect(spyJob2DoDrop).toHaveBeenCalledWith({ message: 'Test drop message' });
    }, 300);
    it(`Should stop preventing new jobs to be added to the limiter and wait for already scheduled jobs to complete when dropWaitingJobs options is false`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });
      const spySchedule = jest.spyOn(bottleneck, 'schedule');
      jest.spyOn(bottleneck['_states'], 'counts', 'get').mockReturnValue([1, 0, 0, 0]);
      const iniTime = Date.now();

      // Schedule a job
      const promise1 = bottleneck
        .schedule(() => {
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
          return Promise.resolve('job1 executed');
        });
      // Schedule another job to stay enqueued until job1 is executed
      const promise2 = bottleneck
        .schedule(() => {
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
          return Promise.resolve('job2 executed');
        });
      // Stop the limiter
      const promiseStop = bottleneck
        .stop({
          dropWaitingJobs: false,
          enqueueErrorMessage: 'Test stop enqueue error message',
        })
        .then(() => {
          return Promise.resolve(Math.floor((Date.now() - iniTime) / 1000));
        });
      expect(spySchedule).toHaveBeenCalledWith({ priority: 9, weight: 0 }, expect.anything());
      // Try to schedule a new job after stopping the limiter
      const promise3 = bottleneck
        .schedule(() => {
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(error).toBeInstanceOf(Crash);
          expect(error.message).toBe('Test stop enqueue error message');
          return Promise.resolve('job3 not enqueued');
        });

      Promise.all([promiseStop, promise1, promise2, promise3]).then(
        ([resultStop, result1, result2, result3]) => {
          // Waited for jobs 1 and 2 to complete even when limiter was stopped
          expect(result1).toBe('job1 executed');
          expect(result2).toBe('job2 executed');
          // Failed to schedule job3 after stopping the limiter
          expect(result3).toBe('job3 not enqueued');
          // Stop resolved after jobs 1 and 2 were completed
          expect(resultStop).toBe(2);
          done();
        }
      );
    }, 300);
    it(`Should stop preventing new jobs to be added to the limiter and drop already scheduled jobs when dropWaitingJobs options is true`, done => {
      // const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });
      const bottleneck = new Bottleneck({
        minTime: 1000,
        maxConcurrent: 1,
        datastore: 'local',
      });

      const spySchedule = jest.spyOn(bottleneck, 'schedule');
      // jest.spyOn(bottleneck['_states'], 'counts', 'get').mockReturnValue([0, 0, 0, 0]);
      const iniTime = Date.now();

      // Schedule a job
      const promise1 = bottleneck
        .schedule({ id: 'job1' }, () => {
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
          return Promise.resolve('job1 executed');
        })
        .catch(error => {
          console.log('error ', error);
        });
      // Schedule another job to stay enqueued until job1 is executed
      const promise2 = bottleneck
        .schedule({ id: 'job2' }, () => {
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          // expect(error).toBeInstanceOf(Crash);
          // expect(error.message).toBe('Test stop drop error message');
          return Promise.resolve('job2 dropped');
        });
      // Stop the limiter
      const promiseStop = bottleneck
        .stop({
          dropWaitingJobs: true,
          enqueueErrorMessage: 'Test stop enqueue error message',
          dropErrorMessage: 'Test stop drop error message',
        })
        .then(() => {
          return Promise.resolve(Math.floor((Date.now() - iniTime) / 1000));
        });
      // Try to schedule a new job after stopping the limiter
      const promise3 = bottleneck
        .schedule({ id: 'job3' }, () => {
          return new Promise(resolve => setTimeout(resolve, 1000));
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          // expect(error).toBeInstanceOf(Crash);
          // expect(error.message).toBe('Test stop enqueue error message');
          return Promise.resolve('job3 not enqueued');
        });

      promiseStop
        .then(result => {
          console.log('promiseStop resolved: ', result);
          done();
        })
        .catch(error => {
          console.log('promiseStop rejected');
          done(error);
        });

      // Promise.all([promiseStop, promise1, promise2, promise3]).then(
      //   ([resultStop, result1, result2, result3]) => {
      //     // Waited for job1 complete even when limiter was stopped (executing)
      //     expect(result1).toBe('job1 executed');
      //     // Dropped job2 after stopping the limiter (enqueued)
      //     expect(result2).toBe('job2 executed');
      //     // Failed to schedule job3 after stopping the limiter
      //     expect(result3).toBe('job3 not enqueued');
      //     // Stop resolved after only job1 was completed
      //     expect(resultStop).toBe(1);
      //     done();
      //   }
      // );
    }, 300);
    it(`Should schedule a job`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });

      const spyDoReceive = jest.spyOn(Job.prototype, 'doReceive');
      const spySubmitLockSchedule = jest.spyOn(bottleneck['_submitLock'], 'schedule');

      // Schedule a job
      bottleneck
        .schedule({ id: 'job1' }, () => {
          // return Promise.resolve('job1 executed');
          return new Promise(resolve =>
            setTimeout(() => {
              resolve('job1 executed');
            }, 3000)
          );
        })
        .then(result => {
          expect(result).toBe('job1 executed');
          expect(spyDoReceive).toHaveBeenCalled();
          expect(spySubmitLockSchedule).toHaveBeenCalled();
          done();
        });
    }, 300);
    it(`Should schedule multiple jobs`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });

      const spyDoReceive = jest.spyOn(Job.prototype, 'doReceive');
      const spySubmitLockSchedule = jest.spyOn(bottleneck['_submitLock'], 'schedule');

      // TODO: Schedule multiple jobs
      bottleneck
        .schedule({ id: 'job1' }, () => {
          // return Promise.resolve('job1 executed');
          return new Promise(resolve =>
            setTimeout(() => {
              resolve('job1 executed');
            }, 3000)
          );
        })
        .then(result => {
          expect(result).toBe('job1 executed');
          expect(spyDoReceive).toHaveBeenCalled();
          expect(spySubmitLockSchedule).toHaveBeenCalled();
          done();
        });
    }, 300);
    it(`Should wrap the provided function to be rate limited`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });
      const spySubmitLockSchedule = jest.spyOn(bottleneck['_submitLock'], 'schedule');

      const fn = () => Promise.resolve('job1 wrap');
      const wrapped = bottleneck.wrap(fn);

      // TODO: Finish when schedule works
      // wrapped.then((result: any) => {
      //   expect(result).toBe('job1 wrap');
      //   expect(spySubmitLockSchedule).toHaveBeenCalled();
      //   done();
      // });
      done();
    }, 300);
    it(`Should update settings by calling 'update settings' method of store`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });
      const spyStoreUpdateSettings = jest.spyOn(bottleneck.store, '__updateSettings__');

      const newSettings = {
        minTime: 2000,
        highWater: 10,
        connection: new Redis(),
        rejectOnDrop: false,
      };

      bottleneck.updateSettings(newSettings).then(result => {
        expect(result).toBe(bottleneck);
        expect(spyStoreUpdateSettings).toHaveBeenCalledWith({ minTime: 2000 });
        expect(bottleneck['datastore']).toEqual('local');
        expect(bottleneck['connection']).toBeNull();
        expect(bottleneck['_rejectOnDrop']).toBe(false);
        done();
      });
    }, 300);
    it(`Should return current reservoir by calling method of store`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });
      const spyStoreCurrentReservoir = jest
        .spyOn(bottleneck.store, '__currentReservoir__')
        .mockResolvedValue(5);

      bottleneck.currentReservoir().then(result => {
        expect(spyStoreCurrentReservoir).toHaveBeenCalled();
        expect(result).toBe(5);
        done();
      });
    }, 300);
    it(`Should increment reservoir and return new reservoir value by calling method of store`, done => {
      const bottleneck = new Bottleneck({ minTime: 1000, maxConcurrent: 1, datastore: 'local' });
      const spyStoreIncrementReservoir = jest
        .spyOn(bottleneck.store, '__incrementReservoir__')
        .mockResolvedValue(5);

      bottleneck.incrementReservoir(2).then(result => {
        expect(spyStoreIncrementReservoir).toHaveBeenCalledWith(2);
        expect(result).toBe(5);
        done();
      });
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should not create an instance of Bottleneck and throw an error when datastore option is not valid`, () => {
      let bottleneck: Bottleneck | undefined;
      try {
        bottleneck = new Bottleneck({
          minTime: 100,
          maxConcurrent: 5,
          datastore: 'invalidDatastore',
        });
      } catch (error: any) {
        expect(bottleneck).toBeUndefined();
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toBe('Invalid datastore type: invalidDatastore');
      }
    }, 300);
    it(`Should drain nothing when registration from store returns success as false`, done => {
      jest.useFakeTimers().setSystemTime(0);
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyQueued = jest.spyOn(bottleneck, 'queued').mockReturnValueOnce(1);
      const mockDLList = new DLList<Job>(
        () => jest.fn(),
        () => jest.fn()
      );
      const mockJob1 = new Job(
        jest.fn(),
        [],
        { weight: 5, expiration: 100 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const spyQueuesGetFirst = jest
        .spyOn(bottleneck['_queues'], 'getFirst')
        .mockReturnValue(mockDLList);
      const spyQueueFirstJob = jest.spyOn(mockDLList, 'first').mockReturnValue(mockJob1);
      const spyEventsTrigger = jest.spyOn(bottleneck.events, 'trigger').mockImplementation();
      const spyRandomIndex = jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('randomIdx');
      const spyStoreRegister = jest.spyOn(bottleneck.store, '__register__').mockResolvedValue({
        success: false,
      });
      const spyQueueShift = jest.spyOn(mockDLList, 'shift').mockReturnValue(mockJob1);
      const spyEmpty = jest.spyOn(bottleneck, 'empty').mockReturnValue(true);
      const spyJobDoRun = jest.spyOn(mockJob1, 'doRun').mockImplementation();
      const spyJobDoExecute = jest.spyOn(mockJob1, 'doExecute').mockImplementation();
      const spyJobDoExpire = jest.spyOn(mockJob1, 'doExpire').mockImplementation();

      bottleneck.drainAll(10).then(totalDrained => {
        expect(spyQueued).toHaveBeenCalledTimes(1);
        expect(spyQueuesGetFirst).toHaveBeenCalledTimes(1);
        expect(spyQueueFirstJob).toHaveBeenCalledTimes(1);
        expect(spyStoreRegister).toHaveBeenCalledWith('randomIdx', 5, 100);
        expect(spyQueueShift).not.toHaveBeenCalledWith();
        expect(spyEmpty).not.toHaveBeenCalledWith();
        expect(spyEventsTrigger).not.toHaveBeenCalledWith('empty');
        expect(spyEventsTrigger).not.toHaveBeenCalledWith('depleted', true);
        expect(spyJobDoRun).not.toHaveBeenCalled();
        expect(bottleneck['_scheduled']['randomIdx']).toBeUndefined();
        expect(spyJobDoExecute).not.toHaveBeenCalled();
        expect(spyJobDoExpire).not.toHaveBeenCalled();

        expect(totalDrained).toBe(0);
        done();
      });
    }, 300);
    it(`Should drain nothing and trigger an error event when single drain fails due to register from store fails`, done => {
      jest.useFakeTimers().setSystemTime(0);
      const bottleneck = new Bottleneck({ minTime: 100, maxConcurrent: 5, datastore: 'local' });
      const spyQueued = jest.spyOn(bottleneck, 'queued').mockReturnValueOnce(1);
      const mockDLList = new DLList<Job>(
        () => jest.fn(),
        () => jest.fn()
      );
      const mockJob1 = new Job(
        jest.fn(),
        [],
        { weight: 5, expiration: 100 },
        false,
        bottleneck.events,
        new States([...DEFAULT_STATES_NAMES, 'DONE'])
      );
      const spyQueuesGetFirst = jest
        .spyOn(bottleneck['_queues'], 'getFirst')
        .mockReturnValue(mockDLList);
      const spyQueueFirstJob = jest.spyOn(mockDLList, 'first').mockReturnValue(mockJob1);
      const spyEventsTrigger = jest.spyOn(bottleneck.events, 'trigger').mockImplementation();
      const spyRandomIndex = jest.spyOn(bottleneck, 'randomIndex').mockReturnValue('randomIdx');
      const spyStoreRegister = jest
        .spyOn(bottleneck.store, '__register__')
        .mockImplementation(() => Promise.reject(new Error('Register error from store')));
      const spyQueueShift = jest.spyOn(mockDLList, 'shift').mockReturnValue(mockJob1);
      const spyEmpty = jest.spyOn(bottleneck, 'empty').mockReturnValue(true);
      const spyJobDoRun = jest.spyOn(mockJob1, 'doRun').mockImplementation();
      const spyJobDoExecute = jest.spyOn(mockJob1, 'doExecute').mockImplementation();
      const spyJobDoExpire = jest.spyOn(mockJob1, 'doExpire').mockImplementation();

      bottleneck.drainAll(10).then(() => {
        expect(spyQueued).toHaveBeenCalledTimes(1);
        expect(spyQueuesGetFirst).toHaveBeenCalledTimes(1);
        expect(spyQueueFirstJob).toHaveBeenCalledTimes(1);
        expect(spyStoreRegister).toHaveBeenCalledWith('randomIdx', 5, 100);
        expect(spyQueueShift).not.toHaveBeenCalledWith();
        expect(spyEmpty).not.toHaveBeenCalledWith();
        expect(spyEventsTrigger).not.toHaveBeenCalledWith('empty');
        expect(spyEventsTrigger).not.toHaveBeenCalledWith('depleted', true);
        expect(spyJobDoRun).not.toHaveBeenCalled();
        expect(bottleneck['_scheduled']['randomIdx']).toBeUndefined();
        expect(spyJobDoExecute).not.toHaveBeenCalled();
        expect(spyJobDoExpire).not.toHaveBeenCalled();

        expect(spyEventsTrigger).toHaveBeenCalledWith(
          'error',
          new Error('Register error from store')
        );
        done();
      });
    }, 300);
  });
});
