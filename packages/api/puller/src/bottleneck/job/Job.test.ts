/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Job, JobEventInfo, JobOptions, JobOptionsComplete } from '.';
import { Bottleneck, DEFAULT_PRIORITY } from '../bottleneck';
import { BottleneckError } from '../bottleneckError';
import { Events } from '../events';
import { States } from '../states';

describe('#Puller #Job', () => {
  class BottleneckMock extends Bottleneck {
    constructor() {
      super();
    }
    override schedule(): Promise<void> {
      return Promise.resolve();
    }
  }

  let bottleneckMock: BottleneckMock;
  let events: Events;
  let states: States;
  let jobOptions: JobOptions;
  let jobDefaults: JobOptionsComplete;

  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    bottleneckMock = new BottleneckMock();
    events = bottleneckMock.events;
    states = new States(['RECEIVED', 'QUEUED', 'RUNNING', 'EXECUTING', 'DONE']);
    jobOptions = {
      priority: 1,
      weight: 1,
      expiration: 1,
      id: 'job1',
    };
    jobDefaults = {
      priority: 5,
      weight: 1,
      expiration: null,
      id: '<no-id>',
    };
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of Job`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options).toEqual({
        priority: 1,
        weight: 1,
        expiration: 1,
        id: 'job1',
      });
    });

    it(`Should create a new instance of Job sanitizing the priority when it is not an integer`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(
        task,
        args,
        { ...jobOptions, priority: 3.14 },
        jobDefaults,
        false,
        events,
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
    });

    it(`Should create a new instance of Job sanitizing the priority when it is a negative number`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(
        task,
        args,
        { ...jobOptions, priority: -3 },
        jobDefaults,
        false,
        events,
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
    });

    it(`Should create a new instance of Job sanitizing the priority when it is greater than the number of priorities minus 1`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(
        task,
        args,
        { ...jobOptions, priority: 10 },
        jobDefaults,
        false,
        events,
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
    });

    it(`Should create a new instance of Job adding a random index to the id when it is the default`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, { priority: 1 }, jobDefaults, false, events, states);
      expect(job).toBeDefined();
      expect(job).toBeInstanceOf(Job);
      expect(job.options.id).toContain('<no-id>-');
      expect(job.options.id.slice(8).length).toBeGreaterThan(0);
    });

    it(`Should start the job status at RECEIVED`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();

      job.doReceive();
      expect(states.jobStatus('job1')).toBe('RECEIVED');
      expect(eventSpy).toHaveBeenCalledWith('received', { args, options: jobOptions });
    });

    it(`Should update the job status to QUEUED`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      expect(states.jobStatus('job1')).toBe('QUEUED');
      expect(eventSpy).toHaveBeenCalledWith('queued', {
        args,
        options: jobOptions,
        reachedHWM: false,
        blocked: false,
      });
    });

    it(`Should update the job status from QUEUED to RUNNING when it is first run (no retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      expect(states.jobStatus('job1')).toBe('RUNNING');
      expect(eventSpy).toHaveBeenCalledWith('scheduled', {
        args,
        options: jobOptions,
      });
    });

    it(`Should keep the job to be RUN status at EXECUTING when it has been executed before (retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();

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
    });

    it(`Should update the job status from RUNNING to EXECUTING and execute its task when it is first run (no retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job.doExecute(
        null,
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
    });

    it(`Should keep the job status at EXECUTING and execute its task when it has been executed before (retry)`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      // Simulate previous execution
      states.next('job1');
      job['_retryCount'] = 1; //temporal, private property
      // Execute again
      job.doExecute(
        null,
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
    });

    it(`Should update the job status to EXECUTING and schedule the corresponding task when a chained limiter is provided`, () => {
      const task = jest.fn();
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();
      const mockLimiterChained = new BottleneckMock();
      const spyLimiterSchedule = jest.spyOn(mockLimiterChained, 'schedule');

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job.doExecute(
        mockLimiterChained,
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
      expect(spyLimiterSchedule).toHaveBeenCalledWith(jobOptions, task, 1, 2, 3);
    });

    it(`Should update the job status to EXECUTING and, after execution, to DONE when clearGlobalState returns true`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job
        .doExecute(
          null,
          () => true,
          () => Promise.resolve(),
          free
        )
        .then(() => {
          return job.promise;
        })
        .then(result => {
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
          done();
        });
    });

    it(`Should update the job status to EXECUTING and, after execution, remove it when DONE status is not being tracked`, done => {
      const statesWithoutDone = new States(['RECEIVED', 'QUEUED', 'RUNNING', 'EXECUTING']);
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, statesWithoutDone);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job
        .doExecute(
          null,
          () => true,
          () => Promise.resolve(),
          free
        )
        .then(() => {
          return job.promise;
        })
        .then(result => {
          expect(task).toHaveBeenCalledWith(1, 2, 3);
          expect(states.jobStatus('job1')).toBe(null);
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
          done();
        });
    });

    it(`Should retry the expired job when it comes from RUNNING state, clearGlobalState returns true and 'failed' event is handled`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation(() => Promise.resolve(25));
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );
      const run = jest.fn((retryAfter: number) => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job
        .doExpire(() => true, run, free)
        .then(() => {
          expect(states.jobStatus('job1')).toBe('EXECUTING');
          expect(eventSpy).toHaveBeenCalledWith(
            'failed',
            new BottleneckError(`This job timed out after 1 ms.`),
            {
              args,
              options: jobOptions,
              retryCount: 0,
            }
          );
          expect(eventSpy).toHaveBeenCalledWith('retry', `Retrying job1 after 25 ms`, {
            args,
            options: jobOptions,
            retryCount: 0,
          });
          expect(job['_retryCount']).toBe(1);
          expect(run).toHaveBeenCalledWith(25);
          done();
        });
    });

    it(`Should retry the expired job when it comes from EXECUTING state, clearGlobalState returns true and 'failed' event is handled`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation(() => Promise.resolve(25));
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );
      const run = jest.fn((retryAfter: number) => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      states.next('job1'); // Simulate execution state
      expect(states.jobStatus('job1')).toBe('EXECUTING');
      job
        .doExpire(() => true, run, free)
        .then(() => {
          expect(states.jobStatus('job1')).toBe('EXECUTING');
          expect(eventSpy).toHaveBeenCalledWith(
            'failed',
            new BottleneckError(`This job timed out after 1 ms.`),
            {
              args,
              options: jobOptions,
              retryCount: 0,
            }
          );
          expect(eventSpy).toHaveBeenCalledWith('retry', `Retrying job1 after 25 ms`, {
            args,
            options: jobOptions,
            retryCount: 0,
          });
          expect(job['_retryCount']).toBe(1);
          expect(run).toHaveBeenCalledWith(25);
          done();
        });
    });

    it(`Should do nothing when clearGlobalState returns false`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );
      const run = jest.fn((retryAfter: number) => Promise.resolve());

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job
        .doExpire(() => false, run, free)
        .then(() => {
          expect(states.jobStatus('job1')).toBe('EXECUTING');
          expect(run).not.toHaveBeenCalled();
          expect(free).not.toHaveBeenCalled();
          done();
        });
    });

    it(`Should remove the job to be dropped from states tracking and trigger a 'dropped' event`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger');
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
    });

    it(`Should do nothing and return false when the job to be dropped is not in states tracking`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger');
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
    });
  });

  describe('#Sad path', () => {
    it(`Should throw an error when the status assert fails`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );

      job.doReceive();
      job
        .doExecute(
          null,
          () => true,
          () => Promise.resolve(),
          free
        )
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch((error: Error) => {
          expect(error.message).toContain('Invalid job status RECEIVED, expected RUNNING.');
          done();
        });
    });

    it(`Should reject the promise of the executed job when the task fails`, done => {
      const task = jest.fn(() => Promise.reject(new Error('Task failed')));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger').mockImplementation();
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );

      job.doReceive();
      job.doQueue(false, false);
      job.doRun();
      job
        .doExecute(
          null,
          () => true,
          () => Promise.resolve(),
          free
        )
        .then(() => {
          return job.promise;
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch((error: Error) => {
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
          expect(error.message).toBe('Task failed');
          done();
        });
    });
    it(`Should not retry the expired job and reject job promise when 'failed' event is not handled`, done => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest
        .spyOn(events, 'trigger')
        .mockImplementation(() => Promise.resolve(null));
      const free = jest.fn((jobOptions: JobOptionsComplete, eventInfo: JobEventInfo) =>
        Promise.resolve()
      );
      const run = jest.fn((retryAfter: number) => Promise.resolve());

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
          expect(error).toBeInstanceOf(BottleneckError);
          expect(error.message).toBe(`This job timed out after 1 ms.`);
          done();
        });
    });

    it(`Should reject the promise of the job to be dropped when configured to do so`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger');
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
    });

    it(`Should reject the promise of the job to be dropped with a custom error message when configured to do so`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger');
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
    });

    it(`Should reject the promise of the job to be dropped with a custom error object when configured to do so`, () => {
      const task = jest.fn(() => Promise.resolve(100));
      const args = [1, 2, 3];
      const job = new Job(task, args, jobOptions, jobDefaults, false, events, states);
      const eventSpy = jest.spyOn(events, 'trigger');
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
    });
  });
});
