/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DLList } from '.';

describe('#Puller #DLList', () => {
  let incrCalled = false;
  let decrCalled = false;
  const incr = () => (incrCalled = true);
  const decr = () => (decrCalled = true);

  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    incrCalled = false;
    decrCalled = false;
    jest.clearAllMocks();
  });
  describe('#Happy path', () => {
    it(`Should create a new instance of DLList`, () => {
      const list = new DLList<number>(incr, decr);
      expect(list).toBeDefined();
      expect(list).toBeInstanceOf(DLList);

      list.push(1);
      expect(incrCalled).toBe(true);

      list.shift();
      expect(decrCalled).toBe(true);
    });

    it(`Should push a first element`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);

      expect(incrCalled).toBe(true);
      expect(list.length).toBe(1);
      expect(list.getArray()).toEqual([10]);
    });

    it(`Should push more elements after the first one`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      list.push(20);
      list.push(30);

      expect(incrCalled).toBe(true);
      expect(list.length).toBe(3);
      expect(list.getArray()).toEqual([10, 20, 30]);
    });

    it(`Should shift nothing from an empty list`, () => {
      const list = new DLList<number>(incr, decr);
      expect(list.length).toBe(0);
      expect(list.getArray()).toEqual([]);

      const value = list.shift();
      expect(decrCalled).toBe(false);
      expect(value).toBeNull();
    });

    it(`Should shift an element from a non-empty list`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      expect(list.length).toBe(1);

      const value = list.shift();
      expect(decrCalled).toBe(true);
      expect(value).toBe(10);
      expect(list.length).toBe(0);
      expect(list.getArray()).toEqual([]);
    });

    it(`Should shift more elements after the first one from a non-empty list`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      list.push(20);
      list.push(30);
      expect(list.length).toBe(3);

      const value1 = list.shift();
      expect(decrCalled).toBe(true);
      expect(value1).toBe(10);
      expect(list.length).toBe(2);
      expect(list.getArray()).toEqual([20, 30]);

      const value2 = list.shift();
      expect(value2).toBe(20);
      expect(list.length).toBe(1);
      expect(list.getArray()).toEqual([30]);

      const value3 = list.shift();
      expect(value3).toBe(30);
      expect(list.length).toBe(0);
      expect(list.getArray()).toEqual([]);
    });

    it(`Should get nothing as the first element value of an empty list`, () => {
      const list = new DLList<number>(incr, decr);
      expect(list.length).toBe(0);
      expect(list.getArray()).toEqual([]);

      const value = list.first();
      expect(value).toBeNull();
    });

    it(`Should get the first element value of a non-empty list`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      list.push(20);

      const value = list.first();
      expect(value).toBe(10);
      expect(list.length).toBe(2);
      expect(list.getArray()).toEqual([10, 20]);
    });

    it(`Should get an empty array for elements values of an empty list`, () => {
      const list = new DLList<number>(incr, decr);

      const array = list.getArray();
      expect(array).toEqual([]);
    });

    it(`Should get an array with the elements values of a non-empty list`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      list.push(20);

      const array = list.getArray();
      expect(array).toEqual([10, 20]);
    });

    it(`Should shift and apply the provided function to each element of a list`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      list.push(20);

      const callbackCallsResult: number[] = [];
      const mockCallback = jest.fn(value => callbackCallsResult.push(value));
      const spyShift = jest.spyOn(list, 'shift');
      list.forEachShift(mockCallback);

      expect(spyShift).toHaveBeenCalledTimes(3);
      expect(mockCallback.mock.calls).toHaveLength(2);
      expect(mockCallback.mock.calls[0][0]).toBe(10);
      expect(mockCallback.mock.calls[1][0]).toBe(20);
      expect(callbackCallsResult).toEqual([10, 20]);
    });

    it(`Should get an array with the current, prev and next values of each node of a list`, () => {
      const list = new DLList<number>(incr, decr);
      list.push(10);
      list.push(20);
      list.push(30);

      const array = list.debug();
      expect(array).toEqual([
        {
          value: 10,
          prev: null,
          next: 20,
        },
        {
          value: 20,
          prev: 10,
          next: 30,
        },
        {
          value: 30,
          prev: 20,
          next: null,
        },
      ]);
    });
  });
});
