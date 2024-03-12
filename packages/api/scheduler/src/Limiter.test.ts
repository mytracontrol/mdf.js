/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { randomInt } from 'crypto';
import { setTimeout as promiseSetTimeout } from 'timers/promises';
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (result?: any, error?: any) => {
        expect(result).toEqual(1);
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
    });
    it(`Simple test for Limiter with delay`, async () => {
      const queue = new Limiter({ concurrency: 1, delay: 100 });
      const results: number[] = [];
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (result?: any, error?: any) => {
        expect(result).toEqual(1);
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
          { retryOptions: { attempts: 1 } }
        );
      } catch (error) {
        expect(error).toBeDefined();
        expect(queue.size).toBe(0);
        expect(queue.pending).toBe(0);
        expect((error as Multi).message).toEqual('Errors in job processing');
        expect((error as Multi).causes).toHaveLength(1);
        const cause = (error as Multi).causes![0];
        expect(cause.message).toEqual('Too much attempts [1], the promise will not be retried');
        const internalError = cause.cause as Crash;
        expect(internalError).toBeDefined();
        expect(internalError.message).toEqual('test');
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId', (result?: any, error?: any) => {
        expect(result).toEqual(fixture);
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId', (result?: any, error?: any) => {
        expect(result).toBeDefined();
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId', (result?: any, error?: any) => {
        expect(result).toBeDefined();
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
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
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
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
      expect(() => new Limiter({ bucketSize: 0 })).not.toThrow();
      expect(() => new Limiter({ bucketSize: -1 })).toThrow();
      expect(() => new Limiter({ bucketSize: NaN })).toThrow();
      expect(() => new Limiter({ bucketSize: Infinity })).not.toThrow();
      expect(() => new Limiter({ bucketSize: undefined })).not.toThrow();
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
      expect(() => new Limiter({ bucketSize: 150 })).not.toThrow();
      expect(() => new Limiter({ bucketSize: 150, tokensPerInterval: 0 })).toThrow();
      expect(() => new Limiter({ bucketSize: 150, tokensPerInterval: 151 })).toThrow();
      expect(() => new Limiter({ bucketSize: 150, interval: 0 })).toThrow();
      expect(
        () => new Limiter({ bucketSize: 150, tokensPerInterval: 150, interval: 150 })
      ).not.toThrow();
    });
    it(`Simple test for Limiter`, async () => {
      const queue = new Limiter({ concurrency: 1 });
      queue.on('done', (uuid: string, result: any, error?: any) => {
        expect(uuid).toBeDefined();
        expect(result).toBeDefined();
        expect(error).toBeUndefined();
      });
      queue.on('myId1', (result?: any, error?: any) => {
        expect(result).toEqual(1);
        expect(error).toBeUndefined();
      });
      // @ts-expect-error - testing invalid assignment
      await queue.execute(3, [], { id: 'myId1' });
      await queue.waitUntilEmpty();
    });
  });
});
