/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash, Multi } from '@mdf.js/crash';
import { Group } from './Group';
import { Sequence } from './Sequence';
import { Single } from './Single';
import { RETRY_STRATEGY } from './types';

class MyClass {
  myInternalValue: number;
  constructor() {
    this.myInternalValue = 10;
  }
  public async myGoodMethod(value: number): Promise<number> {
    return value + this.myInternalValue;
  }
  public async myBadMethod(): Promise<number> {
    throw new Error('This is an error');
  }
}

function getGoodBindedTask(): Single<number, MyClass> {
  const myClass = new MyClass();
  return new Single(myClass.myGoodMethod, [32], {
    id: 'test',
    bind: myClass,
    priority: 1,
    weight: 1,
    retryOptions: { attempts: 1 },
  });
}
function getGoodUnBindedTask(): Single<number, undefined> {
  return new Single(async (value: number) => value, [42], {
    id: 'test',
    priority: 1,
    weight: 1,
    retryOptions: { attempts: 1 },
  });
}
function getGoodDefaultTask(): Single<number, undefined> {
  return new Single(async (value: number) => value, [42]);
}
function getBadBindedTask(): Single<number, MyClass> {
  const myClass = new MyClass();
  return new Single(myClass.myBadMethod, [32], {
    id: 'test',
    bind: myClass,
    priority: 1,
    weight: 1,
    retryOptions: { attempts: 1 },
  });
}
function getBadUnBindedTask(): Single<number, undefined> {
  return new Single(
    async () => {
      throw new Error('This is an error');
    },
    {
      id: 'test',
      priority: 1,
      weight: 1,
      retryOptions: { attempts: 1 },
    }
  );
}
function getBadDefaultTask(): Single<number, undefined> {
  return new Single(async () => {
    throw new Error('This is an error');
  }, [42]);
}

describe('#Limiter', () => {
  describe('#Happy path', () => {
    it(`Should execute a single task and return the result properly and with the metadata`, async () => {
      const unBindedTask = getGoodUnBindedTask();
      expect(unBindedTask.metadata.executedAt).toBeUndefined();
      unBindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(unBindedTask.uuid);
        expect(result).toBe(42);
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'completed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          failedAt: undefined,
          cancelledAt: undefined,
          reason: undefined,
        });
        expect(error).toBeUndefined();
      });
      const result = await unBindedTask.execute();
      expect(result).toBe(42);
      expect(unBindedTask.metadata).toEqual({
        $meta: [],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'completed',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
      const bindedTask = getGoodBindedTask();
      bindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(bindedTask.uuid);
        expect(result).toBe(42);
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'completed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          failedAt: undefined,
          cancelledAt: undefined,
          reason: undefined,
        });
        expect(error).toBeUndefined();
      });
      const result2 = await bindedTask.execute();
      expect(result2).toBe(42);
      expect(bindedTask.metadata).toEqual({
        $meta: [],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'completed',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
      const defaultTask = getGoodDefaultTask();
      const result3 = await defaultTask.execute();
      expect(result3).toBe(42);
      expect(defaultTask.metadata).toEqual({
        $meta: [],
        uuid: expect.any(String),
        taskId: expect.any(String),
        status: 'completed',
        duration: expect.any(Number),
        priority: 0,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
    }, 300);
    it(`Should execute a group of tasks and return the result properly and with the metadata`, async () => {
      const defaultTask = getGoodDefaultTask();
      const group = new Group([getGoodUnBindedTask(), getGoodBindedTask(), defaultTask], {
        id: 'test',
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 1 },
      });
      group.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(group.uuid);
        expect(result).toEqual([42, 42, 42]);
        expect(meta).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: defaultTask.taskId,
              status: 'completed',
              duration: expect.any(Number),
              priority: 0,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
          ],
          uuid,
          taskId: 'test',
          status: 'completed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          failedAt: undefined,
          cancelledAt: undefined,
          reason: undefined,
        });
        expect(error).toBeUndefined();
      });
      const result = await group.execute();
      expect(result).toEqual([42, 42, 42]);
      expect(group.metadata).toEqual({
        $meta: [
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: defaultTask.taskId,
            status: 'completed',
            duration: expect.any(Number),
            priority: 0,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
        ],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'completed',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
    }, 300);
    it(`Should execute a sequence of tasks and return the result properly and with the metadata`, async () => {
      const defaultTask = new Single(async (value: number) => value, [42]);
      const sequence = new Sequence(
        {
          pre: [getGoodBindedTask(), defaultTask],
          task: getGoodUnBindedTask(),
          post: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          finally: [getGoodUnBindedTask(), getGoodUnBindedTask(), getGoodUnBindedTask()],
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      sequence.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(sequence.uuid);
        expect(result).toEqual(42);
        expect(meta).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: defaultTask.taskId,
              status: 'completed',
              duration: expect.any(Number),
              priority: 0,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
          ],
          uuid,
          taskId: 'test',
          status: 'completed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          failedAt: undefined,
          cancelledAt: undefined,
          reason: undefined,
        });
        expect(error).toBeUndefined();
      });
      const result = await sequence.execute();
      expect(result).toEqual(42);
      expect(sequence.metadata).toEqual({
        $meta: [
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: defaultTask.taskId,
            status: 'completed',
            duration: expect.any(Number),
            priority: 0,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
        ],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'completed',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
    }, 300);
    it(`Should cancel a single task and return the metadata properly`, async () => {
      const unBindedTask = getGoodUnBindedTask();
      unBindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(unBindedTask.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'cancelled',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: undefined,
          completedAt: undefined,
          failedAt: undefined,
          cancelledAt: expect.any(String),
          reason: 'Execution error in task [test]: Task [test] was cancelled by the user',
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'Execution error in task [test]: Task [test] was cancelled by the user'
        );
      });
      unBindedTask.cancel();
      expect(unBindedTask.metadata).toEqual({
        $meta: [],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'cancelled',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: undefined,
        completedAt: undefined,
        failedAt: undefined,
        cancelledAt: expect.any(String),
        reason: 'Execution error in task [test]: Task [test] was cancelled by the user',
      });
      const bindedTask = getGoodBindedTask();
      bindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(bindedTask.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'cancelled',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: undefined,
          completedAt: undefined,
          failedAt: undefined,
          cancelledAt: expect.any(String),
          reason: 'Execution error in task [test]: Task [test] was cancelled by the user',
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'Execution error in task [test]: Task [test] was cancelled by the user'
        );
      });
      bindedTask.cancel();
      expect(bindedTask.metadata).toEqual({
        $meta: [],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'cancelled',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: undefined,
        completedAt: undefined,
        failedAt: undefined,
        cancelledAt: expect.any(String),
        reason: 'Execution error in task [test]: Task [test] was cancelled by the user',
      });
    }, 300);
    it(`Should perform the strategy of retry properly`, async () => {
      const task = new Single(async (value: number) => value, [42], {
        id: 'test',
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 1 },
        retryStrategy: RETRY_STRATEGY.RETRY,
      });
      const result = await task.execute();
      expect(result).toBe(42);
      expect(task.metadata).toEqual({
        $meta: [],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'completed',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
      const result2 = await task.execute();
      expect(result2).toBe(42);
      expect(task.metadata).toEqual({
        $meta: [
          {
            $meta: [],
            uuid: expect.any(String),
            taskId: 'test',
            status: 'completed',
            duration: expect.any(Number),
            priority: 1,
            weight: 1,
            createdAt: expect.any(String),
            executedAt: expect.any(String),
            completedAt: expect.any(String),
            failedAt: undefined,
            cancelledAt: undefined,
            reason: undefined,
          },
        ],
        uuid: expect.any(String),
        taskId: 'test',
        status: 'completed',
        duration: expect.any(Number),
        priority: 1,
        weight: 1,
        createdAt: expect.any(String),
        executedAt: expect.any(String),
        completedAt: expect.any(String),
        failedAt: undefined,
        cancelledAt: undefined,
        reason: undefined,
      });
    });
    it(`Should perform the strategy of notExecAfterSuccess properly`, async () => {
      let step = 0;
      const task = new Single(
        async (value: number) => {
          if (step < 2) {
            step++;
            throw new Error('This is an error');
          } else {
            return value;
          }
        },
        [42],
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
          retryStrategy: RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS,
        }
      );
      try {
        await task.execute();
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(0);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe('Execution error in task [test]: This is an error');
      }
      try {
        await task.execute();
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(1);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe('Execution error in task [test]: This is an error');
      }
      const result = await task.execute();
      expect(result).toBe(42);
      expect(task.metadata.$meta?.length).toBe(2);
      expect(task.metadata.status).toBe('completed');
      expect(task.metadata.reason).toBeUndefined();
      const result2 = await task.execute();
      expect(result2).toBe(42);
      expect(task.metadata.$meta?.length).toBe(2);
      expect(task.metadata.status).toBe('completed');
      expect(task.metadata.reason).toBeUndefined();
    });
    it(`Should perform the strategy of failAfterSuccess properly`, async () => {
      let step = 0;
      const task = new Single(
        async (value: number) => {
          if (step < 2) {
            step++;
            throw new Error('This is an error');
          } else {
            return value;
          }
        },
        [42],
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
          retryStrategy: RETRY_STRATEGY.FAIL_AFTER_SUCCESS,
        }
      );
      try {
        await task.execute();
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(0);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe('Execution error in task [test]: This is an error');
      }
      try {
        await task.execute();
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(1);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe('Execution error in task [test]: This is an error');
      }
      const result = await task.execute();
      expect(result).toBe(42);
      expect(task.metadata.$meta?.length).toBe(2);
      expect(task.metadata.status).toBe('completed');
      expect(task.metadata.reason).toBeUndefined();
      try {
        await task.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(3);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe(
          `Execution error in task [test]: Task [test] was previously executed successfully, you can't execute it again due to the retry strategy.`
        );
      }
    });
    it(`Should perform the strategy of failAfterExecuted properly`, async () => {
      let step = 0;
      const task = new Single(
        async (value: number) => {
          if (step < 2) {
            step++;
            throw new Error('This is an error');
          } else {
            return value;
          }
        },
        [42],
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
          retryStrategy: RETRY_STRATEGY.FAIL_AFTER_EXECUTED,
        }
      );
      try {
        await task.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(0);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe('Execution error in task [test]: This is an error');
      }
      try {
        await task.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(1);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe(
          `Execution error in task [test]: Task [test] was executed previously, you can't execute it again due to the retry strategy.`
        );
      }
      try {
        await task.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(task.metadata.$meta?.length).toBe(2);
        expect(task.metadata.status).toBe('failed');
        expect(task.metadata.reason).toBe(
          `Execution error in task [test]: Task [test] was executed previously, you can't execute it again due to the retry strategy.`
        );
      }
    });
  });
  describe('#Sad path', () => {
    it(`Should fail a single task and return the error properly and with the metadata`, async () => {
      const unBindedTask = new Single(
        async () => {
          throw new Error('This is an error');
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      unBindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(unBindedTask.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: 'Execution error in task [test]: This is an error',
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Execution error in task [test]: This is an error');
      });
      try {
        await unBindedTask.execute();
        throw new Error('It should have thrown an error');
      } catch (rawError) {
        const error = rawError as Crash;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Execution error in task [test]: This is an error');
        expect(unBindedTask.metadata).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: 'Execution error in task [test]: This is an error',
        });
      }
      const myClass = new MyClass();
      const bindedTask = new Single(myClass.myBadMethod, [32], {
        id: 'test',
        bind: myClass,
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 1 },
      });
      bindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(bindedTask.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: 'Execution error in task [test]: This is an error',
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Execution error in task [test]: This is an error');
      });
      try {
        await bindedTask.execute();
        throw new Error('It should have thrown an error');
      } catch (rawError) {
        const error = rawError as Crash;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Execution error in task [test]: This is an error');
        expect(bindedTask.metadata).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: 'Execution error in task [test]: This is an error',
        });
      }
      const defaultTask = new Single(async () => {
        throw new Error('This is an error');
      }, [42]);
      defaultTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(defaultTask.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: expect.any(String),
          status: 'failed',
          duration: expect.any(Number),
          priority: 0,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: `Execution error in task [${defaultTask.taskId}]: This is an error`,
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          `Execution error in task [${defaultTask.taskId}]: This is an error`
        );
      });
      try {
        await defaultTask.execute();
        throw new Error('It should have thrown an error');
      } catch (rawError) {
        const error = rawError as Crash;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(
          `Execution error in task [${defaultTask.taskId}]: This is an error`
        );
        expect(defaultTask.metadata).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: expect.any(String),
          status: 'failed',
          duration: expect.any(Number),
          priority: 0,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: `Execution error in task [${defaultTask.taskId}]: This is an error`,
        });
      }
    }, 300);
    it(`Should fail a group of task and return the error properly and with the metadata`, async () => {
      const myClass = new MyClass();
      const unBindedTask = new Single(
        async () => {
          throw new Error('This is an error');
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      const bindedTask = new Single(myClass.myBadMethod, [32], {
        id: 'test',
        bind: myClass,
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 1 },
      });
      const defaultTask = new Single(async () => {
        throw new Error('This is an error');
      }, [42]);
      const group = new Group([unBindedTask, bindedTask, defaultTask], {
        id: 'test',
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 1 },
      });
      const errorString = `Execution error in task [test]: CrashError: Execution error in task [test]: This is an error,\ncaused by InterruptionError: Too much attempts [1], the promise will not be retried,\ncaused by Error: This is an error,\nCrashError: Execution error in task [test]: This is an error,\ncaused by InterruptionError: Too much attempts [1], the promise will not be retried,\ncaused by Error: This is an error,\nCrashError: Execution error in task [${defaultTask.taskId}]: This is an error,\ncaused by InterruptionError: Too much attempts [1], the promise will not be retried,\ncaused by Error: This is an error`;
      group.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(group.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: 'Execution error in task [test]: This is an error',
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: 'Execution error in task [test]: This is an error',
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: expect.any(String),
              status: 'failed',
              duration: expect.any(Number),
              priority: 0,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: `Execution error in task [${defaultTask.taskId}]: This is an error`,
            },
          ],
          uuid,
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: errorString,
        });
        expect(error).toBeInstanceOf(Crash);
        expect((error as Error).message).toBe(errorString);
      });
      try {
        await group.execute();
        throw new Error('It should have thrown an error');
      } catch (rawError) {
        const error = rawError as Multi;
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toBe(errorString);
        expect(group.metadata).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: 'Execution error in task [test]: This is an error',
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: 'Execution error in task [test]: This is an error',
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: expect.any(String),
              status: 'failed',
              duration: expect.any(Number),
              priority: 0,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: `Execution error in task [${defaultTask.taskId}]: This is an error`,
            },
          ],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: errorString,
        });
      }
    }, 300);
    it(`Should fail a group of task and return the result if not all of them is failed and the flag of atLeastOne is set properly and with the metadata`, async () => {
      const myClass = new MyClass();
      const unBindedTask = new Single(
        async () => {
          throw new Error('This is an error');
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      const bindedTask = new Single(myClass.myGoodMethod, [32], {
        id: 'test',
        bind: myClass,
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 1 },
      });
      const defaultTask = new Single(async () => {
        throw new Error('This is an error');
      }, [42]);
      const group = new Group(
        [unBindedTask, bindedTask, defaultTask],
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        },
        true
      );
      const errorString = `At least one of the task grouped failed`;
      group.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(group.uuid);
        expect(result).toEqual([null, 42, null]);
        expect(meta).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: 'Execution error in task [test]: This is an error',
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: expect.any(String),
              status: 'failed',
              duration: expect.any(Number),
              priority: 0,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: `Execution error in task [${defaultTask.taskId}]: This is an error`,
            },
          ],
          uuid,
          taskId: 'test',
          status: 'completed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          failedAt: undefined,
          cancelledAt: undefined,
          reason: errorString,
        });
        expect(error).toBeUndefined();
      });
      try {
        const result = await group.execute();
        expect(result).toEqual([null, 42, null]);
      } catch (rawError) {
        throw new Error('It should not have thrown an error');
      }
    }, 300);
    it(`Should fail a sequence of task and return the error properly and with the metadata`, async () => {
      const defaultTask = new Single(async () => {
        throw new Error('This is an error');
      }, [42]);
      const sequenceFailOnPre = new Sequence(
        {
          pre: [getGoodUnBindedTask(), defaultTask],
          task: getGoodUnBindedTask(),
          post: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          finally: [getGoodUnBindedTask(), getGoodUnBindedTask()],
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      const sequenceFailOnTask = new Sequence(
        {
          pre: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          task: getBadBindedTask(),
          post: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          finally: [getGoodUnBindedTask(), getGoodUnBindedTask()],
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      const sequenceFailOnPost = new Sequence(
        {
          pre: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          task: getGoodUnBindedTask(),
          post: [getGoodUnBindedTask(), getBadUnBindedTask()],
          finally: [getGoodUnBindedTask(), getGoodUnBindedTask()],
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      const sequenceFailOnFinally = new Sequence(
        {
          pre: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          task: getGoodUnBindedTask(),
          post: [getGoodUnBindedTask(), getGoodUnBindedTask()],
          finally: [getGoodUnBindedTask(), getBadUnBindedTask()],
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1 },
        }
      );
      try {
        await sequenceFailOnPre.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(sequenceFailOnPre.metadata).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: defaultTask.taskId,
              status: 'failed',
              duration: expect.any(Number),
              priority: 0,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: `Execution error in task [${defaultTask.taskId}]: This is an error`,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
          ],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: `Execution error in task [test]: Error executing the [pre] phase: Execution error in task [${defaultTask.taskId}]: This is an error`,
        });
      }
      try {
        await sequenceFailOnTask.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(sequenceFailOnTask.metadata).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
          ],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: `Execution error in task [test]: Execution error in task [test]: This is an error`,
        });
      }
      try {
        await sequenceFailOnPost.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(sequenceFailOnPost.metadata).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: `Execution error in task [test]: This is an error`,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
          ],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: `Execution error in task [test]: Error executing the [post] phase: Execution error in task [test]: This is an error`,
        });
      }
      try {
        await sequenceFailOnFinally.execute();
        throw new Error('It should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(sequenceFailOnFinally.metadata).toEqual({
          $meta: [
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'completed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              failedAt: undefined,
              cancelledAt: undefined,
              reason: undefined,
            },
            {
              $meta: [],
              uuid: expect.any(String),
              taskId: 'test',
              status: 'failed',
              duration: expect.any(Number),
              priority: 1,
              weight: 1,
              createdAt: expect.any(String),
              executedAt: expect.any(String),
              completedAt: undefined,
              failedAt: expect.any(String),
              cancelledAt: undefined,
              reason: `Execution error in task [test]: This is an error`,
            },
          ],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'failed',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: expect.any(String),
          cancelledAt: undefined,
          reason: `Execution error in task [test]: Error executing the [finally] phase: Execution error in task [test]: This is an error`,
        });
      }
    }, 300);
    it(`Should be able to cancel a single task and return the metadata`, async () => {
      const abortController = new AbortController();
      const unBindedTask = new Single(
        async () => {
          return 42;
        },
        {
          id: 'test',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 1, abortSignal: abortController.signal },
        }
      );
      unBindedTask.once('done', (uuid, result, meta, error) => {
        expect(uuid).toBe(unBindedTask.uuid);
        expect(result).toBeUndefined();
        expect(meta).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'cancelled',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: undefined,
          cancelledAt: expect.any(String),
          reason:
            'Execution error in task [test]: The task was aborted externally in attempt number: 0',
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          'Execution error in task [test]: The task was aborted externally in attempt number: 0'
        );
      });
      abortController.abort();
      try {
        await unBindedTask.execute();
        throw new Error('It should have thrown an error');
      } catch (rawError) {
        const error = rawError as Crash;
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(
          'Execution error in task [test]: The task was aborted externally in attempt number: 0'
        );
        expect(unBindedTask.metadata).toEqual({
          $meta: [],
          uuid: expect.any(String),
          taskId: 'test',
          status: 'cancelled',
          duration: expect.any(Number),
          priority: 1,
          weight: 1,
          createdAt: expect.any(String),
          executedAt: expect.any(String),
          completedAt: undefined,
          failedAt: undefined,
          cancelledAt: expect.any(String),
          reason:
            'Execution error in task [test]: The task was aborted externally in attempt number: 0',
        });
      }
    }, 300);
  });
});
