/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { Instance } from './Instance';

describe('#primitives #Instance', () => {
  describe('#Happy path', () => {
    it('Should wrap a promise in a command instance', async () => {
      const command = 'testCommand';
      const uuid = 'testUuid';
      const promise = (uuid: string) => Promise.resolve({ data: uuid });

      const result = await Instance.runAsCommand(command, promise, uuid);
      expect(result).toEqual({
        $meta: {
          command,
          uuid,
          status: 'completed',
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          duration: expect.any(Number),
        },
        result: { data: uuid },
      });
    });
    it('Should execute the command', async () => {
      const command = 'testCommand';
      const uuid = v4();
      const options = { uuid };
      class TestCommand extends Instance<any> {
        protected async task(): Promise<any> {
          return Promise.resolve({ data: uuid });
        }
      }
      const instance = new TestCommand(command, options);
      const result = await instance.execute();
      expect(result).toEqual({
        $meta: {
          command,
          uuid,
          status: 'completed',
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          duration: expect.any(Number),
        },
        result: { data: uuid },
      });
    });
  });
  describe('#Sad path', () => {
    it('Should reject the promise if the command execution failed', async () => {
      const command = 'testCommand';
      const uuid = v4();
      const options = { uuid };
      class TestCommand extends Instance<any> {
        protected async task(): Promise<any> {
          throw new Error('Test error');
        }
      }
      const instance = new TestCommand(command, options);
      try {
        await instance.execute();
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(error.uuid).toEqual(uuid);
        expect(error.info).toEqual({
          command,
          uuid,
          date: undefined,
          status: 'failed',
          reason: 'Execution error in command: [testCommand]: Test error',
          executedAt: expect.any(String),
          failedAt: expect.any(String),
          duration: expect.any(Number),
        });
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.cause.message).toEqual('Test error');
      }
    });
    it('Should reject the promise if the command execution exceed the limitTime', async () => {
      const command = 'testCommand';
      const uuid = v4();
      const options = { uuid, limitTime: 1000 };
      class TestCommand extends Instance<any> {
        protected async task(): Promise<any> {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ data: uuid });
            }, 10000);
          });
        }
      }
      const instance = new TestCommand(command, options);
      try {
        await instance.execute();
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(error.uuid).toEqual(uuid);
        expect(error.info.reason).toContain('Execution timeout in command: [testCommand]: ');
        expect(error.info).toEqual({
          command,
          uuid,
          date: undefined,
          status: 'cancelled',
          reason: expect.any(String),
          executedAt: expect.any(String),
          cancelledAt: expect.any(String),
          duration: expect.any(Number),
        });
      }
    });
    it('Should return a rejected promise if the command execution failed', async () => {
      const command = 'testCommand';
      const uuid = v4();
      const promise = (uuid: string) => Promise.reject(new Error('Test error'));

      try {
        await Instance.runAsCommand(command, promise, uuid);
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect(error.uuid).toEqual(uuid);
        expect(error.info).toEqual({
          command,
          uuid,
          date: undefined,
          status: 'failed',
          reason: 'Execution error in command: [testCommand]: Test error',
          executedAt: expect.any(String),
          failedAt: expect.any(String),
          duration: expect.any(Number),
        });
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.cause.message).toEqual('Test error');
      }
    });
  });
});
