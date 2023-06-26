/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Sync } from '.';

describe('#Puller #Job', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of Sync`, () => {
      const sync = new Sync('syncTest');
      expect(sync).toBeDefined();
      expect(sync).toBeInstanceOf(Sync);
      expect(sync.name).toBe('syncTest');
    });

    it(`Should return true when the queue is empty`, () => {
      const sync = new Sync('syncTest');
      expect(sync.isEmpty()).toBe(true);
    });

    it(`Should return false when the queue is not empty`, () => {
      const sync = new Sync('syncTest');
      const taskItem = {
        task: () => true,
        args: [],
        resolve: null,
        reject: null,
      };
      // Simulate queueing a task
      sync['_queue'].push(taskItem);
      expect(sync.isEmpty()).toBe(false);
    });

    it(`Should schedule a task, run it and resolve the promise when done`, done => {
      const task = jest.fn((num: number, str: string) => {
        return `${num}-${str}`;
      });
      const sync = new Sync('syncTest');
      sync.schedule(task, 1, 'one').then(result => {
        expect(task).toHaveBeenCalledWith(1, 'one');
        expect(result).toBe('1-one');
        expect(sync.isEmpty()).toBe(true);
        done();
      });
    });

    it(`Should schedule multiple tasks, run them and resolve the promises when done`, done => {
      const task = jest.fn((num: number, str: string) => {
        return `${num}-${str}`;
      });
      const sync = new Sync('syncTest');
      const promise1 = sync.schedule(task, 1, 'one');
      const promise2 = sync.schedule(task, 2, 'two');
      const promise3 = sync.schedule(task, 3, 'three');
      Promise.all([promise1, promise2, promise3]).then(results => {
        expect(task).toHaveBeenCalledTimes(3);
        expect(task).toHaveBeenCalledWith(1, 'one');
        expect(task).toHaveBeenCalledWith(2, 'two');
        expect(task).toHaveBeenCalledWith(3, 'three');
        expect(results).toEqual(['1-one', '2-two', '3-three']);
        expect(sync.isEmpty()).toBe(true);
        done();
      });
    });
  });

  describe('#Sad path', () => {
    it(`Should schedule a task and reject the promise when the task fails`, done => {
      const task = jest.fn((num: number, str: string) => {
        return Promise.reject(new Error('Task failed'));
      });
      const sync = new Sync('syncTest');
      sync
        .schedule(task, 1, 'one')
        .then(result => {
          throw new Error('Should not be here');
        })
        .catch(err => {
          expect(err.message).toBe('Task failed');
          expect(task).toHaveBeenCalledWith(1, 'one');
          expect(sync.isEmpty()).toBe(true);
          done();
        });
    });

    it(`Should schedule multiple tasks and reject the promise of the failed task only`, done => {
      const taskSuccess = jest.fn((num: number, str: string) => {
        return `${num}-${str}`;
      });
      const taskFail = jest.fn((num: number, str: string) => {
        return Promise.reject(new Error('Task failed'));
      });
      const sync = new Sync('syncTest');
      const promise1 = sync.schedule(taskSuccess, 1, 'one').then(result => {
        expect(result).toBe('1-one');
        return Promise.resolve(result);
      });
      const promise2 = sync
        .schedule(taskFail, 2, 'two')
        .then(result => {
          throw new Error('Should not be here');
        })
        .catch(err => {
          expect(err.message).toBe('Task failed');
          return Promise.reject(err);
        });
      const promise3 = sync.schedule(taskSuccess, 3, 'three').then(result => {
        expect(result).toBe('3-three');
        return Promise.resolve(result);
      });

      Promise.all([promise1, promise2, promise3])
        .then(results => {
          throw new Error('Should not be here');
        })
        .catch(err => {
          expect(err.message).toBe('Task failed');
          expect(taskSuccess).toHaveBeenCalledTimes(2);
          expect(taskSuccess).toHaveBeenCalledWith(1, 'one');
          expect(taskSuccess).toHaveBeenCalledWith(3, 'three');
          expect(taskFail).toHaveBeenCalledTimes(1);
          expect(taskFail).toHaveBeenCalledWith(2, 'two');
          expect(sync.isEmpty()).toBe(true);
          done();
        });
    });
  });
});
