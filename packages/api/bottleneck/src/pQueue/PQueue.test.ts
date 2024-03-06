/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { randomInt } from 'crypto';
import { EventEmitter } from 'eventemitter3';
import { setTimeout as promiseSetTimeout } from 'timers/promises';
import { PQueue } from './PQueue';
const fixture = Symbol('fixture');

function pDefer() {
  const deferred: { promise: any; resolve: any; reject: any } = {
    promise: undefined,
    resolve: undefined,
    reject: undefined,
  };

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

let controller: AbortController;
let signal: AbortSignal;

describe('#PQueue', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      controller = new AbortController();
      signal = controller.signal;
    });
    afterEach(() => {
      //controller.abort();
    });
    it(`Simple test for PQueue`, async () => {
      const queue = new PQueue({ concurrency: 1 });
      const results: number[] = [];
      const myPromise1 = queue.add(async () => results.push(1));
      const myPromise2 = queue.add(async () => results.push(2));
      const myPromise3 = queue.add(async () => results.push(3));
      queue.add(async () => results.push(4));
      queue.add(async () => results.push(5));
      await myPromise1;
      await myPromise2;
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
    it('.add()', async () => {
      const queue = new PQueue();
      const promise = queue.add(async () => fixture);
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(1);
      await expect(promise).resolves.toBe(fixture);
    });
    it('.add() - limited concurrency', async () => {
      const queue = new PQueue({ concurrency: 2 });
      const promise = queue.add(async () => fixture);
      const promise2 = queue.add(async () => {
        await promiseSetTimeout(100);
        return fixture;
      });
      const promise3 = queue.add(async () => fixture);
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(2);
      await expect(promise).resolves.toBe(fixture);
      await expect(promise2).resolves.toBe(fixture);
      await expect(promise3).resolves.toBe(fixture);
    });
    it(`.add() - concurrency: 1`, async () => {
      const input = [
        [10, 50],
        [20, 33],
        [30, 17],
      ];
      const hrstart = process.hrtime();
      const queue = new PQueue({ concurrency: 1 });
      const mapper = async ([value, ms]: readonly number[]) =>
        queue.add(async () => {
          await promiseSetTimeout(ms!);
          return value!;
        });
      const result = await Promise.all(input.map(mapper));
      const hrend = process.hrtime(hrstart);
      expect(hrend[0]).toBe(0);
      const end = () => hrend[1] / 1000000;
      expect(end()).toBeGreaterThan(90);
      expect(end()).toBeLessThan(110);
      expect(result).toEqual([10, 20, 30]);
    });
    it(`.add() - concurrency: 5`, async () => {
      const concurrency = 5;
      const queue = new PQueue({ concurrency });
      let running = 0;
      const input = Array.from({ length: 100 })
        .fill(0)
        .map(async () =>
          queue.add(async () => {
            running++;
            expect(running).toBeLessThanOrEqual(concurrency);
            expect(queue.pending).toBeLessThanOrEqual(concurrency);
            await promiseSetTimeout(randomInt(5, 15));
            running--;
          })
        );
      await Promise.all(input);
    });
    it(`.add() - update concurrency`, async () => {
      let concurrency = 5;
      const queue = new PQueue({ concurrency });
      let running = 0;

      const input = Array.from({ length: 100 })
        .fill(0)
        .map(async (_value, index) =>
          queue.add(async () => {
            running++;
            expect(running).toBeLessThanOrEqual(concurrency);
            expect(queue.pending).toBeLessThanOrEqual(concurrency);
            await promiseSetTimeout(randomInt(3, 7));
            running--;
            if (index % 30 === 0) {
              queue.concurrency = --concurrency;
              expect(queue.concurrency).toBe(concurrency);
            }
          })
        );
      await Promise.all(input);
    });
    it(`.add() - priority`, async () => {
      const results: number[] = [];
      const queue = new PQueue({ concurrency: 1 });
      queue.add(async () => results.push(1), { priority: 1 });
      queue.add(async () => results.push(0), { priority: 0 });
      queue.add(async () => results.push(1), { priority: 1 });
      queue.add(async () => results.push(2), { priority: 2 });
      queue.add(async () => results.push(3), { priority: 3 });
      queue.add(async () => results.push(0), { priority: -1 });
      await queue.onEmpty();
      expect(results).toEqual([1, 3, 2, 1, 0, 0]);
    });
    it(`.sizeBy() - priority`, async () => {
      const queue = new PQueue();
      queue.pause();
      queue.add(async () => {}, { priority: 1 });
      queue.add(async () => {}, { priority: 0 });
      queue.add(async () => {}, { priority: 1 });
      expect(queue.sizeBy({ priority: 1 })).toBe(2);
      expect(queue.sizeBy({ priority: 0 })).toBe(1);
      queue.clear();
      expect(queue.sizeBy({ priority: 1 })).toBe(0);
      expect(queue.sizeBy({ priority: 0 })).toBe(0);
    });
    it(`.add() - timeout without throwing`, async () => {
      const result: string[] = [];
      const queue = new PQueue({ timeout: 100, throwOnTimeout: false });
      queue.add(async () => {
        await promiseSetTimeout(120);
        result.push('🐌');
      });
      queue.add(async () => {
        await promiseSetTimeout(40);
        result.push('🐇');
      });
      queue.add(async () => {
        await promiseSetTimeout(110);
        result.push('🐢');
      });
      queue.add(async () => {
        await promiseSetTimeout(30);
        result.push('🐅');
      });
      queue.add(async () => {
        result.push('⚡️');
      });
      await queue.onIdle();
      expect(result).toEqual(['⚡️', '🐅', '🐇']);
    });
    it(`.add() - timeout with throwing`, async () => {
      const result: string[] = [];
      const queue = new PQueue({ timeout: 100, throwOnTimeout: true });
      try {
        await queue.add(async () => {
          await promiseSetTimeout(250);
          result.push('🐌');
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
      }
      queue.add(async () => {
        await promiseSetTimeout(50);
        result.push('🦆');
      });
      await queue.onIdle();
      expect(result).toEqual(['🦆']);
    });
    it(`.add() - change timeout in between`, async () => {
      const result: string[] = [];
      const initialTimeout = 50;
      const newTimeout = 200;
      const queue = new PQueue({ timeout: initialTimeout, throwOnTimeout: false, concurrency: 2 });
      queue.add(async () => {
        const { timeout } = queue;
        expect(timeout).toBe(initialTimeout);
        await promiseSetTimeout(300);
        result.push('🐌');
      });
      queue.timeout = newTimeout;
      queue.add(async () => {
        const { timeout } = queue;
        expect(timeout).toBe(newTimeout);
        await promiseSetTimeout(100);
        result.push('🐅');
      });
      await queue.onIdle();
      expect(result).toEqual(['🐅']);
    });
    it(`.onEmpty()`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      queue.add(async () => 0);
      queue.add(async () => 0);
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(1);
      await queue.onEmpty();
      expect(queue.size).toBe(0);

      queue.add(async () => 0);
      queue.add(async () => 0);
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(1);
      await queue.onEmpty();
      expect(queue.size).toBe(0);

      // Test an empty queue
      await queue.onEmpty();
      expect(queue.size).toBe(0);
    });
    it(`.onIdle()`, async () => {
      const queue = new PQueue({ concurrency: 2 });

      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(2);
      await queue.onIdle();
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);

      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(2);
      await queue.onIdle();
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
    });
    it(`.onSizeLessThan()`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));

      await queue.onSizeLessThan(4);
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(1);

      await queue.onSizeLessThan(2);
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(1);

      await queue.onSizeLessThan(10);
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(1);

      await queue.onSizeLessThan(1);
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(1);
    });
    it(`.onIdle() - no pending`, async () => {
      const queue = new PQueue();
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);

      expect(await queue.onIdle()).toBeUndefined();
    });
    it(`.clear()`, async () => {
      const queue = new PQueue({ concurrency: 2 });
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(2);
      queue.clear();
      expect(queue.size).toBe(0);
    });
    it(`.addAll()`, async () => {
      const queue = new PQueue();
      const fn = async (): Promise<symbol> => fixture;
      const functions = [fn, fn];
      const promise = queue.addAll(functions);
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(2);
      await expect(promise).resolves.toEqual([fixture, fixture]);
    });
    it(`autoStart: false`, async () => {
      const queue = new PQueue({ concurrency: 2, autoStart: false });

      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(0);
      expect(queue.isPaused).toBe(true);

      queue.start();
      expect(queue.size).toBe(2);
      expect(queue.pending).toBe(2);
      expect(queue.isPaused).toBe(false);

      queue.clear();
      expect(queue.size).toBe(0);
    });
    it(`.start() - return this`, async () => {
      const queue = new PQueue({ concurrency: 2, autoStart: false });

      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      queue.add(async () => promiseSetTimeout(100));
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(0);
      await queue.start().onIdle();
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
    });
    it(`.start() - not paused`, async () => {
      const queue = new PQueue();
      expect(queue.isPaused).toBe(false);
      queue.start();
      expect(queue.isPaused).toBe(false);
    });
    it(`.pause()`, async () => {
      const queue = new PQueue({ concurrency: 2 });

      queue.pause();
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      expect(queue.size).toBe(5);
      expect(queue.pending).toBe(0);
      expect(queue.isPaused).toBe(true);

      queue.start();
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(2);
      expect(queue.isPaused).toBe(false);

      queue.add(async () => promiseSetTimeout(20_000, undefined, { signal }));
      queue.pause();
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(2);
      expect(queue.isPaused).toBe(true);

      queue.start();
      expect(queue.size).toBe(4);
      expect(queue.pending).toBe(2);
      expect(queue.isPaused).toBe(false);

      queue.clear();
      expect(queue.size).toBe(0);
    });
    it(`.add() sync/async mixed tasks`, async () => {
      const queue = new PQueue({ concurrency: 1 });
      queue.add(() => 'sync 1');
      queue.add(async () => promiseSetTimeout(1000));
      queue.add(() => 'sync 2');
      queue.add(() => fixture);
      expect(queue.size).toBe(3);
      expect(queue.pending).toBe(1);
      await queue.onIdle();
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
    });
    it(`.add() - handle task throwing error`, async () => {
      const queue = new PQueue({ concurrency: 1 });
      queue.add(() => 'sync 1');
      const task1 = queue.add(() => {
        throw new Error('broken');
      });
      expect(task1).rejects.toThrow('broken');
      queue.add(() => 'sync 2');
      expect(queue.size).toBe(2);
      await queue.onIdle();
    });
    it(`.add() - handle task promise failure`, async () => {
      const queue = new PQueue({ concurrency: 1 });
      expect(
        queue.add(async () => {
          throw new Error('broken');
        })
      ).rejects.toThrow('broken');
      queue.add(() => 'task #1');
      expect(queue.pending).toBe(1);
      await queue.onIdle();
      expect(queue.pending).toBe(0);
    });
    it(`.addAll() sync/async mixed tasks`, async () => {
      const queue = new PQueue();

      const functions: Array<() => string | Promise<void> | Promise<unknown>> = [
        () => 'sync 1',
        async () => promiseSetTimeout(2000),
        () => 'sync 2',
        async () => fixture,
      ];

      const promise = queue.addAll(functions);

      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(4);
      await expect(promise).resolves.toEqual(['sync 1', undefined, 'sync 2', fixture]);
    });
    it(`Should resolve empty when size is zero`, async () => {
      const queue = new PQueue({ concurrency: 1, autoStart: false });

      // It Should take 1 seconds to resolve all tasks
      for (let index = 0; index < 100; index++) {
        queue.add(async () => promiseSetTimeout(10));
      }

      (async () => {
        await queue.onEmpty();
        expect(queue.size).toBe(0);
      })();

      queue.start();

      // Pause at 0.5 second
      setTimeout(async () => {
        queue.pause();
        await promiseSetTimeout(10);
        queue.start();
      }, 500);

      await queue.onIdle();
    });
    it(`.add() - throttled`, async () => {
      const result: number[] = [];
      const queue = new PQueue({
        intervalCap: 1,
        interval: 500,
        autoStart: false,
      });
      queue.add(async () => result.push(1));
      queue.start();
      await promiseSetTimeout(250);
      queue.add(async () => result.push(2));
      expect(result).toEqual([1]);
      await promiseSetTimeout(300);
      expect(result).toEqual([1, 2]);
    });
    it(`.add() - throttled, carryoverConcurrencyCount false`, async () => {
      const result: number[] = [];

      const queue = new PQueue({
        intervalCap: 1,
        carryoverConcurrencyCount: false,
        interval: 500,
        autoStart: false,
      });

      const values = [0, 1];
      for (const value of values) {
        queue.add(async () => {
          await promiseSetTimeout(600);
          result.push(value);
        });
      }

      queue.start();

      (async () => {
        await promiseSetTimeout(550);
        expect(queue.pending).toBe(2);
        expect(result).toEqual([]);
      })();

      (async () => {
        await promiseSetTimeout(650);
        expect(queue.pending).toBe(1);
        expect(result).toEqual([0]);
      })();

      await promiseSetTimeout(1250);
      expect(result).toEqual(values);
    });
    it(`.add() - throttled, carryoverConcurrencyCount true`, async () => {
      const result: number[] = [];

      const queue = new PQueue({
        carryoverConcurrencyCount: true,
        intervalCap: 1,
        interval: 500,
        autoStart: false,
      });

      const values = [0, 1];
      for (const value of values) {
        queue.add(async () => {
          await promiseSetTimeout(600);
          result.push(value);
        });
      }

      queue.start();

      (async () => {
        await promiseSetTimeout(100);
        expect(result).toEqual([]);
        expect(queue.pending).toBe(1);
      })();

      (async () => {
        await promiseSetTimeout(550);
        expect(result).toEqual([]);
        expect(queue.pending).toBe(1);
      })();

      (async () => {
        await promiseSetTimeout(650);
        expect(result).toEqual([0]);
        expect(queue.pending).toBe(0);
      })();

      (async () => {
        await promiseSetTimeout(1550);
        expect(result).toEqual([0]);
      })();

      await promiseSetTimeout(1650);
      expect(result).toEqual(values);
    });
    it(`.add() - throttled 10, concurrency 5`, async () => {
      const result: number[] = [];

      const queue = new PQueue({
        concurrency: 5,
        intervalCap: 10,
        interval: 1000,
        autoStart: false,
      });

      const firstValue = [...Array.from({ length: 5 }).keys()];
      const secondValue = [...Array.from({ length: 10 }).keys()];
      const thirdValue = [...Array.from({ length: 13 }).keys()];

      for (const value of thirdValue) {
        queue.add(async () => {
          await promiseSetTimeout(300);
          result.push(value);
        });
      }

      queue.start();

      expect(result).toEqual([]);

      (async () => {
        await promiseSetTimeout(400);
        expect(result).toEqual(firstValue);
        expect(queue.pending).toBe(5);
      })();

      (async () => {
        await promiseSetTimeout(700);
        expect(result).toEqual(secondValue);
      })();

      (async () => {
        await promiseSetTimeout(1200);
        expect(queue.pending).toEqual(3);
        expect(result).toEqual(secondValue);
      })();

      await promiseSetTimeout(1400);
      expect(result).toEqual(thirdValue);
    });
    it(`.add() - throttled finish and resume`, async () => {
      const result: number[] = [];

      const queue = new PQueue({
        concurrency: 1,
        intervalCap: 2,
        interval: 2000,
        autoStart: false,
      });

      const values = [0, 1];
      const firstValue = [0, 1];
      const secondValue = [0, 1, 2];

      for (const value of values) {
        queue.add(async () => {
          await promiseSetTimeout(100);
          result.push(value);
        });
      }

      queue.start();

      (async () => {
        await promiseSetTimeout(1000);
        expect(result).toEqual(firstValue);

        queue.add(async () => {
          await promiseSetTimeout(100);
          result.push(2);
        });
      })();

      (async () => {
        await promiseSetTimeout(1500);
        expect(result).toEqual(firstValue);
      })();

      await promiseSetTimeout(2200);
      expect(result).toEqual(secondValue);
    });
    it(`pause Should work when throttled`, async () => {
      const result: number[] = [];

      const queue = new PQueue({
        concurrency: 2,
        intervalCap: 2,
        interval: 1000,
        autoStart: false,
      });

      const values = [0, 1, 2, 3];
      const firstValue = [0, 1];
      const secondValue = [0, 1, 2, 3];

      for (const value of values) {
        queue.add(async () => {
          await promiseSetTimeout(100);
          result.push(value);
        });
      }

      queue.start();

      (async () => {
        await promiseSetTimeout(300);
        expect(result).toEqual(firstValue);
      })();

      (async () => {
        await promiseSetTimeout(600);
        queue.pause();
      })();

      (async () => {
        await promiseSetTimeout(1400);
        expect(result).toEqual(firstValue);
      })();

      (async () => {
        await promiseSetTimeout(1500);
        queue.start();
      })();

      (async () => {
        await promiseSetTimeout(2200);
        expect(result).toEqual(secondValue);
      })();

      await promiseSetTimeout(2500);
    });
    it(`clear interval on pause`, async () => {
      const queue = new PQueue({
        interval: 100,
        intervalCap: 1,
      });

      queue.add(() => {
        queue.pause();
      });

      queue.add(() => 'task #1');

      await promiseSetTimeout(300);
      expect(queue.size).toBe(1);
    });
    it(`Should be an event emitter`, async () => {
      const queue = new PQueue();
      expect(queue instanceof EventEmitter).toBe(true);
    });
    it(`Should emit active event per item`, async () => {
      const items = [0, 1, 2, 3, 4];
      const queue = new PQueue();

      let eventCount = 0;
      queue.on('active', () => {
        eventCount++;
      });

      for (const item of items) {
        queue.add(() => item);
      }

      await queue.onIdle();

      expect(eventCount).toBe(items.length);
    });
    it(`Should emit idle event when idle`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      let timesCalled = 0;
      queue.on('idle', () => {
        timesCalled++;
      });

      const job1 = queue.add(async () => promiseSetTimeout(100));
      const job2 = queue.add(async () => promiseSetTimeout(100));

      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(1);
      expect(timesCalled).toBe(0);

      await job1;
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(0);

      await job2;
      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(1);

      const job3 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(1);

      await job3;
      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(2);
    });
    it(`Should emit empty event when empty`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      let timesCalled = 0;
      queue.on('empty', () => {
        timesCalled++;
      });

      const { resolve: resolveJob1, promise: job1Promise } = pDefer();
      const { resolve: resolveJob2, promise: job2Promise } = pDefer();

      const job1 = queue.add(async () => job1Promise);
      const job2 = queue.add(async () => job2Promise);
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(1);
      expect(timesCalled).toBe(0);

      resolveJob1();
      await job1;
      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(1);
      expect(timesCalled).toBe(0);

      resolveJob2();
      await job2;

      expect(queue.size).toBe(0);
      expect(queue.pending).toBe(0);
      expect(timesCalled).toBe(1);
    });
    it(`Should emit add event when adding task`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      let timesCalled = 0;
      queue.on('add', () => {
        timesCalled++;
      });

      const job1 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(1);

      const job2 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(1);
      expect(timesCalled).toBe(2);

      await job1;
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(2);

      await job2;
      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(2);

      const job3 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(3);

      await job3;
      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(3);
    });
    it(`Should emit next event when completing task`, async () => {
      const queue = new PQueue({ concurrency: 1 });
      let timesCalled = 0;
      queue.on('next', () => {
        timesCalled++;
      });

      const job1 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(0);

      const job2 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(1);
      expect(timesCalled).toBe(0);

      await job1;
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(1);

      await job2;
      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(2);

      const job3 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(2);

      await job3;
      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(timesCalled).toBe(3);
    });
    it(`Should emit completed / error events`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      let errorEvents = 0;
      let completedEvents = 0;
      queue.on('error', () => {
        errorEvents++;
      });
      queue.on('completed', () => {
        completedEvents++;
      });

      const job1 = queue.add(async () => promiseSetTimeout(100));
      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(errorEvents).toBe(0);
      expect(completedEvents).toBe(0);

      const job2 = queue.add(async () => {
        await promiseSetTimeout(1);
        throw new Error('failure');
      });

      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(1);
      expect(errorEvents).toBe(0);
      expect(completedEvents).toBe(0);

      await job1;

      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(errorEvents).toBe(0);
      expect(completedEvents).toBe(1);

      try {
        await job2;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('failure');
      }

      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(errorEvents).toBe(1);
      expect(completedEvents).toBe(1);

      const job3 = queue.add(async () => promiseSetTimeout(100));

      expect(queue.pending).toBe(1);
      expect(queue.size).toBe(0);
      expect(errorEvents).toBe(1);
      expect(completedEvents).toBe(1);

      await job3;

      expect(queue.pending).toBe(0);
      expect(queue.size).toBe(0);
      expect(errorEvents).toBe(1);
      expect(completedEvents).toBe(2);
    });
    it(`Should verify timeout overrides passed to add`, async () => {
      const queue = new PQueue({ timeout: 200, throwOnTimeout: true });

      expect(queue.add(async () => promiseSetTimeout(400))).rejects.toThrow(
        'Promise timed out after 200 milliseconds'
      );
      expect(
        queue.add(async () => promiseSetTimeout(400), { throwOnTimeout: false })
      ).resolves.toBeUndefined();
      expect(
        queue.add(async () => promiseSetTimeout(400), { timeout: 600 })
      ).resolves.toBeUndefined();
      expect(queue.add(async () => promiseSetTimeout(100))).resolves.toBeUndefined();
      expect(queue.add(async () => promiseSetTimeout(100), { timeout: 50 })).rejects.toThrow(
        'Promise timed out after 50 milliseconds'
      );
      await queue.onIdle();
    });
    it(`Should skip an aborted job`, async () => {
      const queue = new PQueue();
      const controller = new AbortController();
      controller.abort();
      expect(queue.add(() => {}, { signal: controller.signal })).rejects.toThrow(
        'This operation was aborted'
      );
    });
    it(`Should pass AbortSignal instance to job`, async () => {
      const queue = new PQueue();
      const controller = new AbortController();

      await queue.add(
        async ({ signal }) => {
          expect(signal).toBeInstanceOf(AbortSignal);
        },
        { signal: controller.signal }
      );
    });
    it(`Aborting multiple jobs at the same time`, async () => {
      const queue = new PQueue({ concurrency: 1 });

      const controller1 = new AbortController();
      const controller2 = new AbortController();

      const task1 = queue.add(async () => new Promise(() => {}), { signal: controller1.signal });
      const task2 = queue.add(async () => new Promise(() => {}), { signal: controller2.signal });

      controller1.abort();
      controller2.abort();

      expect(task1).rejects.toThrow('This operation was aborted');
      expect(task2).rejects.toThrow('This operation was aborted');
      expect(queue.size).toBe(1);
      expect(queue.pending).toBe(1);
    });
  });
  describe('#Sad path', () => {
    it(`enforce number in options.concurrency`, async () => {
      expect(() => new PQueue({ concurrency: 0 })).toThrow();
      expect(() => new PQueue({ concurrency: -1 })).toThrow();
      expect(() => new PQueue({ concurrency: NaN })).toThrow();
      expect(() => new PQueue({ concurrency: Infinity })).not.toThrow();
      expect(() => new PQueue({ concurrency: undefined })).toThrow();
    });
    it(`enforce number in queue.concurrency`, async () => {
      expect(() => (new PQueue().concurrency = 0)).toThrow();
      expect(() => (new PQueue().concurrency = -1)).toThrow();
      expect(() => (new PQueue().concurrency = NaN)).toThrow();
      expect(() => (new PQueue().concurrency = Infinity)).not.toThrow();
      //@ts-expect-error - testing invalid assignment
      expect(() => (new PQueue().concurrency = undefined)).toThrow();
    });
    it(`enforce number in options.intervalCap`, async () => {
      expect(() => new PQueue({ intervalCap: 0 })).toThrow();
      expect(() => new PQueue({ intervalCap: -1 })).toThrow();
      expect(() => new PQueue({ intervalCap: NaN })).toThrow();
      expect(() => new PQueue({ intervalCap: Infinity })).not.toThrow();
      expect(() => new PQueue({ intervalCap: undefined })).toThrow();
    });
    it(`enforce finite in options.interval`, async () => {
      expect(() => new PQueue({ interval: 0 })).not.toThrow();
      expect(() => new PQueue({ interval: -1 })).toThrow();
      expect(() => new PQueue({ interval: NaN })).toThrow();
      expect(() => new PQueue({ interval: Infinity })).toThrow();
      expect(() => new PQueue({ interval: undefined })).toThrow();
    });
  });
});
