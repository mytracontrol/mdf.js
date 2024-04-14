/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { randomInt } from 'crypto';
import { setTimeout as promiseSetTimeout } from 'timers/promises';
import { Group, MetaData, Sequence, SequencePattern, Single } from '../Tasks';
import { Limiter } from './Limiter';
import { STRATEGY } from './types';

const fixture = Symbol('fixture');

describe('#Limiter', () => {
  describe('#Happy path', () => {
    beforeEach(() => {});
    afterEach(() => {});
    it(`Simple test for Limiter`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.schedule(async () => results.push(1), [], { id: 'myId1' });
      queue.schedule(async () => results.push(2));
      queue.schedule(async () => results.push(3));
      const test4 = await queue.execute(async () => results.push(4));
      const test5 = await queue.execute(async () => results.push(5));
      expect(test4).toEqual(4);
      expect(test5).toEqual(5);
      expect(results).toEqual([1, 2, 3, 4, 5]);
      expect(queue.options.concurrency).toEqual(1);
    });
    it(`Simple test for Limiter, using piped limiter`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const piped = new Limiter({ concurrency: 1 });
      queue.pipe(piped);
      const results: number[] = [];
      let id1OnQueue = false;
      let id4OnQueue = false;
      let id1OnPiped = false;
      let id4OnPiped = false;
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        id1OnQueue = true;
      });
      queue.on('myId4', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(4);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        id4OnQueue = true;
      });
      piped.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      piped.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        id1OnPiped = true;
      });
      piped.on('myId4', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(4);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        id4OnPiped = true;
      });
      queue.schedule(async () => results.push(4), [], { id: 'myId4' });
      queue.schedule(async () => results.push(5));
      queue.schedule(async () => results.push(6));
      piped.schedule(async () => results.push(1), [], { id: 'myId1' });
      piped.schedule(async () => results.push(2));
      piped.schedule(async () => results.push(3));
      const test7 = await queue.execute(async () => results.push(7));
      const test8 = await queue.execute(async () => results.push(8));
      expect(test7).toEqual(7);
      expect(test8).toEqual(8);
      expect(results).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(id1OnQueue).toBeFalsy();
      expect(id4OnQueue).toBeTruthy();
      expect(id1OnPiped).toBeTruthy();
      expect(id4OnPiped).toBeTruthy();
    });
    it(`Simple test for Limiter, using task single handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.schedule(new Single(async () => results.push(1), [], { id: 'myId1' }));
      queue.schedule(new Single(async () => results.push(2)));
      queue.schedule(new Single(async () => results.push(3)));
      const test4 = await queue.execute(new Single(async () => results.push(4)));
      const test5 = await queue.execute(new Single(async () => results.push(5)));
      expect(test4).toEqual(4);
      expect(test5).toEqual(5);
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
    it(`Simple test for Limiter, using task groups handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      const scheduleTasks = [
        new Single(async () => results.push(1), [], { id: 'myId1' }),
        new Single(async () => results.push(2)),
        new Single(async () => results.push(3)),
      ];
      const executeTasks = [
        new Single(async () => results.push(4)),
        new Single(async () => results.push(5)),
      ];
      queue.schedule(new Group(scheduleTasks));
      const test = await queue.execute(new Group(executeTasks));
      expect(test).toEqual([4, 5]);
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
    it(`Simple test for Limiter, using task sequence handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      const sequence: SequencePattern<number> = {
        pre: [new Single(async () => results.push(1)), new Single(async () => results.push(2))],
        task: new Single(async () => results.push(3)),
        post: [new Single(async () => results.push(4))],
        finally: [new Single(async () => results.push(5))],
      };
      const test = await queue.execute(new Sequence(sequence, { id: 'myId1' }));
      expect(test).toEqual(3);
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
    it(`Simple test for Limiter with delay`, async () => {
      const queue = new Limiter({ concurrency: 1, delay: 100 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(1);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      const hrstart = process.hrtime();
      queue.schedule(async () => results.push(1), [], { id: 'myId1' });
      queue.schedule(async () => results.push(2));
      queue.schedule(async () => results.push(3));
      await queue.waitUntilEmpty();
      const hrend = process.hrtime(hrstart);
      expect(hrend[0]).toBe(0);
      const end = () => hrend[1] / 1000000;
      expect(end()).toBeGreaterThan(200);
      expect(end()).toBeLessThan(220);
      expect(results).toEqual([1, 2, 3]);
    });
    it('.execute() should resolve', async () => {
      const queue = new Limiter();
      const result = await queue.execute(async () => fixture);
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
      expect(result).toEqual(fixture);
    });
    it('.execute() should reject if promise rejects', async () => {
      const queue = new Limiter();
      try {
        await queue.execute(
          async () => {
            throw new Error('test');
          },
          [],
          { id: 'myId', retryOptions: { attempts: 1 } }
        );
      } catch (error) {
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual('Execution error in task [myId]: test');
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual('Too much attempts [1], the promise will not be retried');
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('test');
      }
    });
    it('.execute() should reject if promise rejects, with single task handlers without bind', async () => {
      const queue = new Limiter();
      try {
        const single = new Single(
          async () => {
            throw new Error('test');
          },
          { id: 'myId', retryOptions: { attempts: 1 } }
        );
        await queue.execute(single);
      } catch (error) {
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual('Execution error in task [myId]: test');
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual('Too much attempts [1], the promise will not be retried');
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('test');
      }
    });
    it('.execute() should reject if promise rejects, with single task handlers with bind', async () => {
      const queue = new Limiter();
      class myClass {
        public async myMethod() {
          throw new Error('test');
        }
      }
      const myInstance = new myClass();
      try {
        const single = new Single(myInstance.myMethod, {
          id: 'myId',
          retryOptions: { attempts: 1 },
          bind: myInstance,
        });
        await queue.execute(single);
      } catch (error) {
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual('Execution error in task [myId]: test');
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual('Too much attempts [1], the promise will not be retried');
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('test');
      }
    });
    it('.execute() should reject if promise rejects, with group task handlers', async () => {
      const queue = new Limiter();
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      try {
        const group = new Group(
          [
            new Single(async () => fixture),
            new Single(async () => fixture),
            new Single(
              async () => {
                throw new Error('test');
              },
              { id: 'myId' }
            ),
            new Single(
              async () => {
                throw new Error('test');
              },
              { id: 'myId' }
            ),
          ],
          { id: 'myId' }
        );
        await queue.execute(group);
      } catch (error) {
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        const message =
          'Execution error in task [myId]: CrashError: Execution error in task [myId]: test,\ncaused by InterruptionError: Too much attempts [1], the promise will not be retried,\ncaused by Error: test,\nCrashError: Execution error in task [myId]: test,\ncaused by InterruptionError: Too much attempts [1], the promise will not be retried,\ncaused by Error: test';
        expect((error as Crash).message).toEqual(message);
        const cause = (error as Crash).cause as Multi;
        expect(cause.message).toEqual(`At least one of the task grouped failed`);
        const internalErrors = cause.causes as Crash[];
        expect(internalErrors).toBeDefined();
        expect(internalErrors[0].message).toEqual('Execution error in task [myId]: test');
        expect(internalErrors[1].message).toEqual('Execution error in task [myId]: test');
      }
    });
    it(`.execute() should reject if task promise rejects, using task sequence handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      const sequence: SequencePattern<number> = {
        pre: [new Single(async () => results.push(1)), new Single(async () => results.push(2))],
        task: new Single(
          async () => {
            throw new Error('test');
          },
          { id: 'myId', retryOptions: { attempts: 1 } }
        ),
        post: [new Single(async () => results.push(4))],
        finally: [new Single(async () => results.push(5))],
      };
      try {
        await queue.execute(new Sequence(sequence, { id: 'myId1' }));
      } catch (error) {
        expect(results).toEqual([1, 2, 5]);
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual(
          'Execution error in task [myId1]: Execution error in task [myId]: test'
        );
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual(`Execution error in task [myId]: test`);
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual(
          'Too much attempts [1], the promise will not be retried'
        );
      }
    });
    it(`.execute() should reject if pre task promise rejects, using task sequence handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      const sequence: SequencePattern<number> = {
        pre: [
          new Single(async () => results.push(1)),
          new Single(
            async () => {
              throw new Error('test');
            },
            { id: 'myId', retryOptions: { attempts: 1 } }
          ),
        ],
        task: new Single(async () => results.push(2)),
        post: [new Single(async () => results.push(3))],
        finally: [new Single(async () => results.push(4))],
      };
      try {
        await queue.execute(new Sequence(sequence, { id: 'myId1' }));
      } catch (error) {
        expect(results).toEqual([1, 4]);
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual(
          'Execution error in task [myId1]: Error executing the [pre] phase: Execution error in task [myId]: test'
        );
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual(
          `Error executing the [pre] phase: Execution error in task [myId]: test`
        );
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('Execution error in task [myId]: test');
        expect(internalError.cause).toBeDefined();
        expect(internalError.cause?.message).toEqual(
          'Too much attempts [1], the promise will not be retried'
        );
      }
    });
    it(`.execute() should reject if post task promise rejects, using task sequence handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      const sequence: SequencePattern<number> = {
        pre: [new Single(async () => results.push(1)), new Single(async () => results.push(2))],
        task: new Single(async () => results.push(3)),
        post: [
          new Single(
            async () => {
              throw new Error('test');
            },
            { id: 'myId', retryOptions: { attempts: 1 } }
          ),
        ],
        finally: [new Single(async () => results.push(4))],
      };
      try {
        await queue.execute(new Sequence(sequence, { id: 'myId1' }));
      } catch (error) {
        expect(results).toEqual([1, 2, 3, 4]);
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual(
          'Execution error in task [myId1]: Error executing the [post] phase: Execution error in task [myId]: test'
        );
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual(
          `Error executing the [post] phase: Execution error in task [myId]: test`
        );
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('Execution error in task [myId]: test');
        expect(internalError.cause).toBeDefined();
        expect(internalError.cause?.message).toEqual(
          'Too much attempts [1], the promise will not be retried'
        );
      }
    });
    it(`.execute() should reject if final task promise rejects, using task sequence handlers`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      const results: number[] = [];
      const sequence: SequencePattern<number> = {
        pre: [new Single(async () => results.push(1)), new Single(async () => results.push(2))],
        task: new Single(async () => results.push(3)),
        post: [new Single(async () => results.push(4))],
        finally: [
          new Single(
            async () => {
              throw new Error('test');
            },
            { id: 'myId', retryOptions: { attempts: 1 } }
          ),
        ],
      };
      let test;
      try {
        test = await queue.execute(new Sequence(sequence, { id: 'myId1' }));
      } catch (error) {
        expect(test).toEqual(undefined);
        expect(results).toEqual([1, 2, 3, 4]);
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Multi).message).toEqual(
          'Execution error in task [myId1]: Error executing the [finally] phase: Execution error in task [myId]: test'
        );
        const cause = (error as Crash).cause as Crash;
        expect(cause.message).toEqual(
          `Error executing the [finally] phase: Execution error in task [myId]: test`
        );
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('Execution error in task [myId]: test');
      }
    });
    it(`.execute() should reject if the queue is full`, async () => {
      const queue = new Limiter({ highWater: 2, strategy: STRATEGY.OVERFLOW });
      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      try {
        await queue.execute(async () => fixture);
      } catch (error) {
        expect(error).toBeDefined();
        expect(queue.size).toBe(2);
        expect(queue.pending).toBe(0);
        expect((error as Crash).message).toEqual('The job could not be scheduled');
      }
    });
    it('.schedule() - limited concurrency', async () => {
      const queue = new Limiter({ concurrency: 2 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toEqual(fixture);
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        results.push(result);
      });
      queue.schedule(async () => fixture, [], { id: 'myId' });
      queue.schedule(
        async () => {
          await promiseSetTimeout(100);
          return fixture;
        },
        [],
        { id: 'myId' }
      );
      expect(queue.size).toBe(2);
      expect(queue.pending).toBe(0);
      queue.schedule(async () => fixture, [], { id: 'myId' });
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(0);
      const test = await queue.execute(async () => fixture, [], { id: 'myId' });
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
      expect(test).toEqual(fixture);
      await queue.waitUntilEmpty();
      expect(results).toEqual([fixture, fixture, fixture, fixture]);
    });
    it(`.schedule() - concurrency: 1`, async () => {
      const input = [
        [10, 50],
        [20, 33],
        [30, 17],
      ];
      const results: number[] = [];
      const hrstart = process.hrtime();
      const queue = new Limiter({ concurrency: 1 });
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        results.push(result);
      });
      const mapper = async ([value, ms]: readonly number[]) =>
        queue.schedule(
          async () => {
            await promiseSetTimeout(ms!);
            return value!;
          },
          [],
          { id: 'myId' }
        );
      input.map(mapper);
      await queue.waitUntilEmpty();
      const hrend = process.hrtime(hrstart);
      expect(hrend[0]).toBe(0);
      const end = () => hrend[1] / 1000000;
      expect(end()).toBeGreaterThan(90);
      expect(end()).toBeLessThan(120);
      expect(results).toEqual([10, 20, 30]);
    });
    it(`.execute() - concurrency: 3`, async () => {
      const concurrency = 3;
      const queue = new Limiter({ concurrency, delay: 0 });
      let running = 0;
      let index = 0;
      const results: number[] = [];
      const input = Array.from({ length: 100 })
        .fill(0)
        .map(() =>
          queue.execute(async () => {
            running++;
            expect(running).toBeLessThanOrEqual(concurrency);
            expect(queue.pending).toBeLessThanOrEqual(concurrency);
            await promiseSetTimeout(randomInt(5, 15));
            results.push(index++);
            running--;
          })
        );
      await Promise.all(input);
      expect(results).toHaveLength(100);
    });
    it(`.schedule() - concurrency: 3`, async () => {
      const concurrency = 3;
      const queue = new Limiter({ concurrency, delay: 0 });
      let running = 0;
      let index = 0;
      const results: number[] = [];
      Array.from({ length: 100 })
        .fill(0)
        .map(() =>
          queue.schedule(async () => {
            running++;
            expect(running).toBeLessThanOrEqual(concurrency);
            expect(queue.pending).toBeLessThanOrEqual(concurrency);
            await promiseSetTimeout(randomInt(5, 15));
            results.push(index++);
            running--;
          })
        );
      await queue.waitUntilEmpty();
      expect(results).toHaveLength(100);
    });
    it(`.schedule() - priority`, async () => {
      const results: number[] = [];
      const queue = new Limiter({ concurrency: 1 });
      queue.schedule(async () => results.push(1), [], { priority: 1, id: 'myId1-1' });
      queue.schedule(async () => results.push(0), [], { priority: 0, id: 'myId0-1' });
      queue.schedule(async () => results.push(1), [], { priority: 1, id: 'myId1-2' });
      queue.schedule(async () => results.push(2), [], { priority: 2, id: 'myId2-1' });
      queue.schedule(async () => results.push(3), [], { priority: 3, id: 'myId3-1' });
      queue.schedule(async () => results.push(0), [], { priority: -1, id: 'myId0-2' });
      await queue.waitUntilEmpty();
      expect(results).toEqual([3, 2, 1, 1, 0, 0]);
    });
    it(`.clear()`, async () => {
      const queue = new Limiter({ concurrency: 2, autoStart: false });
      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(0);
      queue.clear();
      expect(queue.size).toBe(0);
    });
    it(`autoStart: false`, async () => {
      const queue = new Limiter({ concurrency: 2, autoStart: false });

      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      queue.schedule(async () => fixture);
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(0);

      queue.start();
      await queue.waitUntilEmpty();
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
    });
    it(`.stop()`, async () => {
      const queue = new Limiter({ concurrency: 2, autoStart: false });

      queue.schedule(async () => promiseSetTimeout(100));
      queue.schedule(async () => promiseSetTimeout(100));
      queue.schedule(async () => promiseSetTimeout(100));
      queue.schedule(async () => promiseSetTimeout(100));
      queue.schedule(async () => promiseSetTimeout(100));
      expect(queue.size).toBe(5);
      expect(queue.pending).toBe(0);

      queue.start();
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(2);
      queue.stop();
      await promiseSetTimeout(200);
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(0);

      queue.schedule(async () => promiseSetTimeout(100));
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(0);

      queue.start();
      expect(queue.size).toBe(2);
      expect(queue.pending).toBe(2);
      queue.stop();
      queue.clear();
      expect(queue.size).toBe(0);
    });
    it(`Should apply strategy 'block'`, async () => {
      let blocked = false;
      let unblocked = false;
      const queue = new Limiter({ highWater: 2, strategy: STRATEGY.BLOCK, penalty: 100 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
        results.push(result);
      });
      // @ts-expect-error - testing invalid assignment
      queue.queue.on('blocked', () => {
        // @ts-expect-error - testing invalid assignment
        expect(queue.queue.blocked).toBe(true);
        blocked = true;
      });
      // @ts-expect-error - testing invalid assignment
      queue.queue.on('unblocked', () => {
        // @ts-expect-error - testing invalid assignment
        expect(queue.queue.blocked).toBe(false);
        unblocked = true;
      });
      queue.schedule(async () => results.push(1), [], { id: 'myId' });
      expect(queue.size).toBe(1);
      queue.schedule(async () => results.push(2), [], { id: 'myId' });
      expect(queue.size).toBe(2);
      queue.schedule(async () => results.push(3), [], { id: 'myId' });
      expect(queue.size).toBe(0);
      queue.schedule(async () => results.push(4), [], { id: 'myId' });
      expect(queue.size).toBe(0);
      expect(blocked).toBe(true);
      await promiseSetTimeout(100);
      expect(unblocked).toBe(true);
      expect(queue.size).toBe(0);
      queue.schedule(async () => results.push(1), [], { id: 'myId' });
      expect(queue.size).toBe(1);
    });
    it(`Should apply strategy 'leak'`, async () => {
      const queue = new Limiter({ highWater: 2, strategy: STRATEGY.LEAK });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.schedule(async () => results.push(1), [], { id: 'myId1' });
      queue.schedule(async () => results.push(2), [], { id: 'myId2' });
      expect(queue.size).toBe(2);
      queue.schedule(async () => results.push(3), [], { id: 'myId3' });
      expect(queue.size).toBe(2);
      await queue.waitUntilEmpty();
      expect(queue.size).toBe(0);
      expect(results).toEqual([2, 3]);
    });
    it(`Should apply strategy 'overflow-priority'`, async () => {
      const queue = new Limiter({ highWater: 2, strategy: STRATEGY.OVERFLOW_PRIORITY });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.schedule(async () => results.push(1), [], { id: 'myId1', priority: 9 });
      queue.schedule(async () => results.push(2), [], { id: 'myId2', priority: 1 });
      expect(queue.size).toBe(2);
      queue.schedule(async () => results.push(3), [], { id: 'myId3', priority: 5 });
      expect(queue.size).toBe(2);
      queue.schedule(async () => results.push(4), [], { id: 'myId4', priority: 5 });
      await queue.waitUntilEmpty();
      expect(queue.size).toBe(0);
      expect(results).toEqual([1, 3]);
    });
    it(`Should apply strategy 'overflow'`, async () => {
      const queue = new Limiter({ highWater: 2, strategy: STRATEGY.OVERFLOW });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.schedule(async () => results.push(1), [], { id: 'myId1', priority: 0 });
      queue.schedule(async () => results.push(2), [], { id: 'myId2', priority: 0 });
      expect(queue.size).toBe(2);
      queue.schedule(async () => results.push(3), [], { id: 'myId3', priority: 9 });
      expect(queue.size).toBe(2);
      queue.schedule(async () => results.push(4), [], { id: 'myId4', priority: 9 });
      expect(queue.size).toBe(2);
      await queue.waitUntilEmpty();
      expect(queue.size).toBe(0);
      expect(results).toEqual([1, 2]);
    });
    it(`Should use bucketSize, tokensPerInterval and interval to control the jobs schedule`, async () => {
      const queue = new Limiter({
        bucketSize: 3,
        tokensPerInterval: 1,
        interval: 100,
        delay: 0,
        concurrency: 3,
      });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, meta: MetaData, error?: Crash) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(meta).toBeDefined();
        expect(error).toBeUndefined();
      });
      const hrstart = process.hrtime();
      const mapper = async (value: number) => queue.schedule(async () => results.push(value));
      Array.from({ length: 10 }).map((_, i) => mapper(i));
      await queue.waitUntilEmpty();
      const hrend = process.hrtime(hrstart);
      expect(hrend[0]).toBe(0);
      expect(hrend[1] / 1000000).toBeLessThan(720);
      expect(results).toHaveLength(10);
      queue.clear();
    });
  });
  describe('#Sad path', () => {
    it(`enforce number in options.concurrency`, async () => {
      expect(() => new Limiter({ concurrency: 0 })).toThrow();
      expect(() => new Limiter({ concurrency: -1 })).toThrow();
      expect(() => new Limiter({ concurrency: NaN })).toThrow();
      expect(() => new Limiter({ concurrency: Infinity })).not.toThrow();
      expect(() => new Limiter({ concurrency: undefined })).not.toThrow();
    });
    it(`enforce number in options.delay`, async () => {
      expect(() => new Limiter({ delay: 0 })).not.toThrow();
      expect(() => new Limiter({ delay: -1 })).toThrow();
      expect(() => new Limiter({ delay: NaN })).toThrow();
      expect(() => new Limiter({ delay: Infinity })).toThrow();
      expect(() => new Limiter({ delay: undefined })).not.toThrow();
    });
    it(`enforce boolean in options.autoStart`, async () => {
      expect(() => new Limiter({ autoStart: true })).not.toThrow();
      expect(() => new Limiter({ autoStart: false })).not.toThrow();
      //@ts-expect-error - testing invalid assignment
      expect(() => new Limiter({ autoStart: 'd' })).toThrow();
    });
    it(`enforce number in options.highWater`, async () => {
      expect(() => new Limiter({ highWater: 1 })).not.toThrow();
      expect(() => new Limiter({ highWater: 0 })).toThrow();
      expect(() => new Limiter({ highWater: NaN })).toThrow();
      expect(() => new Limiter({ highWater: Infinity })).not.toThrow();
      expect(() => new Limiter({ highWater: undefined })).not.toThrow();
    });
    it(`enforce number in options.interval`, async () => {
      expect(() => new Limiter({ interval: 0 })).not.toThrow();
      expect(() => new Limiter({ interval: -1 })).toThrow();
      expect(() => new Limiter({ interval: NaN })).toThrow();
      expect(() => new Limiter({ interval: Infinity })).toThrow();
      expect(() => new Limiter({ interval: undefined })).not.toThrow();
    });
    it(`enforce number in options.bucketSize`, async () => {
      expect(() => {
        const limiter = new Limiter({ bucketSize: 0 });
        limiter.clear();
      }).not.toThrow();
      expect(() => new Limiter({ bucketSize: -1 })).toThrow();
      expect(() => new Limiter({ bucketSize: NaN })).toThrow();
      expect(() => {
        const limiter = new Limiter({ bucketSize: Infinity });
        limiter.clear();
      }).not.toThrow();
      expect(() => {
        const limiter = new Limiter({ bucketSize: undefined });
        limiter.clear();
      }).not.toThrow();
    });
    it(`enforce number in options.strategy`, async () => {
      expect(() => new Limiter({ strategy: STRATEGY.LEAK })).not.toThrow();
      //@ts-expect-error - testing invalid assignment
      expect(() => new Limiter({ strategy: -1 })).toThrow();
      //@ts-expect-error - testing invalid assignment
      expect(() => new Limiter({ strategy: 'other' })).toThrow();
      expect(() => new Limiter({ strategy: undefined })).not.toThrow();
    });
    it(`enforce number in options.tokensPerInterval`, async () => {
      expect(() => new Limiter({ tokensPerInterval: 0 })).not.toThrow();
      expect(() => new Limiter({ tokensPerInterval: -1 })).toThrow();
      expect(() => new Limiter({ tokensPerInterval: NaN })).toThrow();
      expect(() => new Limiter({ tokensPerInterval: Infinity })).toThrow();
      expect(() => new Limiter({ tokensPerInterval: undefined })).not.toThrow();
    });
    it(`enforce number in options.penalty`, async () => {
      expect(() => new Limiter({ penalty: 0 })).not.toThrow();
      expect(() => new Limiter({ penalty: -1 })).toThrow();
      expect(() => new Limiter({ penalty: NaN })).toThrow();
      expect(() => new Limiter({ penalty: Infinity })).toThrow();
      expect(() => new Limiter({ penalty: undefined })).not.toThrow();
    });
    it(`enforce coherent options for block strategy`, async () => {
      expect(() => new Limiter({ strategy: STRATEGY.BLOCK })).toThrow();
      expect(() => new Limiter({ strategy: STRATEGY.BLOCK, penalty: 0 })).toThrow();
      expect(() => new Limiter({ strategy: STRATEGY.BLOCK, penalty: 150 })).not.toThrow();
    });
    it(`enforce coherent options for bucketSize, tokensPerInterval and interval`, async () => {
      expect(() => {
        const limiter = new Limiter({ bucketSize: 150 });
        limiter.clear();
      }).not.toThrow();
      expect(() => new Limiter({ bucketSize: 150, tokensPerInterval: 0 })).toThrow();
      expect(() => new Limiter({ bucketSize: 150, tokensPerInterval: 151 })).toThrow();
      expect(() => new Limiter({ bucketSize: 150, interval: 0 })).toThrow();
      expect(() => {
        const limiter = new Limiter({ bucketSize: 150, tokensPerInterval: 150, interval: 150 });
        limiter.clear();
      }).not.toThrow();
    });
    it(`Should fail if we try to pass a non valid promise as task`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      try {
        // @ts-expect-error - testing invalid assignment
        await queue.execute(3, [], { id: 'myId1' });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
