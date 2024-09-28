/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { DebugLogger } from '@mdf.js/logger';
import { Registry } from 'prom-client';
import { Limiter } from '../Limiter';
import { STRATEGY } from '../Limiter/types';
import { MetaData } from '../Tasks';
import { PollingExecutor } from './PollingExecutor';
import { PollingManager } from './PollingManager';
import { METRICS_DEFINITIONS } from './types';
describe('#PollingManager', () => {
  describe('#Happy path', () => {
    it('Should create a new instance of PollingExecutor', () => {
      const limiter = new Limiter({ delay: 10 });
      const pollingManager = new PollingExecutor(
        {
          componentId: 'test',
          entries: [
            {
              task: () => Promise.resolve(),
              options: {
                id: 'test1',
              },
            },
            {
              task: () => Promise.resolve(),
              options: {
                id: 'test2',
              },
            },
          ],
          pollingGroup: '10ms',
          resource: 'test',
          logger: new DebugLogger('test'),
        },
        limiter,
        METRICS_DEFINITIONS(new Registry())
      );
      expect(pollingManager).toBeInstanceOf(PollingExecutor);
    });
  });
  describe('#Sad path', () => {
    it(`Should throw an error if try to create an instance wih bat slow cycle ratio`, () => {
      expect(() => {
        const limiter = new Limiter({ delay: 10 });
        new PollingManager(
          {
            componentId: 'test',
            entries: [
              {
                task: () => Promise.resolve(),
                options: {
                  id: 'test1',
                },
              },
              {
                task: () => Promise.resolve(),
                options: {
                  id: 'test2',
                },
              },
            ],
            pollingGroup: '10ms',
            resource: 'test',
            logger: new DebugLogger('test'),
            slowCycleRatio: 0,
          },
          limiter,
          new DebugLogger('test'),
          METRICS_DEFINITIONS(new Registry())
        );
      }).toThrow('Invalid slow cycle ratio: 0');
    });
    it('Should emit an error event if the task is not well configured', done => {
      const limiter = new Limiter({ delay: 10 });
      const pollingManager = new PollingExecutor(
        {
          componentId: 'test',
          entries: [
            // @ts-ignore - Testing missing required parameter
            {
              options: {
                id: 'test1',
              },
            },
          ],
          pollingGroup: '10ms',
          resource: 'test',
          logger: new DebugLogger('test'),
        },
        limiter,
        METRICS_DEFINITIONS(new Registry())
      );
      expect(pollingManager).toBeInstanceOf(PollingExecutor);
      pollingManager.on('error', error => {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Error creating the instance of the task test1: [Unexpected error, a task configuration that was validated is not recognized]'
        );
        pollingManager.stop();
        done();
      });
      pollingManager.start();
    });
    it('Should cancel a task if it can not be scheduled', done => {
      const limiter = new Limiter({
        delay: 10,
        concurrency: 1,
        highWater: 1,
        strategy: STRATEGY.OVERFLOW,
      });
      const pollingManager = new PollingExecutor(
        {
          componentId: 'test',
          entries: [
            {
              task: () => Promise.resolve(),
              options: {
                id: 'test1',
              },
            },
            {
              task: () => Promise.resolve(),
              options: {
                id: 'test2',
              },
            },
            {
              task: () => Promise.resolve(),
              options: {
                id: 'test3',
              },
            },
          ],
          pollingGroup: '10ms',
          resource: 'test',
          logger: new DebugLogger('test'),
        },
        limiter,
        METRICS_DEFINITIONS(new Registry())
      );
      expect(pollingManager).toBeInstanceOf(PollingExecutor);
      pollingManager.on(
        'done',
        (uuid: string, result: any, meta: MetaData, error?: Crash | Multi) => {
          if (meta.taskId === 'test1') {
            expect(error).toBeUndefined();
            expect(result).toBeUndefined();
            expect(meta).toBeDefined();
            expect(meta.status).toBe('completed');
          }
          if (meta.taskId === 'test2') {
            expect(error).toBeInstanceOf(Crash);
            expect((error as Crash).message).toBe(
              'Execution error in task [test2]: The job could not be scheduled'
            );
            expect(meta).toBeDefined();
            expect(meta.status).toBe('cancelled');
          }
          if (meta.taskId === 'test3') {
            expect(error).toBeInstanceOf(Crash);
            expect((error as Crash).message).toBe(
              'Execution error in task [test3]: The job could not be scheduled'
            );
            expect(meta).toBeDefined();
            expect(meta.status).toBe('cancelled');
            pollingManager.stop();
            done();
          }
        }
      );
      pollingManager.start();
    });
  });
});
