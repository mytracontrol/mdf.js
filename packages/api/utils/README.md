# **@mdf.js/utils**

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

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/utils</h1>
<h5 style="text-align:center;margin-top:0">Collection of tools useful for several different tasks within the @mdf.js ecosystem</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/utils**](#mdfjsutils)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Use**](#use)
    - [**`retry` and `retryBind`**](#retry-and-retrybind)
    - [**`prettyMS`**](#prettyms)
    - [**`loadFile`**](#loadfile)
    - [**`findNodeModule`**](#findnodemodule)
    - [**`escapeRegExp`**](#escaperegexp)
    - [**`coerce`**](#coerce)
    - [**`camelCase`**](#camelcase)
    - [**`deCycle` and `retroCycle`**](#decycle-and-retrocycle)
    - [**`formatEnv`**](#formatenv)
  - [**License**](#license)

## **Introduction**

The **@mdf.js/utils** module is a collection of tools useful for several different tasks within the @mdf.js ecosystem. It is a collection of utilities that are used in different parts of the framework, such as the API, the CLI, the documentation...

The list of utilities are:

- **`retry`** and **`retryBind`**: A function that allows you to retry a promise a certain number of times before giving up.
- **`prettyMS`**: A function that converts milliseconds to a human-readable format.
- **`loadFile`**: A function that loads a file from the file system, logging the process.
- **`findNodeModule`**: A function that finds a node module in the file system.
- **`escapeRegExp`**: A function that escapes a string to be used in a regular expression.
- **`coerce`**: function for data type coercion, specially useful for environment variables and configuration files.
- **`camelCase`**: function for converting strings to camelCase.
- **`cycle`**: function for managing circular references in objects.
- **`formatEnv`**: functions for formatting environment variables.
- **`mock`**: functions for mocking objects, specially useful for testing in Jest.

## **Installation**

To install the **@mdf.js/utils** module, you can use the following commands:

- **NPM**

```shell
npm install @mdf.js/utils
```

- **Yarn**

```shell
yarn add @mdf.js/utils
```

## **Use**

### **`retry` and `retryBind`**

The `retry` and `retryBind` functions are used to retry a promise a certain number of times before giving up. The difference between both functions is that the `retryBind` can bind the context of the promise to a concrete object.

Both functions have similar signatures:

- **`retry`**: `retry<T>(task: TaskAsPromise<T>, funcArgs: TaskArguments, options: RetryOptions): Promise<T>`.
- **`retryBind`**: `retryBind<T, U>(task: TaskAsPromise<T>, bindTo: U, funcArgs: TaskArguments, options: RetryOptions): Promise<T>`.

The common parameters are between both functions are:

- **`task`** (`TaskAsPromise<T>`): The task to be executed. `TaskAsPromise<T>` is alias type for `(...args: TaskArguments) => Promise<T>`.
- **`funcArgs`** (`TaskArguments`): The arguments to be passed to the task. `TaskArguments` is an alias type for `any[]`.
- **`options`** (`RetryOptions`): The options for the retry. `RetryOptions` is an interface with the following properties:
  - **`logger`** (`LoggerFunction`): The logger function used for logging retry attempts. `LoggerFunction` is an alias type for `(error: Crash | Multi | Boom) => void`. `Crash`, `Multi`, and `Boom` are errors defined in the [`@mdf.js/crash`](https://www.npmjs.com/package/@mdf.js/crash).
  - **`waitTime`** (`number`): The time to wait between retry attempts, in milliseconds. Default is `1000`.
  - **`maxWaitTime`** (`number`): The maximum time to wait between retry attempts, in milliseconds. Default is `15000`.
  - **`abortSignal`** (`AbortSignal`): The signal to be used to interrupt the retry process. Default is `null`.
  - **`attempts`** (`number`): The maximum number of retry attempts. Default is `Number.MAX_SAFE_INTEGER`.
  - **`timeout`** (`number`): Timeout for each try. Default is `undefined`.
  - **`interrupt`** (`() => boolean`): A function that determines whether to interrupt the retry process. Should return `true` to interrupt, `false` otherwise. Default is `undefined`. **Deprecated**. Use `abortSignal` instead.

The extra parameter for the `retryBind` function is:

- **`bindTo`** (`U`): The object to bind the context of the promise to.

***Simple task***:

```typescript
import { retry, retryBind } from '@mdf.js/utils';
import { Logger } from '@mdf.js/logger';

const logger: Logger = new Logger();

const task = async (a: number, b: number) => {
  if (Math.random() < 0.5) {
    throw new Error('Random error');
  }
  return a + b;
};

const funcArgs = [1, 2];
const options = {
  logger: logger.crash,
  waitTime: 1000,
  maxWaitTime: 15000,
  attempts: 5,
  timeout: 5000,
};

retry(task, [1, 2], options).then(console.log).catch(console.error);
```

Aborting the retry process can be done using an `AbortSignal`:

```typescript
import { retry } from '@mdf.js/utils';
import { Logger } from '@mdf.js/logger';

const logger: Logger = new Logger();
const controller = new AbortController();

class MyContext {
  public c = 10;
  public task = async (a: number, b: number) => {
    if (Math.random() < 0.5) {
      throw new Error('Random error');
    }
    return a + b;
  };
}

const context = new MyContext();

const options = {
  logger: logger.crash,
  waitTime: 1000,
  maxWaitTime: 15000,
  attempts: 5,
  timeout: 5000,
  abortSignal: controller.signal,
};

setTimeout(() => controller.abort(), 3000);
retryBind(context.task, context, [1, 2], options).then(console.log).catch(console.error);
```

### **`prettyMS`**

The `prettyMS` function is used to convert milliseconds to a human-readable format. It has the following signature:

- **`prettyMS`**: `(ms: number): string`.

```typescript
import { prettyMS } from '@mdf.js/utils';

console.log(prettyMS(1000)); // 1s
console.log(prettyMS(1000 * 60)); // 1m
console.log(prettyMS(1000 * 60 * 60)); // 1h
console.log(prettyMS(1000 * 60 * 60 * 24)); // 1d
```

### **`loadFile`**

The `loadFile` function is used to load a file from the file system, logging the process. It has the following signature:

- **`loadFile`**: `(path: string, logger?: LoggerInstance): Buffer | undefined`. The `logger` parameter is optional and is used to log the process, it should be an instance of the `LoggerInstance` class from the `@mdf.js/logger` package or a simple object with a `debug` method that accepts a string.

```typescript
import { loadFile } from '@mdf.js/utils';

const logger = {
  debug: (message: string) => console.log(message),
};
const file = loadFile('path/to/file', logger);
```

### **`findNodeModule`**

The `findNodeModule` function is used to find a node module in the file system. It has the following signature:

- **`findNodeModule`**: `(module: string, dir?: string): string | undefined`. The `dir` parameter is optional and is used to specify the current working directory, default is `__dirname`, this means that the search will start from the own module.

```typescript
import { findNodeModule } from '@mdf.js/utils';

const modulePath = findNodeModule('module-name');
```

### **`escapeRegExp`**

The `escapeRegExp` function is used to get the source of a regular expression pattern and escape it. It has the following signature:

- **`escapeRegExp`**: `(regex: RexExp): string`. The `regex` parameter is the regular expression to escape.

```typescript
import { escapeRegExp } from '@mdf.js/utils';

const escaped = escapeRegExp(/([.*+?^=!:${}()|\[\]\/\\])/g);
console.log(escaped); // \(\[\.\*\+\?\^\=\!\:\$\{\}\(\)\|\[\]\/\\]\)
```

### **`coerce`**

The `coerce` function is used for data type coercion, specially useful for environment variables and configuration files. It has the following signature:

- **`coerce`**: `<T extends Coerceable>(env: string | undefined, alternative?: T): T | undefined`. The `env` parameter is the value to coerce, and the `alternative` parameter is the default value to return if the coercion fails. The `Coerceable` type is an alias type for `number | boolean | Record<string, any> | any[] | null`.

```typescript
import { coerce } from '@mdf.js/utils';

// process.env['MY_ENV_VAR'] = '1';
const asNumber = coerce<number>(process.env['MY_ENV_VAR'], 10); // Coerce to number, default to 10
// process.env['MY_ENV_VAR'] = 'true' or 'false';
const asBoolean = coerce<boolean>(process.env['MY_ENV_VAR'], true); // Coerce to boolean, default to true
// process.env['MY_ENV_VAR'] = '{"a": 1}';
const asObject = coerce<Record<string, any>>(process.env['MY_ENV_VAR'], { a: 1 }); // Coerce to object, default to { a: 1 }
// process.env['MY_ENV_VAR'] = '[1,2,3]';
const asArray = coerce<any[]>(process.env['MY_ENV_VAR'], [1, 2, 3]); // Coerce to array, default to [1, 2, 3]
// process.env['MY_ENV_VAR'] = 'null' or 'NULL';
const asNull = coerce(process.env['MY_ENV_VAR']); // Coerce to null
```

### **`camelCase`**

The `camelCase` function is used to convert strings to camelCase. It has the following signature:

- **`camelCase`**: `(input: string | string[], options?: Options): string`. The `input` parameter is the string or array of strings to convert, and the `options` parameter is an object with the following properties:
  - **`pascalCase`** (`boolean`): Convert to PascalCase. `foo-bar` -> `FooBar`. Default is `false`.
  - **`preserveConsecutiveUppercase`** (`boolean`): Preserve consecutive uppercase characters. `foo-BAR` -> `fooBAR`. Default is `false`.
  - **`locale`** (`string | string[]`): The locale parameter indicates the locale to be used to convert to upper/lower case according to any locale-specific case mappings. If multiple locales are given in an array, the best available locale is used. Setting `locale: false` ignores the platform locale and uses the [Unicode Default Case Conversion](https://unicode-org.github.io/icu/userguide/transforms/casemappings.html#simple-single-character-case-mapping) algorithm. Default: The host environment’s current locale.

```ts
import { camelCase } from 'camelCase';

camelCase('foo-bar');
//=> 'fooBar'
camelCase('foo-bar', { pascalCase: true });
//=> 'FooBar'
camelCase('foo-BAR', { preserveConsecutiveUppercase: true });
//=> 'fooBAR'
camelCase('lorem-ipsum', { locale: 'en-US' });
//=> 'loremIpsum'
camelCase('lorem-ipsum', { locale: 'tr-TR' });
//=> 'loremİpsum'
camelCase('lorem-ipsum', { locale: ['en-US', 'en-GB'] });
//=> 'loremIpsum'
camelCase('lorem-ipsum', { locale: ['tr', 'TR', 'tr-TR'] });
//=> 'loremİpsum'
```

### **`deCycle` and `retroCycle`**

The `deCycle` and `retroCycle` functions are used to manage circular references in objects. The `deCycle` function is used to remove circular references from an object, and the `retroCycle` function is used to restore circular references to an object. They have the following signatures:

- **`deCycle`**: `(object: any, replacer?: (value: any) => any): any`. The `object` parameter is the object to remove circular references from, and the `replacer` parameter is a function that replaces circular references with a placeholder. Default is `undefined`.
- **`retroCycle`**: `(obj: any): any`. The `obj` parameter is the object to restore circular references to.

```typescript
import { deCycle, retroCycle } from '@mdf.js/utils';

const obj = { a: 1 };
obj.b = obj;

const deCycled = deCycle(obj);
console.log(deCycled); // { a: 1, b: '$' }

const retroCycled = retroCycle(deCycled);
console.log(retroCycled); // { a: 1, b: [Circular] }
```

### **`formatEnv`**

The `formatEnv` function is used to read environment variables (`process.env`), filter them based on the indicated prefix, and return an object with the values sanitized and the keys formatted based on the specified options. It has the following signatures:

- **`formatEnv`**: `<T extends Record<string, any> = Record<string, any>>(): T`. Read environment variables (`process.env`) and return an object with the values sanitized and the keys formatted.
- **`formatEnv`**: `<T extends Record<string, any> = Record<string, any>>(prefix: string): T`. Read environment variables (`process.env`), filter them based on the indicated prefix, and return an object with the values sanitized and the keys formatted.
- **`formatEnv`**: `<T extends Record<string, any> = Record<string, any>>(prefix: string, options: Partial<ReadEnvOptions>): T`. Read environment variables (`process.env`), filter them based on the indicated prefix, and return an object with the values sanitized and the keys formatted based on the specified options. The `ReadEnvOptions` type is an interface with the following properties:
  - **`separator`** (`string`): The separator to use for nested keys. Default is `__`.
  - **`format`** (`'camelcase' | 'pascalcase' | 'lowercase' | 'uppercase'`): The format to use for the keys. Default is `'camelcase'`.
  - **`includePrefix`** (`boolean`): Whether to include the prefix in the keys. Default is `false`.
- **`formatEnv`**: `<T extends Record<string, any> = Record<string, any>>(prefix: string, options: Partial<ReadEnvOptions>, source: Record<string, string | undefined>): T`. Process a source, encoded as an environment variables file, filter them based on the indicated prefix, and return an object with the values sanitized and the keys formatted based on the specified options.

```typescript
import { formatEnv } from '@mdf.js/utils';

process.env['MY_OWN_TEST'] = 'test';

const env = {
  EXAMPLE_OBJECT: '{"prop": "value"}',
  EXAMPLE_ARRAY: '[1,2,3, "string", {"prop": "value"}, 5.2]',
  EXAMPLE_INVALID_OBJECT: '{"prop": }"value"}',
  EXAMPLE_INVALID_ARRAY: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
  EXAMPLE_TRUE: 'true',
  EXAMPLE_FALSE: 'false',
  EXAMPLE_INT: '5',
  EXAMPLE_NEGATIVE_INT: '-11',
  EXAMPLE_FLOAT: '5.2456',
  EXAMPLE_NEGATIVE_FLOAT: '-2.4567',
  EXAMPLE_INT_ZERO: '0',
  EXAMPLE_FLOAT_ZERO: '0.00',
  EXAMPLE_NEGATIVE_INT_ZERO: '-0',
  EXAMPLE_NEGATIVE_FLOAT_ZERO: '-0.00',
  EXAMPLE_STRING: 'example',
  EXAMPLE_DEEP__OBJECT__PROPERTY: 'value',
  EXAMPLE_NOT_SHOULD_BE_SANITIZED: 5,
};

console.log(formatEnv()); // { myOwnTest: 'test' }

console.log(
  formatEnv('EXAMPLE', { separator: '__', format: 'camelcase', includePrefix: false }, env)
);
//   {
//     object: { prop: 'value' },
//     array: [1, 2, 3, 'string', { prop: 'value' }, 5.2],
//     invalidObject: '{"prop": }"value"}',
//     invalidArray: '[1,2,3, "string", ]{"prop": "value"}, 5.2]',
//     true: true,
//     false: false,
//     int: 5,
//     negativeInt: -11,
//     float: 5.2456,
//     negativeFloat: -2.4567,
//     intZero: 0,
//     floatZero: 0,
//     negativeIntZero: -0,
//     negativeFloatZero: -0,
//     string: 'example',
//     deep: {
//       object: {
//         property: 'value',
//       },
//     },
//     notShouldBeSanitized: 5,
//  }
```

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.

```
```
