/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4 } from 'uuid';
import { Instance } from './Instance';
import { Sequence } from './Sequence';
import { Input } from './types';

class ResolveInstance extends Instance<Record<string, any>, Record<string, any>> {
  constructor(options: Input & Record<string, any>) {
    super('command', options);
  }
  protected async task(): Promise<any> {
    return Promise.resolve({ data: 'test' });
  }
}
class RejectInstance extends Instance<Record<string, any>, Record<string, any>> {
  constructor(options: Input & Record<string, any>) {
    super('command', options);
  }
  protected async task(): Promise<any> {
    return Promise.reject(new Error('test'));
  }
}
class TimeoutInstance extends Instance<Record<string, any>, Record<string, any>> {
  constructor(options: Input & Record<string, any>) {
    super('command', options);
  }
  protected async task(): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, 10000));
  }
}

describe('#primitives #Sequence', () => {
  describe('#Happy path', () => {
    it('Should execute the sequence command and resolve if all the commands resolve', async () => {
      const uuid: string = v4();
      const preUUID = v4();
      const postUUID = v4();
      const commandUUID = v4();
      const finallyUUID = v4();
      const pre = new ResolveInstance({ uuid: preUUID });
      const post = new ResolveInstance({ uuid: postUUID });
      const command = new ResolveInstance({ uuid: commandUUID });
      const finallyCommand = new ResolveInstance({ uuid: finallyUUID });
      const instance = new Sequence('testSequence', {
        uuid,
        pre: [
          { task: pre.execute, bind: pre },
          {
            task: () => Instance.runAsCommand('command', () => Promise.resolve(null), preUUID),
          },
        ],
        post: [{ task: post.execute, bind: post }],
        command: { task: command.execute, bind: command },
        finally: [{ task: finallyCommand.execute, bind: finallyCommand }],
      });
      const result = await instance.execute();
      expect(result).toEqual({
        $meta: {
          command: 'testSequence',
          uuid,
          status: 'completed',
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          duration: expect.any(Number),
          $meta: [
            {
              command: 'command',
              uuid: preUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: preUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: commandUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: postUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: finallyUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
          ],
        },
        result: { data: 'test' },
      });
    });
  });
  describe('#Sad path', () => {
    it('Should execute the sequence command and reject if one of the commands reject', async () => {
      const uuid: string = v4();
      const preUUID = v4();
      const postUUID = v4();
      const commandUUID = v4();
      const finallyUUID = v4();
      const pre = new ResolveInstance({ uuid: preUUID });
      const post = new ResolveInstance({ uuid: postUUID });
      const command = new RejectInstance({ uuid: commandUUID });
      const finallyCommand = new ResolveInstance({ uuid: finallyUUID });
      const instance = new Sequence('testSequence', {
        uuid,
        pre: [
          { task: pre.execute, bind: pre },
          {
            task: () => Instance.runAsCommand('command', () => Promise.resolve(null), preUUID),
          },
        ],
        post: [{ task: post.execute, bind: post }],
        command: { task: command.execute, bind: command, options: { attempts: 1 } },
        finally: [{ task: finallyCommand.execute, bind: finallyCommand }],
      });
      try {
        await instance.execute();
        throw new Error('Should not be here');
      } catch (error) {
        expect(error.message).toEqual(
          'Execution error in sequence: [testSequence]: Too much attempts [1], the promise will not be retried'
        );
        expect(error.info).toEqual({
          command: 'testSequence',
          uuid,
          status: 'failed',
          executedAt: expect.any(String),
          failedAt: expect.any(String),
          duration: expect.any(Number),
          reason:
            'Execution error in sequence: [testSequence]: Too much attempts [1], the promise will not be retried',
          $meta: [
            {
              command: 'command',
              uuid: preUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: preUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: commandUUID,
              status: 'failed',
              executedAt: expect.any(String),
              failedAt: expect.any(String),
              duration: expect.any(Number),
              reason: 'Execution error in command: [command]: test',
            },
            {
              command: 'command',
              uuid: finallyUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
          ],
        });
      }
    });
    it('Should execute the sequence command and reject if one of the commands not except the limit of time', async () => {
      const uuid: string = v4();
      const preUUID = v4();
      const postUUID = v4();
      const commandUUID = v4();
      const finallyUUID = v4();
      const pre = new ResolveInstance({ uuid: preUUID });
      const post = new ResolveInstance({ uuid: postUUID });
      const command = new TimeoutInstance({ uuid: commandUUID });
      const finallyCommand = new ResolveInstance({ uuid: finallyUUID });
      const instance = new Sequence('testSequence', {
        uuid,
        limitTime: 100,
        pre: [
          { task: pre.execute, bind: pre },
          {
            task: () => Instance.runAsCommand('command', () => Promise.resolve(null), preUUID),
          },
        ],
        post: [{ task: post.execute, bind: post }],
        command: { task: command.execute, bind: command, options: { attempts: 1 } },
        finally: [{ task: finallyCommand.execute, bind: finallyCommand }],
      });
      try {
        await instance.execute();
        throw new Error('Should not be here');
      } catch (error) {
        expect(error.message).toContain('Execution timeout in sequence: [testSequence]: ');
        expect(error.info).toEqual({
          command: 'testSequence',
          uuid,
          status: 'cancelled',
          executedAt: expect.any(String),
          cancelledAt: expect.any(String),
          duration: expect.any(Number),
          reason: expect.any(String),
          $meta: [
            {
              command: 'command',
              uuid: preUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: preUUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
          ],
        });
      }
    });
  });
});
