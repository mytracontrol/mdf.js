/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4 } from 'uuid';
import { Instance } from './Instance';
import { MultiInstance } from './MultiInstance';
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

describe('#primitives #MultiInstance', () => {
  describe('#Happy path', () => {
    it('Should execute the multi-instance command and resolve if all the commands resolve', async () => {
      const uuid: string = v4();
      const command1UUID = v4();
      const command2UUID = v4();
      const commands = [
        new ResolveInstance({ uuid: command1UUID }),
        new ResolveInstance({ uuid: command2UUID }),
      ];
      const sequence = 'testSequence';
      const instance = new MultiInstance(sequence, { uuid }, commands);
      const result = await instance.execute();
      expect(result).toEqual({
        $meta: {
          command: sequence,
          uuid,
          status: 'completed',
          executedAt: expect.any(String),
          completedAt: expect.any(String),
          duration: expect.any(Number),
          $meta: [
            {
              command: 'command',
              uuid: command1UUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: command2UUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
          ],
        },
        results: [{ data: 'test' }, { data: 'test' }],
      });
    });
  });
  describe('#Sad path', () => {
    it('Should throw an error if the commands are empty array', async () => {
      const uuid: string = v4();
      const commands: Instance[] = [];
      const sequence = 'testSequence';
      try {
        new MultiInstance(sequence, { uuid }, commands);
      } catch (error) {
        expect(error).toEqual(new Error('The sequence [testSequence] is empty'));
      }
    });
    it('Should execute the multi-instance command and resolve if one command rejects', async () => {
      const uuid: string = v4();
      const command1UUID = v4();
      const command2UUID = v4();
      const commands = [
        new ResolveInstance({ uuid: command1UUID }),
        new RejectInstance({ uuid: command2UUID }),
      ];
      const sequence = 'testSequence';
      const instance = new MultiInstance(sequence, { uuid }, commands);
      const result = await instance.execute();
      expect(result).toEqual({
        $meta: {
          command: sequence,
          uuid,
          status: 'failed',
          executedAt: expect.any(String),
          failedAt: expect.any(String),
          duration: expect.any(Number),
          reason: 'At least one of the commands failed',
          $meta: [
            {
              command: 'command',
              uuid: command1UUID,
              status: 'completed',
              executedAt: expect.any(String),
              completedAt: expect.any(String),
              duration: expect.any(Number),
            },
            {
              command: 'command',
              uuid: command2UUID,
              status: 'failed',
              executedAt: expect.any(String),
              failedAt: expect.any(String),
              duration: expect.any(Number),
              reason: expect.any(String),
            },
          ],
        },
        results: [{ data: 'test' }, null],
      });
    });
  });
});
