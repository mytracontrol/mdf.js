/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Boom, Crash, Multi } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { RetryOptions, retry, retryBind, wrapOnRetry } from './retry';
// #endregion
// ************************************************************************************************
// #region Test
describe('#Retry', () => {
  describe('#Happy path', () => {
    it('Should retry the promise twice without bind', async () => {
      let init = false;
      let called = false;
      function myPromise(value: number, otherValue: number): Promise<number> {
        if (!init) {
          init = true;
          return Promise.reject(new Crash('myError', v4()));
        } else {
          init = false;
          return Promise.resolve(value + otherValue);
        }
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        console.log(error.message);
      }
      const result = await retry(myPromise, [2, 2], { logger, waitTime: 10, maxWaitTime: 100 });
      expect(called).toBe(true);
      expect(result).toEqual(4);
    }, 300);
    it('Should retry the promise twice without bind with default values', async () => {
      let init = false;
      function myPromise(): Promise<number> {
        if (!init) {
          init = true;
          return Promise.reject(new Crash('myError', v4()));
        } else {
          init = false;
          return Promise.resolve(4);
        }
      }
      const result = await retry(myPromise);
      expect(result).toEqual(4);
    }, 300);
    it('Should interrupt the retries when interrupt is invoked without bind ', async () => {
      let called = false;
      function myPromise(value: number, otherValue: number): Promise<number> {
        return Promise.reject(new Crash('myError', v4()));
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        console.log(error.message);
      }
      try {
        let cutExecution = false;
        const interrupt = () => {
          return cutExecution;
        };
        setTimeout(() => {
          cutExecution = true;
        }, 100);
        await retry(myPromise, [2, 2], { logger, interrupt, waitTime: 10, maxWaitTime: 100 });
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect((error as Crash).message).toEqual('The loop process was interrupted externally');
        expect((error as Crash).name).toEqual('InterruptionError');
        expect((error as Crash).cause?.message).toEqual('myError');
        return;
      }
    }, 300);
    it(`Should interrupt the retries when the task is cancelled externally`, async () => {
      let called = false;
      function myPromise(value: number, otherValue: number): Promise<number> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Crash('myError', v4()));
          }, 20);
        });
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        console.log(error.message);
      }
      try {
        const controller = new AbortController();
        setTimeout(() => {
          controller.abort();
        }, 100);
        await retry(myPromise, [2, 2], {
          logger,
          abortSignal: controller.signal,
          waitTime: 200,
          maxWaitTime: 800,
        });
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect((error as Crash).message).toEqual(
          'The task was aborted externally in attempt number: 1'
        );
        return;
      }
    });
    it(`Should interrupt the retries when the task is cancelled externally, binded`, async () => {
      let called = false;
      function myPromise(value: number, otherValue: number): Promise<number> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Crash('myError', v4()));
          }, 20);
        });
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        console.log(error.message);
      }
      try {
        const controller = new AbortController();
        setTimeout(() => {
          controller.abort();
        }, 100);
        await retryBind(myPromise, null, [2, 2], {
          logger,
          abortSignal: controller.signal,
          waitTime: 200,
          maxWaitTime: 800,
        });
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect((error as Crash).message).toEqual(
          'The task was aborted externally in attempt number: 1'
        );
        return;
      }
    });
    it('Should interrupt the retries when max number of attempts has been reached', async () => {
      jest.setTimeout(5000);
      let called = false;
      let tries = 0;
      function myPromise(): Promise<number> {
        return Promise.reject(new Crash('myError', v4()));
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        tries += 1;
        console.log(error.message);
      }
      try {
        await retry(myPromise, [2, 2], { logger, attempts: 3, waitTime: 10 });
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect(tries).toBe(3);
        expect((error as Crash).message).toEqual(
          'Too much attempts [3], the promise will not be retried'
        );
        expect((error as Crash).name).toEqual('InterruptionError');
        expect((error as Crash).cause?.message).toEqual('myError');
        return;
      }
    }, 300);
    it('Should interrupt the retries if rejected error name is `IrresolvableError`', async () => {
      let called = false;
      let tries = 0;
      function myPromise(): Promise<number> {
        if (tries < 2) {
          return Promise.reject(new Crash('myError', v4()));
        } else {
          return Promise.reject(new Crash('myError', v4(), { name: 'IrresolvableError' }));
        }
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        tries += 1;
        console.log(error.message);
      }
      try {
        await retry(myPromise, [2, 2], { logger, waitTime: 10, maxWaitTime: 100 });
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect(tries).toBe(3);
        expect((error as Crash).message).toEqual(
          'An irresolvable error was the cause of the interruption'
        );
        expect((error as Crash).name).toEqual('InterruptionError');
        expect((error as Crash).cause?.message).toEqual('myError');
        return;
      }
    }, 300);
    it('Should retry every waitTime if the limit of max time is the waitTime', async () => {
      let called = false;
      let tries = 0;
      let date = new Date().getTime();
      function myPromise(): Promise<number> {
        return Promise.reject(new Crash('myError', v4()));
      }
      function logger(error: Crash | Multi | Boom): void {
        called = true;
        tries += 1;
        const actualDate = new Date().getTime();
        expect(actualDate - date).toBeLessThan(50 + 10);
        date = actualDate;
        console.log(error.message);
      }
      try {
        await retry(myPromise, [2, 2], { logger, attempts: 3, maxWaitTime: 50, waitTime: 50 });
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect(tries).toBe(3);
        expect((error as Error).message).toEqual(
          'Too much attempts [3], the promise will not be retried'
        );
        return;
      }
    }, 300);
    it('Should retry the promise twice binded', async () => {
      let called = false;
      class MyClass {
        init = false;
        value = 2;
        otherValue = 2;
        public myPromise(): Promise<number> {
          if (!this.init) {
            this.init = true;
            return Promise.reject(new Crash('myError', v4()));
          } else {
            this.init = false;
            return Promise.resolve(this.value + this.otherValue);
          }
        }
      }
      const myClass = new MyClass();
      function logger(error: Crash | Multi | Boom): void {
        called = true;
      }
      const result = await retryBind(myClass.myPromise, myClass, [], {
        logger,
        maxWaitTime: 100,
        waitTime: 10,
      });
      expect(called).toBe(true);
      expect(result).toEqual(4);
    }, 300);
    it('Should retry the promise twice binded with default values', async () => {
      class MyClass {
        init = false;
        value = 2;
        otherValue = 2;
        public myPromise(): Promise<number> {
          if (!this.init) {
            this.init = true;
            return Promise.reject(new Crash('myError', v4()));
          } else {
            this.init = false;
            return Promise.resolve(4);
          }
        }
      }
      const myClass = new MyClass();
      const result = await retryBind(myClass.myPromise, myClass);
      expect(result).toEqual(4);
    }, 300);
    it('Should interrupt the retries when interrupt is invoked binded', async () => {
      let called = false;
      class MyClass {
        init = false;
        value = 2;
        otherValue = 2;
        public myPromise(): Promise<number> {
          return Promise.reject(new Crash('myError', v4()));
        }
      }
      const myClass = new MyClass();
      function logger(error: Crash | Multi | Boom): void {
        called = true;
      }
      try {
        let cutExecution = false;
        setTimeout(() => {
          cutExecution = true;
        }, 100);
        await retryBind(myClass.myPromise, myClass, [], {
          logger,
          interrupt: () => cutExecution,
          waitTime: 10,
          maxWaitTime: 100,
        });
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect((error as Crash).message).toEqual('The loop process was interrupted externally');
        return;
      }
    }, 300);
    it(`Should interrupt each try if the timeout for the try is reached`, async () => {
      let called = false;
      let tries = 0;
      function logger(error: Crash | Multi | Boom): void {
        expect((error as Crash).message).toEqual(
          `The execution of the try number ${tries + 1} has timed out: 50 ms`
        );
        tries += 1;
        called = true;
      }
      const options: RetryOptions = {
        waitTime: 100,
        maxWaitTime: 100,
        attempts: 3,
        timeout: 50,
        logger,
      };
      function myPromise(): Promise<number> {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Crash('myError', v4()));
          }, 100);
        });
      }
      try {
        await retry(myPromise, [], options);
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect(tries).toBe(3);
        expect((error as Crash).message).toEqual(
          'Too much attempts [3], the promise will not be retried'
        );
        return;
      }
    }, 500);
    it(`Should interrupt each try if the timeout for the try is reached, binded`, async () => {
      let called = false;
      let tries = 0;
      function logger(error: Crash | Multi | Boom): void {
        expect((error as Crash).message).toEqual(
          `The execution of the try number ${tries + 1} has timed out: 50 ms`
        );
        tries += 1;
        called = true;
      }
      const options: RetryOptions = {
        waitTime: 100,
        maxWaitTime: 100,
        attempts: 3,
        timeout: 50,
        logger,
      };
      class MyClass {
        public myPromise(): Promise<number> {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Crash('myError', v4()));
            }, 100);
          });
        }
      }
      const myClass = new MyClass();
      try {
        await retryBind(myClass.myPromise, myClass, [], options);
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect(tries).toBe(3);
        expect((error as Crash).message).toEqual(
          'Too much attempts [3], the promise will not be retried'
        );
        return;
      }
    }, 500);
    it(`Should wrap a promise and transform it into a retryable promise`, async () => {
      let called = false;
      let tries = 0;
      function logger(error: Crash | Multi | Boom): void {
        expect((error as Crash).message).toEqual('myError');
        tries += 1;
        called = true;
      }
      const options: RetryOptions = {
        waitTime: 100,
        maxWaitTime: 100,
        attempts: 3,
        timeout: 50,
        logger,
      };
      function myPromise(): Promise<number> {
        return Promise.reject(new Crash('myError', v4()));
      }
      const retryable = wrapOnRetry(myPromise, [], options);
      try {
        expect(called).toBe(false);
        await retryable();
        throw new Error(`Should throw an error`);
      } catch (error: unknown) {
        expect(called).toBe(true);
        expect(tries).toBe(3);
        expect((error as Crash).message).toEqual(
          'Too much attempts [3], the promise will not be retried'
        );
        return;
      }
    });
  });
});
