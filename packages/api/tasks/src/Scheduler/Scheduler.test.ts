/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash, Multi } from '@mdf.js/crash';
import { MetaData } from '../Tasks';
import { Scheduler } from './Scheduler';

describe('#Scheduler', () => {
  describe('#Happy path', () => {
    it('Should create a new instance of Scheduler with simple task and executed more than one cycle', done => {
      const results: number[] = [];
      const cycles: number[] = [0, 0, 0, 0, 0, 0];
      const scheduler = new Scheduler<any, any, '50ms' | '100ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-50ms-T1-${cycles[0]}`),
                  options: {
                    id: 'myTask1',
                  },
                },
              ],
              '100ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-100ms-T1-${cycles[1]}`),
                  options: {
                    id: 'myTask2',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
      });
      scheduler.addResource('myResource2', {
        pollingGroups: {
          '50ms': [
            {
              taskArgs: [],
              task: () => Promise.resolve(`R2-50ms-T1-${cycles[2]}`),
              options: {
                id: 'myTask3',
              },
            },
            {
              taskArgs: [],
              task: () => Promise.resolve(`R2-50ms-T2-${cycles[3]}`),
              options: {
                id: 'myTask4',
              },
            },
          ],
          '100ms': [
            {
              taskArgs: [],
              task: () => Promise.resolve(`R2-100ms-T1-${cycles[4]}`),
              options: {
                id: 'myTask5',
              },
            },
            {
              taskArgs: [],
              task: () => Promise.resolve(`R2-100ms-T2-${cycles[5]}`),
              options: {
                id: 'myTask6',
              },
            },
          ],
        },
        limiterOptions: { concurrency: 4, delay: 0 },
      });
      scheduler.on(
        'done',
        (uuid: string, result: number, meta: MetaData, error?: Crash | Multi) => {
          results.push(result);
          expect(meta.status).toBe('completed');
          expect(meta.taskId).toMatch(/myTask[1-6]/);
          expect(error).toBeUndefined();
          cycles[parseInt(meta.taskId.charAt(meta.taskId.length - 1)) - 1] += 1;
        }
      );
      expect(scheduler).toBeInstanceOf(Scheduler);
      scheduler.start();
      //To test that it does not do anything
      scheduler.start();
      setTimeout(() => {
        expect(cycles).toEqual([5, 3, 5, 5, 3, 3]);
        scheduler
          .stop()
          .then(() => scheduler.stop())
          .then(done);
      }, 225);
    }, 300);
    it(`Should create a new instance of Scheduler with a simple task and try to executed several time even if the task always rejects`, done => {
      const results: number[] = [];
      const cycles: number[] = [0];
      const scheduler = new Scheduler<any, any, '50ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.reject(new Error(`R1-50ms-T1-${cycles[0]}`)),
                  options: {
                    id: 'myTask1',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 2, delay: 0 },
        slowCycleRatio: 2,
      });
      scheduler.on(
        'done',
        (uuid: string, result: number, meta: MetaData, error?: Crash | Multi) => {
          results.push(result);
          expect(meta.status).toBe('failed');
          expect(meta.taskId).toMatch(/myTask1/);
          expect(error).toBeInstanceOf(Error);
          if (!error) {
            throw new Error('Error not found');
          }
          expect(error.message).toBe(`Execution error in task [myTask1]: R1-50ms-T1-${cycles[0]}`);
          cycles[parseInt(meta.taskId.charAt(meta.taskId.length - 1)) - 1] += 1;
        }
      );
      expect(scheduler).toBeInstanceOf(Scheduler);
      scheduler.start();
      setTimeout(() => {
        expect(cycles).toEqual([3]);
        scheduler.stop().then(done);
      }, 225);
    }, 300);
    it('Should create a new instance of Scheduler with single, grouped and sequence task and executed more than one cycle', done => {
      const results: number[] = [];
      const cycles: number[] = [0, 0, 0, 0, 0, 0];
      const scheduler = new Scheduler<any, any, '50ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-50ms-T1-${cycles[0]}`),
                  options: {
                    id: 'myTask1',
                  },
                },
                {
                  tasks: [
                    {
                      taskArgs: [],
                      task: () => Promise.resolve(`R1-50ms-G2-1-${cycles[1]}`),
                      options: {
                        id: 'myGroupTask1',
                      },
                    },
                    {
                      taskArgs: [],
                      task: () => Promise.resolve(`R1-50ms-G2-1-${cycles[2]}`),
                      options: {
                        id: 'myyGroupTask2',
                      },
                    },
                  ],
                  options: {
                    id: 'myTask2',
                  },
                },
                {
                  pattern: {
                    pre: [
                      {
                        taskArgs: [],
                        task: () => Promise.resolve(`R1-50ms-S1-1-${cycles[3]}`),
                        options: {
                          id: 'mySequenceTask1',
                        },
                      },
                    ],
                    task: {
                      taskArgs: [],
                      task: () => Promise.resolve(`R1-50ms-S1-2-${cycles[4]}`),
                      options: {
                        id: 'mySequenceTask2',
                      },
                    },
                    post: [
                      {
                        taskArgs: [],
                        task: () => Promise.resolve(`R1-50ms-S1-3-${cycles[5]}`),
                        options: {
                          id: 'mySequenceTask3',
                        },
                      },
                    ],
                    finally: [
                      {
                        taskArgs: [],
                        task: () => Promise.resolve(`R1-50ms-S1-4-${cycles[6]}`),
                        options: {
                          id: 'mySequenceTask4',
                        },
                      },
                    ],
                  },
                  options: {
                    id: 'myTask3',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
          myResource2: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R2-50ms-T1-${cycles[0]}`),
                  options: {
                    id: 'myTask4',
                  },
                },
                {
                  tasks: [
                    {
                      taskArgs: [],
                      task: () => Promise.resolve(`R2-50ms-G2-1-${cycles[1]}`),
                      options: {
                        id: 'myGroupTask1',
                      },
                    },
                    {
                      taskArgs: [],
                      task: () => Promise.resolve(`R2-50ms-G2-1-${cycles[2]}`),
                      options: {
                        id: 'myyGroupTask2',
                      },
                    },
                  ],
                  options: {
                    id: 'myTask5',
                  },
                },
                {
                  pattern: {
                    pre: [
                      {
                        taskArgs: [],
                        task: () => Promise.resolve(`R2-50ms-S1-1-${cycles[3]}`),
                        options: {
                          id: 'mySequenceTask1',
                        },
                      },
                    ],
                    task: {
                      taskArgs: [],
                      task: () => Promise.resolve(`R2-50ms-S1-2-${cycles[4]}`),
                      options: {
                        id: 'mySequenceTask2',
                      },
                    },
                    post: [
                      {
                        taskArgs: [],
                        task: () => Promise.resolve(`R2-50ms-S1-3-${cycles[5]}`),
                        options: {
                          id: 'mySequenceTask3',
                        },
                      },
                    ],
                    finally: [
                      {
                        taskArgs: [],
                        task: () => Promise.resolve(`R2-50ms-S1-4-${cycles[6]}`),
                        options: {
                          id: 'mySequenceTask4',
                        },
                      },
                    ],
                  },
                  options: {
                    id: 'myTask6',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 4, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
      });
      scheduler.on(
        'done',
        (uuid: string, result: number, meta: MetaData, error?: Crash | Multi) => {
          results.push(result);
          expect(meta.status).toBe('completed');
          expect(meta.taskId).toMatch(/myTask[1-6]/);
          expect(error).toBeUndefined();
          cycles[parseInt(meta.taskId.charAt(meta.taskId.length - 1)) - 1] += 1;
        }
      );
      expect(scheduler).toBeInstanceOf(Scheduler);
      scheduler.start();
      setTimeout(() => {
        expect(cycles).toEqual([5, 5, 5, 5, 5, 5]);
        scheduler.close();
        done();
      }, 225);
    }, 300);
    it(`Should add and drop resources to a scheduler properly`, () => {
      const scheduler = new Scheduler<any, any, '50ms' | '100ms'>('myScheduler');
      scheduler.addResource('myResource1', {
        pollingGroups: {
          '50ms': [
            {
              taskArgs: [],
              task: () => Promise.resolve(),
              options: {
                id: 'myTask1',
              },
            },
          ],
        },
        limiterOptions: { concurrency: 1, delay: 0 },
      });
      expect(
        //@ts-ignore - Testing the pollingExecutors
        scheduler.pollingExecutors.get('myResource1').get('50ms').manager.fastEntries.size
      ).toEqual(1);
      //@ts-ignore - Testing the pollingExecutors
      expect(Array.from(scheduler.pollingExecutors.get('myResource1').values()).length).toEqual(1);
      //@ts-ignore - Testing the pollingExecutors
      expect(Array.from(scheduler.pollingExecutors.values()).length).toEqual(1);
      // To test all the lines of code
      scheduler.addResource('myResource1', {
        pollingGroups: {
          '50ms': [
            {
              taskArgs: [],
              task: () => Promise.resolve(),
              options: {
                id: 'myTask1',
              },
            },
            {
              taskArgs: [],
              task: () => Promise.resolve(),
              options: {
                id: 'myTask2',
              },
            },
          ],
          '100ms': [
            {
              taskArgs: [],
              task: () => Promise.resolve(),
              options: {
                id: 'myTask3',
              },
            },
          ],
        },
        limiterOptions: { concurrency: 4, delay: 0 },
      });
      expect(
        //@ts-ignore - Testing the pollingExecutors
        scheduler.pollingExecutors.get('myResource1').get('50ms').manager.fastEntries.size
      ).toEqual(2);
      //@ts-ignore - Testing the pollingExecutors
      expect(Array.from(scheduler.pollingExecutors.get('myResource1').values()).length).toEqual(2);
      //@ts-ignore - Testing the pollingExecutors
      expect(Array.from(scheduler.pollingExecutors.values()).length).toEqual(1);
      scheduler.dropResource('myResource1');
      //@ts-ignore - Testing the pollingExecutors
      expect(scheduler.pollingExecutors.get('myResource1')).toBeUndefined();
      //Do nothing
      scheduler.dropResource('myResource2');
      scheduler.addResource('myResource1', {
        pollingGroups: {
          '50ms': [
            {
              taskArgs: [],
              task: () => Promise.resolve(),
              options: {
                id: 'myTask1',
              },
            },
          ],
        },
        limiterOptions: { concurrency: 1, delay: 0 },
      });
      expect(
        //@ts-ignore - Testing the pollingExecutors
        scheduler.pollingExecutors.get('myResource1').get('50ms').manager.fastEntries.size
      ).toEqual(1);
      //@ts-ignore - Testing the pollingExecutors
      expect(Array.from(scheduler.pollingExecutors.get('myResource1').values()).length).toEqual(1);
      //@ts-ignore - Testing the pollingExecutors
      expect(Array.from(scheduler.pollingExecutors.values()).length).toEqual(1);
      scheduler.cleanup();
      //@ts-ignore - Testing the pollingExecutors
      expect(scheduler.pollingExecutors.get('myResource1')).toBeUndefined();
    });
  });
  describe('#Sad path', () => {
    it('Should create a new instance of Scheduler with simple task and executed more than one cycle with some task that fail always', done => {
      const results: number[] = [];
      const cycles: number[] = [0, 0, 0, 0, 0, 0];
      const scheduler = new Scheduler<any, any, '50ms' | '100ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-50ms-T1-${cycles[0]}`),
                  options: {
                    id: 'myTask1',
                  },
                },
              ],
              '100ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-100ms-T1-${cycles[1]}`),
                  options: {
                    id: 'myTask2',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
          myResource2: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R2-50ms-T1-${cycles[2]}`),
                  options: {
                    id: 'myTask3',
                  },
                },
                {
                  taskArgs: [],
                  task: () => Promise.reject(new Error(`R2-50ms-T2-${cycles[3]}`)),
                  options: {
                    id: 'myTask4',
                  },
                },
              ],
              '100ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R2-100ms-T1-${cycles[4]}`),
                  options: {
                    id: 'myTask5',
                  },
                },
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R2-100ms-T2-${cycles[5]}`),
                  options: {
                    id: 'myTask6',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 4, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
        slowCycleRatio: 2,
      });
      scheduler.on(
        'done',
        (uuid: string, result: number, meta: MetaData, error?: Crash | Multi) => {
          results.push(result);
          if (error) {
            expect(meta.status).toBe('failed');
            expect(meta.taskId).toMatch(/myTask4/);
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe(
              `Execution error in task [myTask4]: R2-50ms-T2-${cycles[3]}`
            );
            cycles[parseInt(meta.taskId.charAt(meta.taskId.length - 1)) - 1] += 1;
          } else {
            expect(meta.status).toBe('completed');
            expect(meta.taskId).toMatch(/myTask[1-3,5-6]/);
            expect(error).toBeUndefined();
            cycles[parseInt(meta.taskId.charAt(meta.taskId.length - 1)) - 1] += 1;
          }
        }
      );
      expect(scheduler).toBeInstanceOf(Scheduler);
      scheduler.start();
      setTimeout(() => {
        expect(cycles).toEqual([5, 3, 5, 3, 3, 3]);
        scheduler.stop();
        done();
      }, 225);
    }, 300);
    it(`Should overruns the polling time if some task takes more than the polling time`, done => {
      const results: number[] = [];
      const cycles: number[] = [0, 0];
      const scheduler = new Scheduler<any, any, '50ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () =>
                    new Promise(resolve =>
                      setTimeout(() => resolve(`R1-50ms-T1-${cycles[0]}`), 100)
                    ),
                  options: {
                    id: 'myTask1',
                    retryOptions: { attempts: 3, timeout: 120 },
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
          myResource2: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R2-50ms-T1-${cycles[2]}`),
                  options: {
                    id: 'myTask2',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 4, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
      });
      scheduler.on(
        'done',
        (uuid: string, result: number, meta: MetaData, error?: Crash | Multi) => {
          results.push(result);
          expect(meta.status).toBe('completed');
          expect(meta.taskId).toMatch(/myTask[1-2]/);
          expect(error).toBeUndefined();
          cycles[parseInt(meta.taskId.charAt(meta.taskId.length - 1)) - 1] += 1;
        }
      );
      expect(scheduler).toBeInstanceOf(Scheduler);
      scheduler.start();
      setTimeout(() => {
        expect(cycles).toEqual([5, 11]);
        scheduler.stop();
        expect(scheduler.checks).toBeDefined();
        const myCheck = scheduler.checks['scheduler:status'][0];
        expect(myCheck.observedValue['cycles']).toEqual(5);
        expect(myCheck.observedValue['consecutiveOverruns']).toEqual(5);
        expect(myCheck.observedValue['overruns']).toEqual(5);
        expect(myCheck.status).toEqual('warn');
        expect(scheduler.metrics.getSingleMetric('scan_cycles_total')).toBeDefined();
        done();
      }, 550);
    }, 600);
    it(`Should throw an error if a task is not valid`, async () => {
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task
                '50ms': [{}],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The task configuration should have a task, tasks or pattern property'
        );
      }
    }, 300);
    it(`Should throw an error if the resources is not valid`, async () => {
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          // @ts-expect-error - Testing invalid resource
          resources: [],
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The resources should be an object: []');
      }
    }, 300);
    it(`Should throw an error if a resource entry is not valid`, async () => {
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            // @ts-expect-error - Testing invalid resource entry
            myResource1: [],
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The resource entry should be an object: []');
      }
    }, 300);
    it(`Should throw an error if a resource key is not valid`, async () => {
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            // @ts-expect-error - Testing invalid resource entry
            '': {},
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The resource should be a non empty string: ""');
      }
    }, 300);
    it(`Should throw an error if a period is not well configured`, async () => {
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid period
                '10ms': [],
                '10s': [],
                '10m': [],
                '10h': [],
                '10d': [],
                '10y': [],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The period should be a string with the format <number><ms|s|m|h|d>'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid period
                poms: [],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The period could not be parsed: Wrong period value [poms], the period should be a string with the format <number><ms|s|m|h|d>'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid period
                '10ms': {},
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The tasks should be an array of tasks: {}');
      }
    }, 300);
    it(`Should throw an error if a task config is not valid`, async () => {
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [3],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The task configuration should be an object');
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ task: 4 }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The task should be a function or a promise: {\n  "task": 4\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ task: () => Promise.resolve(4), taskArgs: {} }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The taskArgs should be an array: {\n  "taskArgs": {}\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ task: () => Promise.resolve(4), options: [] }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The options should be an object: []');
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ task: () => Promise.resolve(4), options: {} }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The options should have an id property: {}');
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ task: () => Promise.resolve(4), options: { id: 3 } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('The id should be a string: {\n  "id": 3\n}');
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                '50ms': [{ task: () => Promise.resolve(4), options: { id: '' } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The id should be a non empty string: {\n  "id": ""\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                '50ms': [{ task: () => Promise.resolve(4), options: { id: ''.padEnd(280, '0') } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          `The id should be a string with less than 255 characters: {\n  "id": "${''.padEnd(280, '0')}"\n}`
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ tasks: 4 }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The tasks should be an array of tasks: {\n  "tasks": 4\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ pattern: [] }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'Pattern should be an object an object with the task property: {\n  "pattern": []\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ pattern: { task: [] } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The sequence configuration should have a task property: {\n  "pattern": {\n    "task": []\n  }\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ pattern: { task: {}, pre: {} } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The pre property should be an array of tasks: {\n  "pattern": {\n    "task": {},\n    "pre": {}\n  }\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ pattern: { task: {}, post: {} } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The post property should be an array of tasks: {\n  "pattern": {\n    "task": {},\n    "post": {}\n  }\n}'
        );
      }
      try {
        new Scheduler<any, any, '50ms'>('myScheduler', {
          resources: {
            myResource1: {
              pollingGroups: {
                // @ts-expect-error - Testing invalid task config
                '50ms': [{ pattern: { task: {}, finally: {} } }],
              },
              limiterOptions: { concurrency: 2, delay: 0 },
            },
          },
          limiterOptions: { concurrency: 6, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe(
          'The finally property should be an array of tasks: {\n  "pattern": {\n    "task": {},\n    "finally": {}\n  }\n}'
        );
      }
    }, 300);
    it(`Should throw if try to add a resource to a running scheduler`, async () => {
      const scheduler = new Scheduler<any, any, '50ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-50ms-T1`),
                  options: {
                    id: 'myTask1',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
      });
      scheduler.start();
      try {
        scheduler.addResource('myResource2', {
          pollingGroups: {
            '50ms': [
              {
                taskArgs: [],
                task: () => Promise.resolve(`R2-50ms-T1`),
                options: {
                  id: 'myTask2',
                },
              },
            ],
          },
          limiterOptions: { concurrency: 2, delay: 0 },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('Cannot add resources to a running scheduler');
      }
      scheduler.stop();
    }, 300);
    it(`Should throw if try to drop a resource to a running scheduler`, async () => {
      const scheduler = new Scheduler<any, any, '50ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-50ms-T1`),
                  options: {
                    id: 'myTask1',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
      });
      scheduler.start();
      try {
        scheduler.dropResource('myResource1');
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('Cannot drop resources from a running scheduler');
      }
      scheduler.stop();
    }, 300);
    it(`Should throw if try to cleanup a scheduler that is running`, async () => {
      const scheduler = new Scheduler<any, any, '50ms'>('myScheduler', {
        resources: {
          myResource1: {
            pollingGroups: {
              '50ms': [
                {
                  taskArgs: [],
                  task: () => Promise.resolve(`R1-50ms-T1`),
                  options: {
                    id: 'myTask1',
                  },
                },
              ],
            },
            limiterOptions: { concurrency: 2, delay: 0 },
          },
        },
        limiterOptions: { concurrency: 6, delay: 0 },
      });
      scheduler.start();
      try {
        scheduler.cleanup();
      } catch (error) {
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).message).toBe('Cannot cleanup a running scheduler');
      }
      scheduler.stop();
    }, 300);
  });
});
