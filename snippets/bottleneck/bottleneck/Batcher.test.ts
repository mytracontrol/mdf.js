/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Batcher } from '../batcher';

describe('#Puller #Batcher', () => {
  describe('#Happy path', () => {
    it(`Should create a new instance of Batcher`, () => {
      const batcher = new Batcher({ maxSize: 2, maxTime: 250 });
      expect(batcher).toBeDefined();
      expect(batcher).toBeInstanceOf(Batcher);
    }, 300);
    it(`Should batch by size`, async () => {
      const batcher = new Batcher({ maxSize: 2 });
      const batches: number[] = [];
      batcher.on('batch', (data: number) => {
        batches.push(data);
      });
      await Promise.all([batcher.add(10), batcher.add(20)]);
      await Promise.all([batcher.add(30), batcher.add(40)]);
      expect(batches).toEqual([
        [10, 20],
        [30, 40],
      ]);
    }, 300);
    it(`Should batch by time`, async () => {
      const batcher = new Batcher({ maxTime: 125 });
      const batches: number[] = [];
      let t0 = jest.now();
      batcher.on('batch', (data: number) => {
        batches.push(data);
        expect(Math.floor(jest.now() - t0)).toBeGreaterThanOrEqual(125);
        t0 = jest.now();
      });
      await batcher.add(10);
      batcher.add(20);
      await batcher.add(30);
      expect(batches).toEqual([[10], [20, 30]]);
    }, 300);
    it(`Should batch by size and time`, async () => {
      const batcher = new Batcher({ maxSize: 2, maxTime: 250 });
      const batches: number[] = [];
      let t0 = jest.now();
      let step = 0;
      batcher.on('batch', (data: number) => {
        batches.push(data);
        if (step === 1) {
          expect(Math.floor(jest.now() - t0)).toBeGreaterThanOrEqual(250);
        }
      });
      await Promise.all([batcher.add(10), batcher.add(20)]);
      step = 1;
      t0 = jest.now();
      await batcher.add(30);
      expect(batches).toEqual([[10, 20], [30]]);
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should throw when maxTime is not a number`, () => {
      expect(() => new Batcher({ maxTime: 'a' as any })).toThrow(/maxTime/);
    }, 300);
    it(`Should throw when maxTime is not a positive number`, () => {
      expect(() => new Batcher({ maxTime: 0 })).toThrow(/maxTime/);
    }, 300);
    it(`Should throw when maxSize is not a number`, () => {
      expect(() => new Batcher({ maxSize: 'a' as any })).toThrow(/maxSize/);
    }, 300);
    it(`Should throw when maxSize is not a positive number`, () => {
      expect(() => new Batcher({ maxSize: 0 })).toThrow(/maxSize/);
    }, 300);
    it(`Should throw when no options are provided`, () => {
      expect(() => new Batcher({})).toThrow(/options/);
    }, 300);
    it(`Should throw when no options are provided`, () => {
      expect(() => new Batcher()).toThrow(/options/);
    }, 300);
  });
});
