/**
 * In this file we implement the unit tests
 * for the Batcher class in typescript using jest.
 */

import { Batcher } from './Batcher';

describe('#Puller #Batcher', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of Batcher`, () => {
      const batcher = new Batcher();
      expect(batcher).toBeDefined();
      expect(batcher).toBeInstanceOf(Batcher);
    });

    it(`Should add data to be flushed due to reaching the batcher max size`, () => {
      const batcher = new Batcher({ maxSize: 2 });
      const batches: number[] = [];
      let flushedItems = 0;
      batcher.on('batch', (data: number) => {
        batches.push(data);
      });

      const cb = () => {
        flushedItems++;
        return Promise.resolve();
      };

      const promise1 = batcher.add(10).then(cb);
      expect(flushedItems).toBe(0);

      const promise2 = batcher.add(20).then(cb);

      return Promise.all([promise1, promise2])
        .then(() => {
          expect(flushedItems).toBe(2);

          const promise3 = batcher.add(30).then(cb);
          const promise4 = batcher.add(40).then(cb);
          return Promise.all([promise3, promise4]);
        })
        .then(() => {
          expect(flushedItems).toEqual(4);
          expect(batches).toEqual([
            [10, 20],
            [30, 40],
          ]);
        });
    });

    it(`Should add data to be flushed due to reaching the batcher max time`, done => {
      jest.useFakeTimers();

      const batcher = new Batcher({ maxTime: 2000 });
      const batches: number[] = [];
      const batchCycles: number[] = [];
      const resolveCycles: number[] = [];
      const t0 = jest.now();
      batcher.on('batch', (data: number) => {
        batches.push(data);
        const t1 = Math.floor(jest.now() - t0);
        batchCycles.push(t1);
      });

      const cb = () => {
        const t2 = Math.floor(jest.now() - t0);
        resolveCycles.push(t2);
        return Promise.resolve();
      };

      const promise1 = batcher.add(10).then(cb);
      jest.advanceTimersByTime(2000);

      promise1
        .then(() => {
          const promise2 = batcher.add(20).then(cb);
          const promise3 = batcher.add(30).then(cb);
          jest.advanceTimersByTime(2000);

          return Promise.all([promise2, promise3]);
        })
        .then(() => {
          expect(batches).toEqual([[10], [20, 30]]);
          expect(batchCycles).toEqual([2000, 4000]);
          expect(resolveCycles).toEqual([2000, 4000, 4000]);
          done();
        });
    });

    it(`Should add data to be flushed due to reaching the batcher max size and max time accordingly`, done => {
      jest.useFakeTimers();

      const batcher = new Batcher({ maxSize: 2, maxTime: 2000 });
      const batches: number[] = [];
      const batchCycles: number[] = [];
      const resolveCycles: number[] = [];
      const t0 = jest.now();
      batcher.on('batch', (data: number) => {
        batches.push(data);
        const t1 = Math.floor(jest.now() - t0);
        batchCycles.push(t1);
      });

      const cb = () => {
        const t2 = Math.floor(jest.now() - t0);
        resolveCycles.push(t2);
        return Promise.resolve();
      };

      jest.advanceTimersByTime(1000);
      const promise1 = batcher.add(10).then(cb);
      const promise2 = batcher.add(20).then(cb);

      Promise.all([promise1, promise2])
        .then(() => {
          expect(batches).toEqual([[10, 20]]);
          expect(batchCycles).toEqual([1000]);
          expect(resolveCycles).toEqual([1000, 1000]);

          const promise3 = batcher.add(30).then(cb);
          jest.advanceTimersByTime(2000);

          return promise3;
        })
        .then(() => {
          expect(batches).toEqual([[10, 20], [30]]);
          expect(batchCycles).toEqual([1000, 3000]);
          expect(resolveCycles).toEqual([1000, 1000, 3000]);
          done();
        });
    });
  });
});
