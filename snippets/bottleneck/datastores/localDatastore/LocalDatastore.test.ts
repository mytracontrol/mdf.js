/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LOCAL_STORE_DEFAULTS, LocalDatastore, STORE_DEFAULTS } from '..';
import { Bottleneck, STRATEGY } from '../../bottleneck';

describe('#Puller #LocalDatastore', () => {
  const storeOptions = STORE_DEFAULTS;
  const localStoreOptions = LOCAL_STORE_DEFAULTS;
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  describe('#Happy path', () => {
    it(`Should create an instance of LocalDatastore`, () => {
      const bottleneck = new Bottleneck({});
      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      expect(localDatastore).toBeDefined();
      expect(localDatastore).toBeInstanceOf(LocalDatastore);
      expect(localDatastore.heartbeat).toBeUndefined();
    }, 300);
    it(`Should create an instance of LocalDatastore starting heartbeat when reservoir refresh params are provided`, () => {
      jest.useFakeTimers();
      const bottleneck = new Bottleneck({});
      const spyDrainAll = jest.spyOn(bottleneck, 'drainAll').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        {
          ...storeOptions,
          reservoir: 10,
          reservoirRefreshInterval: 60 * 1000,
          reservoirRefreshAmount: 20,
        },
        localStoreOptions
      );
      expect(localDatastore).toBeDefined();
      expect(localDatastore).toBeInstanceOf(LocalDatastore);
      expect(localDatastore.heartbeat).toBeDefined();

      jest.advanceTimersByTime(60000);
      expect(localDatastore['_storeOptions']['reservoir']).toBe(20);
      expect(spyDrainAll).toHaveBeenCalledTimes(1);
      expect(spyDrainAll).toHaveBeenCalledWith(20);
    }, 300);
    it(`Should create an instance of LocalDatastore starting heartbeat when reservoir increase params are provided`, () => {
      jest.useFakeTimers();
      const bottleneck = new Bottleneck({});
      const spyDrainAll = jest.spyOn(bottleneck, 'drainAll').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        {
          ...storeOptions,
          reservoir: 10,
          reservoirIncreaseInterval: 60 * 1000,
          reservoirIncreaseAmount: 5,
          reservoirIncreaseMaximum: 20,
        },
        localStoreOptions
      );
      expect(localDatastore).toBeDefined();
      expect(localDatastore).toBeInstanceOf(LocalDatastore);
      expect(localDatastore.heartbeat).toBeDefined();

      jest.advanceTimersByTime(60000);
      expect(localDatastore['_storeOptions']['reservoir']).toBe(15);
      expect(spyDrainAll).toHaveBeenCalledWith(15);

      jest.advanceTimersByTime(60000);
      expect(localDatastore['_storeOptions']['reservoir']).toBe(20);
      expect(spyDrainAll).toHaveBeenCalledWith(20);

      jest.advanceTimersByTime(60000);
      expect(localDatastore['_storeOptions']['reservoir']).toBe(20);
      expect(spyDrainAll).toHaveBeenCalledTimes(2);
    }, 300);
    it(`Should publish a message triggering the 'message' event`, done => {
      const bottleneck = new Bottleneck({});
      const spyEventTrigger = jest.spyOn(bottleneck.events, 'trigger').mockImplementation();

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore.__publish__('Test message').then(() => {
        expect(spyEventTrigger).toHaveBeenCalledWith('message', 'Test message');
        done();
      });
    }, 300);
    it(`Should disconnect ans clear heartbeat interval`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore.__disconnect__(true).then(() => {
        expect(localDatastore.heartbeat).toBeUndefined();
        done();
      });
    }, 300);
    it(`Should update local store settings and restart the heartbeat interval according to them`, done => {
      jest.useFakeTimers();
      const bottleneck = new Bottleneck({});
      const spyDrainAll = jest.spyOn(bottleneck, 'drainAll').mockImplementation();

      const newSettings = {
        reservoir: 10,
        reservoirRefreshInterval: 60 * 1000,
        reservoirRefreshAmount: 20,
      };
      const expectedStoreOptions = {
        ...storeOptions,
        ...newSettings,
      };

      const localDatastore = new LocalDatastore(bottleneck, { ...storeOptions }, localStoreOptions);
      expect(localDatastore.heartbeat).toBeUndefined();

      localDatastore.__updateSettings__(newSettings).then(result => {
        expect(localDatastore['_storeOptions']).toEqual(expectedStoreOptions);
        expect(localDatastore.heartbeat).toBeDefined();
        expect(spyDrainAll).toHaveBeenCalledTimes(1);
        expect(spyDrainAll).toHaveBeenCalledWith(10);

        jest.advanceTimersByTime(60000);
        expect(localDatastore['_storeOptions']['reservoir']).toBe(20);
        expect(spyDrainAll).toHaveBeenCalledTimes(2);
        expect(spyDrainAll).toHaveBeenCalledWith(20);

        expect(result).toEqual(true);
        done();
      });
      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should return the number of 'running' jobs (related to jobs weights)`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore.__running__().then(result => {
        expect(result).toBe(0);
        done();
      });
    }, 300);
    it(`Should return the number of queued jobs`, done => {
      const bottleneck = new Bottleneck({});
      const spyQueued = jest.spyOn(bottleneck, 'queued').mockReturnValue(5);

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore.__queued__().then(result => {
        expect(spyQueued).toHaveBeenCalled();
        expect(result).toBe(5);
        done();
      });
    }, 300);
    it(`Should return the number of done jobs`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore.__done__().then(result => {
        expect(result).toBe(0);
        done();
      });
    }, 300);
    it(`Should do group check and return true when the next request plus timeout is lesser than the given time`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore['_nextRequest'] = 7;
      // No timeout is provided
      localDatastore.__groupCheck__(10).then(result => {
        expect(result).toBe(true);
        done();
      });
    }, 300);
    it(`Should do group check and return true when the next request plus timeout is equal to the given time`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, {
        ...localStoreOptions,
        timeout: 3,
      });
      localDatastore['_nextRequest'] = 7;
      localDatastore.__groupCheck__(10).then(result => {
        expect(result).toBe(true);
        done();
      });
    }, 300);
    it(`Should do group check and return false when the next request plus timeout is greater than the given time`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore['_nextRequest'] = 11;
      // No timeout is provided
      localDatastore.__groupCheck__(10).then(result => {
        expect(result).toBe(false);
        done();
      });
    }, 300);
    it(`Should increment the reservoir by the given increment amount`, done => {
      const bottleneck = new Bottleneck({});
      const spyDrainAll = jest.spyOn(bottleneck, 'drainAll').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, reservoir: 5 },
        localStoreOptions
      );
      localDatastore.__incrementReservoir__(10).then(result => {
        expect(localDatastore['_storeOptions']['reservoir']).toBe(15);
        expect(spyDrainAll).toHaveBeenCalled();
        expect(result).toBe(15);
        done();
      });
    }, 300);
    it(`Should return the current reservoir number when it has been provided`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, reservoir: 5 },
        localStoreOptions
      );
      localDatastore.__currentReservoir__().then(result => {
        expect(localDatastore['_storeOptions']['reservoir']).toBe(5);
        expect(result).toBe(5);
        done();
      });
    }, 300);
    it(`Should return null as the current reservoir number when it has not been provided`, done => {
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore.__currentReservoir__().then(result => {
        expect(localDatastore['_storeOptions']['reservoir']).toBeNull();
        expect(result).toBeNull();
        done();
      });
    }, 300);
    it(`Should do check and return false when next request time has passed`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore['_nextRequest'] = 200;
      localDatastore.__check__(5).then(result => {
        expect(result).toBe(false);
        done();
      });
      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should do check and return false when capacity is not null and lesser than the given weight`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      // Capacity when maxConcurrent and reservoir options are provided
      const localDatastore1 = new LocalDatastore(
        bottleneck,
        { ...storeOptions, maxConcurrent: 10, reservoir: 5 },
        localStoreOptions
      );
      const promise1 = localDatastore1.__check__(15);

      // Capacity when only maxConcurrent option is provided
      const localDatastore2 = new LocalDatastore(
        bottleneck,
        { ...storeOptions, maxConcurrent: 10 },
        localStoreOptions
      );
      const promise2 = localDatastore2.__check__(15);

      // Capacity when only reservoir option is provided
      const localDatastore3 = new LocalDatastore(
        bottleneck,
        { ...storeOptions, maxConcurrent: 10 },
        localStoreOptions
      );
      const promise3 = localDatastore3.__check__(15);

      Promise.all([promise1, promise2, promise3]).then(results => {
        expect(results).toEqual([false, false, false]);
        done();
      });
      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should do check and return true when next request time has passed and capacity is null`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      // Capacity is null when neither maxConcurrent nor reservoir options are provided
      const localDatastore = new LocalDatastore(bottleneck, storeOptions, localStoreOptions);
      localDatastore['_nextRequest'] = 50; // time passed
      localDatastore.__check__(5).then(result => {
        expect(result).toBe(true);
        done();
      });
      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should do check and return true when next request time has passed and capacity is greater than/equal to given weight`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, maxConcurrent: 10 },
        localStoreOptions
      );
      localDatastore['_nextRequest'] = 100; // time passed

      // Capacity is greater than given weight
      const promise1 = localDatastore.__check__(5);
      // Capacity is equal to given weight
      const promise2 = localDatastore.__check__(10);

      Promise.all([promise1, promise2]).then(result => {
        expect(result).toEqual([true, true]);
        done();
      });
      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should register by returning success result when weight conditions are met but reservoir and minTime options are not provided`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(bottleneck, { ...storeOptions }, localStoreOptions);
      localDatastore.__register__('index', 5, 0).then(result => {
        expect(localDatastore['_running']).toBe(5);
        expect(localDatastore['_nextRequest']).toBe(100);
        expect(result).toEqual({ success: true, wait: 0, reservoir: null });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should register by returning success result when weight conditions are met and reservoir and minTime options are provided`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, reservoir: 10, minTime: 50 },
        localStoreOptions
      );
      localDatastore['_nextRequest'] = 125;

      localDatastore.__register__('index', 5, 0).then(result => {
        expect(localDatastore['_running']).toBe(5);
        expect(localDatastore['_nextRequest']).toBe(175);
        expect(result).toEqual({ success: true, wait: 25, reservoir: 5 });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should register by returning fail result when weight conditions are not met`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, reservoir: 10 },
        localStoreOptions
      );

      localDatastore.__register__('index', 15, 0).then(result => {
        expect(localDatastore['_running']).toBe(0);
        expect(localDatastore['_nextRequest']).toBe(100);
        expect(result).toEqual({ success: false });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should submit by returning submission result when strategy is 'BLOCK', high water mark is reached and penalty time is provided`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});
      const spyDropAllQueued = jest.spyOn(bottleneck, 'dropAllQueued').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, minTime: 50, highWater: 10, strategy: STRATEGY.BLOCK, penalty: 25 },
        localStoreOptions
      );
      localDatastore['_nextRequest'] = 150;

      localDatastore.__submit__(10, 5).then(result => {
        expect(localDatastore['_unblockTime']).toBe(125);
        expect(localDatastore['_nextRequest']).toBe(175);
        expect(spyDropAllQueued).toHaveBeenCalled();
        expect(result).toEqual({ reachedHWM: true, blocked: true, strategy: 3 });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should submit by returning submission result when strategy is 'BLOCK', high water mark is reached and penalty time is not provided`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});
      const spyDropAllQueued = jest.spyOn(bottleneck, 'dropAllQueued').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, minTime: 50, highWater: 10, strategy: STRATEGY.BLOCK },
        localStoreOptions
      );
      localDatastore['_nextRequest'] = 150;

      localDatastore.__submit__(10, 5).then(result => {
        expect(localDatastore['_unblockTime']).toBe(850);
        expect(localDatastore['_nextRequest']).toBe(900);
        expect(spyDropAllQueued).toHaveBeenCalled();
        expect(result).toEqual({ reachedHWM: true, blocked: true, strategy: 3 });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should submit by returning submission result when strategy is 'BLOCK' and high water mark is not reached but there is time block`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});
      const spyDropAllQueued = jest.spyOn(bottleneck, 'dropAllQueued').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, strategy: STRATEGY.BLOCK },
        localStoreOptions
      );
      localDatastore['_unblockTime'] = 100;
      localDatastore['_nextRequest'] = 50;

      localDatastore.__submit__(10, 5).then(result => {
        expect(localDatastore['_unblockTime']).toBe(5100);
        expect(localDatastore['_nextRequest']).toBe(5100);
        expect(spyDropAllQueued).toHaveBeenCalled();
        expect(result).toEqual({ reachedHWM: false, blocked: true, strategy: 3 });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should submit by returning submission result when strategy is not 'BLOCK'`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});
      const spyDropAllQueued = jest.spyOn(bottleneck, 'dropAllQueued').mockImplementation();

      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, strategy: STRATEGY.LEAK, penalty: 25 },
        localStoreOptions
      );
      localDatastore['_nextRequest'] = 150;

      localDatastore.__submit__(10, 5).then(result => {
        expect(localDatastore['_unblockTime']).toBe(0);
        expect(localDatastore['_nextRequest']).toBe(150);
        expect(spyDropAllQueued).not.toHaveBeenCalled();
        expect(result).toEqual({ reachedHWM: false, blocked: false, strategy: 1 });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
    it(`Should free by returning free result`, done => {
      jest.useFakeTimers().setSystemTime(100);
      const bottleneck = new Bottleneck({});
      const spyDrainAll = jest.spyOn(bottleneck, 'drainAll').mockImplementation();

      const localDatastore = new LocalDatastore(bottleneck, { ...storeOptions }, localStoreOptions);
      localDatastore['_running'] = 15;
      localDatastore['_done'] = 10;

      localDatastore.__free__('testIndex', 10).then(result => {
        expect(localDatastore['_running']).toBe(5);
        expect(localDatastore['_done']).toBe(20);
        expect(spyDrainAll).toHaveBeenCalled();
        expect(result).toEqual({ running: 5 });
        done();
      });

      jest.advanceTimersByTime(0);
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should not submit and throw an error when wight is greater than maxConcurrent option`, done => {
      const bottleneck = new Bottleneck({});
      const localDatastore = new LocalDatastore(
        bottleneck,
        { ...storeOptions, maxConcurrent: 5 },
        localStoreOptions
      );
      localDatastore
        .__submit__(10, 6)
        .then(result => {
          throw new Error('Should not be here');
        })
        .catch(err => {
          expect(err).toBeInstanceOf(Crash);
          expect(err.message).toBe(
            'Impossible to add a job having a weight of 6 to a limiter having a maxConcurrent setting of 5'
          );
          done();
        });
    }, 300);
  });
});
