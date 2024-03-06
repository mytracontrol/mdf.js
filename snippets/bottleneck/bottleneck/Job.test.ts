/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { DEFAULT_PRIORITY, EventInfoRetryable } from '.';
import { Job } from './Job';
import { States } from './States';

class BottleneckMock extends EventEmitter {
  constructor() {
    super();
  }
  schedule(): Promise<void> {
    return Promise.resolve();
  }
}
const jobOptions = {
  priority: 1,
  weight: 1,
  expiration: 1,
  id: 'job1',
};
const states = new States(true);
const bottleneckMock = new BottleneckMock();

describe('#Puller #Job', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it(`Should create a new instance of Job`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options).toEqual({
        priority: 1,
        weight: 1,
        expiration: 1,
        id: 'job1',
      });
    }, 300);
    it(`Should create a new instance of Job sanitizing the priority when it is not an integer`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(
        task,
        args,
        { ...jobOptions, priority: 3.14 },

        false,
        bottleneckMock,
        states
      );
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options).toEqual({
        priority: DEFAULT_PRIORITY,
        weight: 1,
        expiration: 1,
        id: 'job1',
      });
    }, 300);
    it(`Should create a new instance of Job sanitizing the priority when it is a negative number`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(
        task,
        args,
        { ...jobOptions, priority: -3 },

        false,
        bottleneckMock,
        states
      );
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options).toEqual({
        priority: 0,
        weight: 1,
        expiration: 1,
        id: 'job1',
      });
    }, 300);
    it(`Should create a new instance of Job sanitizing the priority when it is greater than the number of priorities minus 1`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(
        task,
        args,
        { ...jobOptions, priority: 10 },

        false,
        bottleneckMock,
        states
      );
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options).toEqual({
        priority: 9,
        weight: 1,
        expiration: 1,
        id: 'job1',
      });
    }, 300);
    it(`Should create a new instance of Job adding a random index to the id when it is the default`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, { priority: 1 }, false, bottleneckMock, states);
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options.id).toContain('<no-id>-');
      expect(job.options.id.slice(8).length).toBeGreaterThan(0);
    }, 300);
    it(`Should start the job status at RECEIVED`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();

      job.doReceive();
      expect(states.jobStatus('job1')).toBe('RECEIVED');
      expect(eventSpy).toHaveBeenCalledWith('received', { args, options: jobOptions });
    }, 300);
    it(`Should update the job status to QUEUED`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      expect(states.jobStatus('job1')).toBe('QUEUED');
      expect(eventSpy).toHaveBeenCalledWith('queued', {
        args,
        options: jobOptions,
        reachedHWM: false,
        blocked: false,
      });
    }, 300);
    it(`Should update the job status from QUEUED to RUNNING when it is first run (no retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      expect(states.jobStatus('job1')).toBe('RUNNING');
      expect(eventSpy).toHaveBeenCalledWith('scheduled', {
        args,
        options: jobOptions,
      });
    }, 300);
    it(`Should keep the job to be RUN status at EXECUTING when it has been executed before (retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      // Simulate previous execution
      states.next('job1');
      states.next('job1');
      job['_retryCount'] = 1; //temporal, private property
      // Run again (retry)
      job.doRun();
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(eventSpy).toHaveBeenCalledWith('scheduled', {
        args,
        options: jobOptions,
      });
    }, 300);
    it(`Should update the job status from RUNNING to EXECUTING and execute its task when it is first run (no retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job.doExecute(
        () => false,
        () => Promise.resolve(),
        () => Promise.resolve()
      );
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(eventSpy).toHaveBeenCalledWith('executing', {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(task).toHaveBeenCalledWith(1, 2, 3);
    }, 300);
    it(`Should keep the job status at EXECUTING and execute its task when it has been executed before (retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      // Simulate previous execution
      states.next('job1');
      job['_retryCount'] = 1; //temporal, private property
      // Execute again
      job.doExecute(
        () => false,
        () => Promise.resolve(),
        () => Promise.resolve()
      );
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(eventSpy).toHaveBeenCalledWith('executing', {
        args,
        options: jobOptions,
        retryCount: 1,
      });
      expect(task).toHaveBeenCalledWith(1, 2, 3);
    }, 300);
    it(`Should update the job status to EXECUTING and schedule the corresponding task when a chained limiter is provided`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();
      const mockLimiterChained = new BottleneckMock();
      const spyLimiterSchedule = jest.spyOn(mockLimiterChained, 'schedule');

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job.doExecute(
        () => false,
        () => Promise.resolve(),
        () => Promise.resolve(),
        // @ts-ignore - mock limiter
        mockLimiterChained
      );
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(eventSpy).toHaveBeenCalledWith('executing', {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(spyLimiterSchedule).toHaveBeenCalledWith(jobOptions, task, 1, 2, 3);
    }, 300);
    it(`Should update the job status to EXECUTING and, after execution, to DONE when clearGlobalState returns true`, async () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();
      const free = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      await job.doExecute(
        () => true,
        () => Promise.resolve(),
        free
      );
      const result = await job.promise;
      expect(task).toHaveBeenCalledWith(1, 2, 3);
      expect(states.jobStatus('job1')).toBe('DONE');
      expect(eventSpy).toHaveBeenCalledWith('executing', {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(eventSpy).toHaveBeenCalledWith('done', {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(free).toHaveBeenCalledWith(jobOptions, {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(result).toBe(100);
    }, 300);
    it(`Should update the job status to EXECUTING and, after execution, remove it when DONE status is not being tracked`, async () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const statesWithoutDone = new States(false);
      const job = new Job(task, args, jobOptions, false, bottleneckMock, statesWithoutDone);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();
      const free = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      await job.doExecute(
        () => true,
        () => Promise.resolve(),
        free
      );
      const result = await job.promise;
      expect(task).toHaveBeenCalledWith(1, 2, 3);
      expect(statesWithoutDone.jobStatus('job1')).toBe(null);
      expect(eventSpy).toHaveBeenCalledWith('executing', {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(eventSpy).toHaveBeenCalledWith('done', {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(free).toHaveBeenCalledWith(jobOptions, {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(result).toBe(100);
    }, 300);
    it(`Should retry the expired job when it comes from RUNNING state, clearGlobalState returns true and 'failed' event is handled`, async () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      let onCallBack: any;
      const eventSpy = jest
        .spyOn(bottleneckMock, 'emit')
        .mockImplementation(
          (
            eventName: string | symbol,
            error: Crash | Error,
            info: EventInfoRetryable,
            callback: (time?: number) => void
          ): boolean => {
            if (eventName === 'failed') {
              onCallBack = callback;
              callback(25);
            }
            return true;
          }
        );
      const free = jest.fn(() => Promise.resolve());
      const run = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      await job.doExpire(() => true, run, free);
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(eventSpy).toHaveBeenNthCalledWith(
        4,
        'failed',
        new Crash(`This job timed out after 1 ms.`),
        { args, options: jobOptions, retryCount: 0 },
        onCallBack
      );
      expect(eventSpy).toHaveBeenNthCalledWith(5, 'retry', `Retrying job1 after 25 ms`, {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(job['_retryCount']).toBe(1);
      expect(run).toHaveBeenCalledWith(25);
    }, 300);
    it(`Should retry the expired job when it comes from EXECUTING state, clearGlobalState returns true and 'failed' event is handled`, async () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      let onCallBack: any;
      const eventSpy = jest
        .spyOn(bottleneckMock, 'emit')
        .mockImplementation(
          (
            eventName: string | symbol,
            error: Crash | Error,
            info: EventInfoRetryable,
            callback: (time?: number) => void
          ): boolean => {
            if (eventName === 'failed') {
              onCallBack = callback;
              callback(25);
            }
            return true;
          }
        );
      const free = jest.fn(() => Promise.resolve());
      const run = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      states.next('job1'); // Simulate execution state
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      await job.doExpire(() => true, run, free);
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(eventSpy).toHaveBeenNthCalledWith(
        4,
        'failed',
        new Crash(`This job timed out after 1 ms.`),
        { args, options: jobOptions, retryCount: 0 },
        onCallBack
      );
      expect(eventSpy).toHaveBeenNthCalledWith(5, 'retry', `Retrying job1 after 25 ms`, {
        args,
        options: jobOptions,
        retryCount: 0,
      });
      expect(job['_retryCount']).toBe(1);
      expect(run).toHaveBeenCalledWith(25);
    }, 300);
    it(`Should do nothing when clearGlobalState returns false`, async () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const free = jest.fn(() => Promise.resolve());
      const run = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      await job.doExpire(() => false, run, free);
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      expect(run).not.toHaveBeenCalled();
      expect(free).not.toHaveBeenCalled();
    }, 300);
    it(`Should remove the job to be dropped from states tracking and trigger a 'dropped' event`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit');
      const spyRemove = jest.spyOn(states, 'remove').mockImplementation(() => true);

      job.doReceive();
      const result = job.doDrop({});
      expect(spyRemove).toHaveBeenCalledWith('job1');
      expect(eventSpy).toHaveBeenCalledWith('dropped', {
        args,
        options: jobOptions,
        task,
        promise: job.promise,
      });
      expect(result).toBe(true);
    }, 300);
    it(`Should do nothing and return false when the job to be dropped is not in states tracking`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit');
      const spyRemove = jest.spyOn(states, 'remove').mockImplementation(() => false);

      job.doReceive();
      const result = job.doDrop({});
      expect(spyRemove).toHaveBeenCalledWith('job1');
      expect(eventSpy).not.toHaveBeenCalledWith('dropped', {
        args,
        options: jobOptions,
        task,
        promise: job.promise,
      });
      expect(result).toBe(false);
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should throw an error when the status assert fails`, async () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const free = jest.fn(() => Promise.resolve());

      job.doReceive();
      try {
        await job.doExecute(
          () => true,
          () => Promise.resolve(),
          free
        );
        throw new Error('Should not be here');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toContain(
          'Invalid job status RECEIVED, expected RUNNING.'
        );
      }
    }, 300);
    it(`Should reject the promise of the executed job when the task fails`, async () => {
      const task = jest.fn(() => Promise.reject(new Crash('Task failed')));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit').mockImplementation();
      const free = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      try {
        await job.doExecute(
          () => true,
          () => Promise.resolve(),
          free
        );
        throw new Error('Should not be here');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(task).toHaveBeenCalledWith(1, 2, 3);
        expect(eventSpy).toHaveBeenCalledWith('executing', {
          args,
          options: jobOptions,
          retryCount: 0,
        });
        expect(free).toHaveBeenCalledWith(jobOptions, {
          args,
          options: jobOptions,
          retryCount: 0,
        });
        expect(states.jobStatus('job1')).toBe('DONE');
        expect((error as Crash).message).toBe('Task failed');
      }
    }, 300);
    it(`Should not retry the expired job and reject job promise when 'failed' event is not handled`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest
        .spyOn(bottleneckMock, 'emit')
        .mockImplementation(
          (
            eventName: string | symbol,
            error: Crash | Error,
            info: EventInfoRetryable,
            callback: (time?: number) => void
          ): boolean => {
            callback();
            return true;
          }
        );
      const free = jest.fn(() => Promise.resolve());
      const run = jest.fn(() => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job
        .doExpire(() => true, run, free)
        .then(() => {
          return job.promise;
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(states.jobStatus('job1')).toBe('DONE');
          expect(eventSpy).toHaveBeenCalledWith('done', {
            args,
            options: jobOptions,
            retryCount: 0,
          });
          expect(free).toHaveBeenCalledWith(jobOptions, {
            args,
            options: jobOptions,
            retryCount: 0,
          });
          expect(error).toBeInstanceOf(Crash);
          expect(error.message).toBe(`This job timed out after 1 ms.`);
          done();
        });
    }, 300);
    it(`Should reject the promise of the job to be dropped when configured to do so`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit');
      const spyRemove = jest.spyOn(states, 'remove').mockImplementation(() => true);

      job.doReceive();
      const result = job.doDrop({});
      expect(spyRemove).toHaveBeenCalledWith('job1');
      expect(eventSpy).toHaveBeenCalledWith('dropped', {
        args,
        options: jobOptions,
        task,
        promise: job.promise,
      });
      expect(result).toBe(true);
      job.promise
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch((err: Error) => {
          expect(err.message).toBe('This job has been dropped by Bottleneck');
        });
    }, 300);
    it(`Should reject the promise of the job to be dropped with a custom error message when configured to do so`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit');
      const spyRemove = jest.spyOn(states, 'remove').mockImplementation(() => true);

      job.doReceive();
      const result = job.doDrop({ message: 'My custom drop message' });
      expect(spyRemove).toHaveBeenCalledWith('job1');
      expect(eventSpy).toHaveBeenCalledWith('dropped', {
        args,
        options: jobOptions,
        task,
        promise: job.promise,
      });
      expect(result).toBe(true);
      job.promise
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch((err: Error) => {
          expect(err.message).toBe('My custom drop message');
        });
    }, 300);
    it(`Should reject the promise of the job to be dropped with a custom error object when configured to do so`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, false, bottleneckMock, states);
      const eventSpy = jest.spyOn(bottleneckMock, 'emit');
      const spyRemove = jest.spyOn(states, 'remove').mockImplementation(() => true);

      job.doReceive();
      const result = job.doDrop({
        message: 'My custom drop message',
        error: new Error('My custom drop error'),
      });
      expect(spyRemove).toHaveBeenCalledWith('job1');
      expect(eventSpy).toHaveBeenCalledWith('dropped', {
        args,
        options: jobOptions,
        task,
        promise: job.promise,
      });
      expect(result).toBe(true);
      job.promise
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch((err: Error) => {
          expect(err.message).toBe('My custom drop error');
        });
    }, 300);
  });
});
