/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { pTimeout } from './p-timeout';

describe('#PQueue #Ptimeout', () => {
  describe('#Happy path', () => {
    it('Should resolve the promise if it completes within the timeout', async () => {
      const task = new Promise(resolve => {
        setTimeout(() => {
          resolve('Task completed');
        }, 100);
      });
      const options = {
        milliseconds: 200,
      };
      const result = await pTimeout(task, options);
      expect(result).toBe('Task completed');
    });
  });
  describe('#Sad path', () => {
    it('Should reject the promise with a TimeoutError if it exceeds the timeout', async () => {
      const task = new Promise(resolve => {
        setTimeout(() => {
          resolve('Task completed');
        }, 500);
      });
      const options = {
        milliseconds: 200,
      };
      await expect(pTimeout(task, options)).rejects.toThrow('Promise timed out');
    });
    it('Should reject the promise with an AbortError if the signal is aborted', async () => {
      const controller = new AbortController();
      const task = new Promise(resolve => {
        setTimeout(() => {
          resolve('Task completed');
        }, 1000);
      });
      const options = {
        milliseconds: 2000,
        signal: controller.signal,
      };
      controller.abort();
      await expect(pTimeout(task, options)).rejects.toThrow('This operation was aborted');
    });
  });
});
