# **@mdf.js/tasks**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)
[![Documentation](https://img.shields.io/static/v1?style=flat\&logo=markdown\&label=Documentation\&message=API\&color=blue)](https://mytracontrol.github.io/mdf.js/)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/tasks**](#mdfjstasks)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Use**](#use)
    - [**Tasks**](#tasks)
      - [**Single**](#single)
      - [**Group**](#group)
      - [**Sequence**](#sequence)
    - [**Limiter**](#limiter)
      - [**Create a new limiter (`LimiterOptions`)**](#create-a-new-limiter-limiteroptions)
    - [**Scheduling and executing tasks**](#scheduling-and-executing-tasks)
    - [**Scheduler**](#scheduler)
      - [**Create a new scheduler (`SchedulerOptions`)**](#create-a-new-scheduler-scheduleroptions)
      - [**Start and stop the scheduler**](#start-and-stop-the-scheduler)
      - [**Scheduler monitoring**](#scheduler-monitoring)
  - [**License**](#license)

## **Introduction**

The **@mdf.js/tasks** package is a set of tools designed to facilite the development of services that require the execution of tasks in a controlled manner. The package is composed of the following elements:

- **Tasks**: `Single`, `Group` or `Sequence` are the types of tasks that can be executed, each one extends the `TaskHandler` class, that provides the basic functionality to manage the task, and include some additional properties and methods to control the execution of specific kind of tasks.
  - **Single**: A single task that can be executed.
  - **Group**: A group of tasks that can be executed in parallel.
  - **Sequence**: A specific sequence needed to execute a concrete task, allowing to define pre, post and finally tasks, besides the main task.
- **Limiter**: A class that allows to control the number of tasks that can be executed in parallel.
- **Scheduler**: A class that allows to schedule the execution of tasks in a specific time.

Each element is designed to be used together with the others, but *tasks* can be used independently if needed.

## **Installation**

To install the **@mdf.js/tasks** package, you can use the following commands:

- **NPM**:

```bash
npm install @mdf.js/tasks
```

- **Yarn**:

```bash
yarn add @mdf.js/tasks
```

## **Use**

### **Tasks**

Tasks are the main element of the package, based in the `TaskHandler` class, that provides the basic functionality to manage the task, and include some additional properties and methods to control the execution of specific kind of tasks. These tasks acts as *instances of task execution requests*, allowing to control the execution and result. The `Single` task is the basic task, `Group`and `Sequence` are *different* ways to execute `Single` tasks, allowing to resolve more complex scenarios.

As each task type extends the `TaskHandler` class, let's see the basic properties and methods that are common to all of them:

- **Properties**:
  - **`uuid`** (`string`): The unique identifier of the task instance.
  - **`taskId`** (`string`): The identifier of the task, defined by the user.
  - **`createdAt`** (`Date`): The date and time when the task was created.
  - **`priority`** (`number`): The priority of the task, used to order the execution of tasks in `Limiter` or `Scheduler`.
  - **`weight`** (`number`): The weight of the task, used in the `Limiter` to control the number of tasks that can be executed in parallel.
  - **`metadata`** (`Metadata`): The task metadata object that contains all the relevant information about the task and its execution.

    ```typescript
    /** Metadata of the execution of the task */
    export interface MetaData {
      /** Unique task identification, unique for each task */
      uuid: string;
      /** Task identifier, defined by the user */
      taskId: string;
      /** Status of the task */
      status: TaskState;
      /** Date when the task was created */
      createdAt: string;
      /** Date when the task was executed in ISO format */
      executedAt?: string;
      /** Date when the task was completed in ISO format */
      completedAt?: string;
      /** Date when the task was cancelled in ISO format */
      cancelledAt?: string;
      /** Date when the task was failed in ISO format  */
      failedAt?: string;
      /** Reason of failure or cancellation */
      reason?: string;
      /** Duration of the task in milliseconds */
      duration?: number;
      /** Task priority */
      priority: number;
      /** Task weight */
      weight: number;
      /** Additional metadata objects, store the metadata information from related tasks in a sequence or group */
      $meta?: MetaData[];
    }
    ```

- **Methods**:
  - **`async execute(): Promise<Result>`**: Executes the task, returning a promise with the result of the execution.
  - **`async cancel(error?: Crash): void`**: Cancels the task execution.

All the different tasks constructors, besides other parameters, allow to configure the task execution with the following options (`TaskOptions`):

- **`id`** (`string`): The identifier of the task, defined by the user, if not provided, a random identifier will be generated.
- **`priority`** (`number`): The priority of the task, used to order the execution of tasks in `Limiter` or `Scheduler`. Default is `0`.
- **`weight`** (`number`): The weight of the task, used in the `Limiter` to control the number of tasks that can be executed in parallel. Default is `1`.
- **`retryOptions`** (`RetryOptions`): The options to retry the task in case of failure. Check the `RetryOptions` interface for more information in the `@mdf.js/utils` package.
- `bind` (`any`): The object to bind the task to, if the task is a method of a class.
- `retryStrategy` (`RetryStrategy`): The strategy to retry the task in case of `execute` method being called again. Possible values are:
  - `retry` (`RETRY_STRATEGY.RETRY`): The task will allow to retry the execution again if it fails, updating the metadata in each retry.
  - `failAfterSuccess` (`RETRY_STRATEGY.FAIL_AFTER_SUCCESS`): The task will allow to be executed again if it fails, but it will rejects if there are more retries before the success.
  - `failAfterExecuted` (`RETRY_STRATEGY.FAIL_AFTER_EXECUTED`): The task will allow only one execution, if it fails, it will fail in every retry.
  - `notExecAfterSuccess` (`RETRY_STRATEGY.NOT_EXEC_AFTER_SUCCESS`): The task will resolve the result of first successful execution, if it fails, it will allow to be executed again.

#### **Single**

The `Single` task is the basic task, it has not more options than the `TaskHandler` class, but it can be used to execute any kind of task, as a function or a method of a class. The `Single` task can be used to execute a single task, and it can be used in combination with the `Limiter` or `Scheduler` classes to control the execution of tasks.

```typescript
import { Single, Metadata } from '@mdf.js/tasks';
import { Crash } from '@mdf.js/crash';

// Any kind of promise can be used as task
function task(value: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(value * 2);
    }, 1000);
  });
}
// Or a method of a class
class MyClass {
  task(value: number): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(value * 2);
      }, 1000);
    });
  }
}

const myInstance = new MyClass();

// A task can be created with a function
const unBindedTask = new Single(task, 5, {
  id: 'task1',
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

unBindedTask.on('done', (uuid: string, result: number, meta: Metadata, error?: Crash) => {
  console.log('Task done', uuid, result, meta, error);
});

// Or binded to a class instance
const bindedTask = new Single(myInstance.task, 5, {
  id: 'task2',
  bind: myInstance,
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

bindedTask.on('done', (uuid: string, result: number, meta: Metadata, error?: Crash) => {
  console.log('Task done', uuid, result, meta, error);
});
```

#### **Group**

The `Group` task is a set of tasks that can be executed in order. The `Result` of the execution of the group is an array with the results of each task, and the `$meta` property of the metadata object contains the metadata of each task.

The constructor of the `Group` has the next parameters:

- `tasks` (`TaskHandler[]`): The tasks to be executed in the group.
- `options` (`TaskOptions`): The options to configure the group task execution.
- `atLeastOne` (`boolean`): If `true`, the group will resolve the result if at least one task is resolved, if `false`, all the tasks must be resolved to resolve the group.

```typescript
import { Group, Metadata } from '@mdf.js/tasks';
import { Crash } from '@mdf.js/crash';

const tasks = [
  new Single(task, 5, {
    id: 'task1',
    priority: 1,
    weight: 1,
    retryOptions: { attempts: 3 },
  }),
  new Single(task, 10, {
    id: 'task2',
    priority: 1,
    weight: 1,
    retryOptions: { attempts: 3 },
  }),
];

const group = new Group(tasks, {
  id: 'group1',
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

group.on('done', (uuid: string, result: number[], meta: Metadata, error?: Crash) => {
  console.log('Group done', uuid, result, meta, error);
});
```

#### **Sequence**

The `Sequence` task is a special king of task that need to execute a sequence of tasks in a specific order. The `Sequence` task allows to define pre, post and finally tasks, besides the main task. The `Result` of the execution of the sequence is the result of the main task, and the `$meta` property of the metadata object contains the metadata of each task.

The constructor of the `Sequence` has the next parameters:

- `pattern` (`SequencePattern`): The pattern of the sequence, that defines the pre, post, main and finally tasks:
  - `pre` (`TaskHandler[]`): The tasks to be executed before the main task.
  - `task` (`TaskHandler`): The main task to be executed.
  - `post` (`TaskHandler[]`): The tasks to be executed after the main task, if the main task fails, the post tasks will not be executed.
  - `finally` (`TaskHandler[]`): The tasks to be executed at the end of the sequence, even if the main task fails.
- `options` (`TaskOptions`): The options to configure the sequence task execution.

```typescript
import { Sequence, Metadata } from '@mdf.js/tasks';
import { Crash } from '@mdf.js/crash';

const sequence = new Sequence(
  {
    pre: [
      new Single(task, 5, {
        id: 'pre1',
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 3 },
      }),
    ],
    task: new Single(task, 10, {
      id: 'task1',
      priority: 1,
      weight: 1,
      retryOptions: { attempts: 3 },
    }),
    post: [
      new Single(task, 15, {
        id: 'post1',
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 3 },
      }),
    ],
    finally: [
      new Single(task, 20, {
        id: 'finally1',
        priority: 1,
        weight: 1,
        retryOptions: { attempts: 3 },
      }),
    ],
  },
  {
    id: 'sequence1',
    priority: 1,
    weight: 1,
    retryOptions: { attempts: 3 },
  }
);

sequence.on('done', (uuid: string, result: number, meta: Metadata, error?: Crash) => {
  console.log('Sequence done', uuid, result, meta, error);
});
```

### **Limiter**

The `Limiter` class allows to control the execution of tasks, limiting the number of tasks that can be executed in parallel, the order of the execution based in the priority of the tasks, the cadence of the execution and "throughput", controlling the number of tasks that can be executed in a specific time.

The `Limiter` accepts tasks of any kind, `Single`, `Group` or `Sequence`, allowing to `schedule` the execution of the tasks or `execute` them, taking always into account the `Limiter` configuration.

#### **Create a new limiter (`LimiterOptions`)**

In order to create a new `Limiter` instance, the constructor accepts a `LimiterOptions` object with the following properties:

- **`concurrency`** (`number`): The maximum number of concurrent jobs. Default is `1`.
- **`delay`** (`number`): Delay between each job in milliseconds. Default is `0`. For `concurrency = 1`, the delay is applied after each job is finished. For `concurrency > 1`, if the actual number of concurrent jobs is less than `concurrency`, the delay is applied after each job is finished, otherwise, the delay is applied after each job is started.
- **`retryOptions`** (`RetryOptions`): Set the default options for the retry process of the jobs. Default is `undefined`. Check the `RetryOptions` interface for more information in the `@mdf.js/utils` package.
- **`autoStart`** (`boolean`): Set whether the limiter should start to process the jobs automatically. Default is `true`.
- **`highWater`** (`number`): The maximum number of jobs in the queue. Default is `Infinity`.
- **`strategy`** (`Strategy`): The strategy to use when the queue length reaches highWater. Default is `'leak'`. Possible values are:
  - **`leak`** (`STRATEGY.LEAK`): When adding a new job to a limiter, if the queue length reaches highWater, drop the oldest job with the lowest priority. This is useful when jobs that have been waiting for too long are not important anymore. If all the queued jobs are more important (based on their priority value) than the one being added, it will not be added.
  - **`overflow`** (`STRATEGY.OVERFLOW`): When adding a new job to a limiter, if the queue length reaches highWater, do not add the new job. This strategy totally ignores priority levels.
  - **`overflow-priority`** (`STRATEGY.OVERFLOW_PRIORITY`): Same as LEAK, except it will only drop jobs that are less important than the one being added. If all the queued jobs are as or more important than the new one, it will not be added.
  - **`block`** (`STRATEGY.BLOCK`): When adding a new job to a limiter, if the queue length reaches highWater, the limiter falls into "blocked mode". All queued jobs are dropped and no new jobs will be accepted until the limiter unblocks. It will unblock after penalty milliseconds have passed without receiving a new job. penalty is equal to 15 \* minTime (or 5000 if minTime is 0) by default. This strategy is ideal when bruteforce attacks are to be expected. This strategy totally ignores priority levels.
- **`penalty`** (`number`): The penalty for the BLOCK strategy in milliseconds. Default is `0`.
- **`bucketSize`** (`number`): The bucket size for the rate limiter. Default is `0`. If the bucket size is 0, only `concurrency` and `delay` will be used to limit the rate of the jobs. If the bucket size is greater than 0, the consumption of the tokens will be used to limit the rate of the jobs. The bucket size is the maximum number of tokens that can be consumed in the interval. The interval is defined by the `tokensPerInterval` and `interval` properties.
- **`tokensPerInterval`** (`number`): Define the number of tokens that will be added to the bucket at the beginning of the interval. Default is `1`.
- **`interval`** (`number`): Define the interval in milliseconds. Default is `1000`.

```typescript
import { Limiter, LimiterOptions } from '@mdf.js/tasks';

const limiter = new Limiter({
  concurrency: 2,
  delay: 1000,
  highWater: 10,
  strategy: 'leak',
  penalty: 5000,
  bucketSize: 10,
  tokensPerInterval: 1,
  interval: 1000,
});
```

### **Scheduling and executing tasks**

The `Limiter` class allows to:

- **`schedule`** the execution of tasks, that means that the tasks are added to the queue, and they will be executed when the limiter is ready to process them. When the task is executed two events: `done` and an event with the `taskId`, both of them with the same information:
  - `on('done' | taskId, listener: (uuid: string, result: Result, meta: MetaData, error?: Crash) => void): this`:
  - **`uuid`**: The unique identifier of the task instance.
  - **`result`**: The result of the task execution.
  - **`meta`**: The metadata of the task execution.
  - **`error`**: The error in case of failure.
- **`execute`** the task, that will wait until the limiter is ready to process the task, and execute it, resolving the result of the task execution.

There are several methods to interact with the limiter and control the execution of the tasks:

- **`start(): void`**: Start the limiter, allowing to process the tasks in the queue. If the limiter is already started, it will not do anything. If `autoStart` is `true`, the limiter will start automatically when a task is added to the queue.
- **`stop(): void`**: Stop the limiter, preventing to process the tasks in the queue. If the limiter is already stopped, it will not do anything.
- **`waitUntilEmpty(): Promise<void>`**: Wait until the queue is empty.
- **`clear(): void`**: Clear the queue, removing all the tasks in the queue.

And several properties to get information about the limiter:

- **`size`** (`number`): The number of tasks in the queue.
- **`pending`** (`number`): The number of tasks that are being executed.
- **`options`** (`LimiterOptions`): The options of the limiter.

In order to create more complex scenarios, the `Limiter` class allows to use `pipe` limiters to control the execution of tasks in a more complex way. This option allows, for example, to create several limiters to pull information from different sources, ensuring that this sources are not overloaded, and `pipe` them to a main limiter that will protect the own system from being overloaded.

*Using `schedule` method*:

```typescript
import { Limiter, LimiterOptions } from '@mdf.js/tasks';

const limiter = new Limiter({
  concurrency: 2,
  delay: 1000,
  highWater: 10,
  strategy: 'leak',
  penalty: 5000,
  bucketSize: 10,
  tokensPerInterval: 1,
  interval: 1000,
});

const task1 = new Single(task, 5, {
  id: 'task1',
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

const task2 = new Single(task, 10, {
  id: 'task2',
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

limiter.on('done', (uuid: string, result: number, meta: Metadata, error?: Crash) => {
  console.log('Task done', uuid, result, meta, error);
});

limiter.schedule(task1);
limiter.schedule(task2);
```

*Using `execute` method*:

```typescript
import { Limiter, LimiterOptions } from '@mdf.js/tasks';

const limiter = new Limiter({
  concurrency: 2,
  delay: 1000,
  highWater: 10,
  strategy: 'leak',
  penalty: 5000,
  bucketSize: 10,
  tokensPerInterval: 1,
  interval: 1000,
});

const task1 = new Single(task, 5, {
  id: 'task1',
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

const task2 = new Single(task, 10, {
  id: 'task2',
  priority: 1,
  weight: 1,
  retryOptions: { attempts: 3 },
});

limiter.execute(task1).then(result => {
  console.log('Task done', result);
});
limiter.execute(task2).then(result => {
  console.log('Task done', result);
});
```

### **Scheduler**

The `Scheduler` class allows to schedule the execution of tasks based on **resources** and a **polling times**, this means periodically, controlling the execution of the tasks by the use of a `Limiter` instance per **resource**, piped with a `Limiter` for the `Scheduler` instance.

The `Scheduler` creates two types of cycles, a **fast cycle** and a **slow cycle**, per polling group and resource. The fast cycle is executed every time the polling group is reached, and the slow cycle is executed after `slowCycleRatio` fast cycles. The `Scheduler` class allows to control the execution of the tasks, and provides a set of metrics to monitor the execution of the tasks.

#### **Create a new scheduler (`SchedulerOptions`)**

In order to create a new `Scheduler` instance, the constructor accepts the next parameters:

- `name` (`string`): The name of the scheduler.
- `options` (`SchedulerOptions`): The options to configure the scheduler:
  - **`logger`** (`Logger`): The logger instance to use. If not provided, a default `DebugLogger` from the `@mdf.js/logger` package will be used with the name `mdf:scheduler:${name}`.
  - **`limiterOptions`** (`LimiterOptions`): The options to configure the limiter of the scheduler.
  - **`resources`** (`ResourcesConfigObject`): an object with an entry for each resource, where the key is the name of the resource, and the value is a `ResourceConfigEntry` with the following properties:
    - **`limiterOptions`** (`LimiterOptions`): The options to configure the limiter of the resource.
    - **`pollingGroups`** (`object`): A object with a entry for each polling group, where the key is the name of the group, and the value is a `TaskBaseConfig` array with the tasks to be executed in the group. The keys of this object should be of the type `PollingGroup`, this is a string with the format `${number}d`, `${number}h`, `${number}m`, `${number}s`, `${number}ms`, where `${number}` is the number of days, hours, minutes, seconds or milliseconds to wait between each polling.
      The `TaskBaseConfig` could be a `SingleTaskBaseConfig`, a `GroupTaskBaseConfig` or a `SequenceTaskBaseConfig` object, with the following properties:
      - **`SingleTaskBaseConfig`**:
        - **`task`** (`TaskAsPromise`): Promise to be executed.
        - **`taskArgs`** (`any[]`): Arguments to be passed to the task.
        - **`options`** (`TaskOptions`): a `TaskOptions` object where the `id` property is mandatory.
      - **`GroupTaskBaseConfig`**:
        - **`tasks`** (`SingleTaskBaseConfig[]`): Array of `SingleTaskBaseConfig` objects.
        - **`options`** (`TaskOptions`): a `TaskOptions` object where the `id` property is mandatory.
      - **`SequenceTaskBaseConfig`**:
        - **`pattern`** (`SequencePattern`): The pattern of the sequence, that defines the pre, post, main and finally tasks:
          - `pre` (`SingleTaskBaseConfig[]`): The tasks to be executed before the main task.
          - `task` (`SingleTaskBaseConfig`): The main task to be executed.
          - `post` (`SingleTaskBaseConfig[]`): The tasks to be executed after the main task, if the main task fails, the post tasks will not be executed.
          - `finally` (`SingleTaskBaseConfig[]`): The tasks to be executed at the end of the sequence, even if the main task fails.
        - **`options`** (`TaskOptions`): a `TaskOptions` object where the `id` property is mandatory.
  - **`slowCycleRatio`** (`number`): number of fast cycles to be executed before a slow cycle is executed. Default is `3`.
  - **`cyclesOnStats`** (`number`): number of cycles to be included in the statistics. Default is `10`.

The `Scheduler` has generic parameters in order to be typed:

- `Result` (`Result`): The type of the result of the tasks. If not provided, the result will be `any`.
- `Binding` (`Binding`): The type of the object to bind the tasks to. If not provided, the binding will be `any`.
- `PollingGroups` (`PollingGroup`): The available polling groups. If not provided, the polling groups will be `DefaultPollingGroups`: `'1d'`, `'12h'`, `'6h'`, `'6h'`, `'1h'`, `'30m'`, `'15m'`, `'10m'`, `'5m'`, `'1m'`, `'30s'`, `'10s'`, `'5s'`.

```typescript
import { Scheduler, SchedulerOptions } from '@mdf.js/tasks';

class MyClass {
  constructor(private readonly resource: string) {};
  task1(value: number): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(value * 2);
      }, 1000);
    });
  }
  task2(value: number): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(value * 3);
      }, 1000);
    });
  }
}

const resource1 = new MyClass('resource1');
const resource2 = new MyClass('resource2');
type MyPollingGroups = '5m' | '1m';

const scheduler = new Scheduler<number, MyClass, MyPollingGroups>('myScheduler', {
  limiterOptions: {
    concurrency: 2,
    delay: 1000,
    highWater: 10,
    strategy: 'leak',
    penalty: 5000,
    bucketSize: 10,
    tokensPerInterval: 1,
    interval: 1000,
  },
  resources: {
    resource1: {
      limiterOptions: {
        concurrency: 2,
        delay: 1000,
        highWater: 10,
        strategy: 'leak',
        penalty: 5000,
        bucketSize: 10,
        tokensPerInterval: 1,
        interval: 1000,
      },
      pollingGroups: {
        '5m': [
          {
            task: resource1.task1,
            taskArgs: [5],
            options: {
              id: 'task1',
              priority: 1,
              weight: 1,
              retryOptions: { attempts: 3 },
            },
          },
        ],
        '1m': [
          {
            task: resource1.task2,
            taskArgs: [10],
            options: {
              id: 'task2',
              priority: 1,
              weight: 1,
              retryOptions: { attempts: 3 },
            },
          },
        ],
      },
    },
    resource2: {
      limiterOptions: {
        concurrency: 2,
        delay: 1000,
        highWater: 10,
        strategy: 'leak',
        penalty: 5000,
        bucketSize: 10,
        tokensPerInterval: 1,
        interval: 1000,
      },
      pollingGroups: {
        '5m': [
          {
            task: resource2.task1,
            taskArgs: [5],
            options: {
              id: 'task1',
              priority: 1,
              weight: 1,
              retryOptions: { attempts: 3 },
            },
          },
        ],
        '1m': [
          {
            task: resource2.task2,
            taskArgs: [10],
            options: {
              id: 'task2',
              priority: 1,
              weight: 1,
              retryOptions: { attempts: 3 },
            },
          },
        ],
      },
    },
  },
});
```

New resources can be added to the scheduler using the `addResource` or `addResources` methods, and deleted using the `dropResource` method, in all the cases the `Scheduler` should be stopped, in other case the method will throw an error. The resources can be cleared using the `cleanup` method.

```typescript
scheduler.addResource('resource3', {
  limiterOptions: {
    concurrency: 2,
    delay: 1000,
    highWater: 10,
    strategy: 'leak',
    penalty: 5000,
    bucketSize: 10,
    tokensPerInterval: 1,
    interval: 1000,
  },
  pollingGroups: {
    '5m': [
      {
        task: resource2.task1,
        taskArgs: [5],
        options: {
          id: 'task1',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 3 },
        },
      },
    ],
    '1m': [
      {
        task: resource2.task2,
        taskArgs: [10],
        options: {
          id: 'task2',
          priority: 1,
          weight: 1,
          retryOptions: { attempts: 3 },
        },
      },
    ],
  },
});

scheduler.dropResource('resource3');
scheduler.cleanup();
```

#### **Start and stop the scheduler**

The `Scheduler` class allows to start and stop the scheduler, controlling the execution of the tasks:

- **`async start(): Promise<void>`**: Start the scheduler, allowing to process the tasks in the polling groups. If the scheduler is already started, it will not do anything.
- **`async stop(): Promise<void>`**: Stop the scheduler, preventing to process the tasks in the polling groups. If the scheduler is already stopped, it will not do anything.
- **`async close(): Promise<void>`**: Close the scheduler, stopping the scheduler and clearing the polling groups.

Every time a task is executed, the `done` event is emitted with the following parameters:

- **`uuid`**: The unique identifier of the task instance.
- **`result`**: The result of the task execution.
- **`meta`**: The metadata of the task execution.
- **`error`**: The error in case of failure.
- **`resource`**: The name of the resource where the task was executed.

```typescript
scheduler.on('done', (uuid: string, result: number, meta: Metadata, error?: Crash, resource: string) => {
  console.log('Task done', uuid, result, meta, error, resource);
});
```

#### **Scheduler monitoring**

The `Scheduler` class implements the `Layer.App.Service` interface, so it can be used with the `@mdf.js/service-registry` package to monitor the scheduler. The `Scheduler` class collect the following metrics for each resource and polling group:

- **`scanTime`** (`Date`): The date and time when the scan was performed.
- **`cycles`** (`number`): The number of cycles performed.
- **`overruns`** (`number`): The number of cycles with overruns.
- **`consecutiveOverruns`** (`number`): The number of consecutive overruns.
- **`averageCycleDuration`** (`number`): The average cycle duration in milliseconds.
- **`maxCycleDuration`** (`number`): The maximum cycle duration in milliseconds.
- **`minCycleDuration`** (`number`): The minimum cycle duration in milliseconds.
- **`lastCycleDuration`** (`number`): The last cycle duration in milliseconds.
- **`inFastCycleTasks`** (`number`): The number of tasks included on the regular cycle.
- **`inSlowCycleTasks`** (`number`): The number of tasks included on the slow cycle. This cycle is executed after `slowCycleRatio` fast cycles.
- **`inOffCycleTasks`** (`number`): The number of tasks included on the off cycle, these are not executed.
- **`pendingTasks`** (`number`): The number of tasks in execution in this moment.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
