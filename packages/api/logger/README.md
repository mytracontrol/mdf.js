# **@mdf.js/logger**

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

<h1 style="text-align:center;margin-bottom:0">@mdf.js/logger</h1>
<h5 style="text-align:center;margin-top:0">Improved logger management for @mdf.js framework</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/logger**](#mdfjslogger)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
    - [**Features**](#features)
  - [**Usage**](#usage)
    - [**Creating a Logger Instance**](#creating-a-logger-instance)
    - [**Logging Methods and Signatures**](#logging-methods-and-signatures)
      - [**Function Parameters**](#function-parameters)
      - [**Examples**](#examples)
    - [**Contextual Logging**](#contextual-logging)
    - [**Logging Errors and Crashes**](#logging-errors-and-crashes)
    - [**Configuring the Logger**](#configuring-the-logger)
    - [**Logger Configuration Interface**](#logger-configuration-interface)
      - [**Console Transport Configuration**](#console-transport-configuration)
      - [**File Transport Configuration**](#file-transport-configuration)
      - [**Fluentd Transport Configuration**](#fluentd-transport-configuration)
    - [**Log Levels**](#log-levels)
    - [**Error Handling in Configuration**](#error-handling-in-configuration)
    - [**Checking Logger State**](#checking-logger-state)
  - [**License**](#license)

## **Introduction**

`@mdf.js/logger` is a powerful and flexible logging module designed for the `@mdf.js` framework. It provides enhanced logging capabilities with support for multiple logging levels and transports, including console, file, and Fluentd. This module allows developers to easily integrate robust logging into their applications, enabling better debugging, monitoring, and error tracking.

![Logger](./media/logging-capture.png)

## **Installation**

Install the `@mdf.js/logger` module via npm:

- **npm**

```bash
npm install @mdf.js/logger
```

- **yarn**

```bash
yarn add @mdf.js/logger
```

## **Information**

### **Features**

- **Multiple Log Levels**: Supports standard log levels (`silly`, `debug`, `verbose`, `info`, `warn`, `error`) for granular control over logging output.
- **Customizable Transports**: Supports logging to console, files, and Fluentd.
- **Flexible Configuration**: Easily configure logging options to suit your application's needs.
- **Contextual Logging**: Support for context and unique identifiers (UUID) to trace logs across different parts of your application.
- **Error Handling**: Ability to log errors and crashes with detailed stack traces and metadata.
- **Integration with @mdf.js Framework**: Seamless integration with other `@mdf.js` modules.

## **Usage**

### **Creating a Logger Instance**

To use `@mdf.js/logger` in your project, import the module and create a new logger instance:

```typescript
import { Logger } from '@mdf.js/logger';

const logger = new Logger('my-app');
```

This creates a new logger with default settings for your application labeled `'my-app'`.

### **Logging Methods and Signatures**

The logger instance provides methods for logging at different levels:

- `silly(message: string, uuid?: string, context?: string, ...meta: any[]): void;`
- `debug(message: string, uuid?: string, context?: string, ...meta: any[]): void;`
- `verbose(message: string, uuid?: string, context?: string, ...meta: any[]): void;`
- `info(message: string, uuid?: string, context?: string, ...meta: any[]): void;`
- `warn(message: string, uuid?: string, context?: string, ...meta: any[]): void;`
- `error(message: string, uuid?: string, context?: string, ...meta: any[]): void;`
- `crash(error: Crash | Boom | Multi, context?: string): void;`

#### **Function Parameters**

- **message**: A human-readable string message to log.
- **uuid** *(optional)*: A unique identifier (UUID) for tracing the log message across different components or requests.
- **context** *(optional)*: The context (e.g., class or function name) where the logger is logging.
- **...meta** *(optional)*: Additional metadata or objects to include in the log.

#### **Examples**

Logging an info message without UUID and context:

```typescript
logger.info('Application started');
```

Logging an error message with UUID and context:

```typescript
const uuid = '02ef7b85-b88e-4134-b611-4056820cd689';
const context = 'UserService';

logger.error('User not found', uuid, context, { userId: 'user123' });
```

### **Contextual Logging**

To simplify logging with a fixed context and UUID, you can create a wrapped logger using the `SetContext` function:

```typescript
import { SetContext } from '@mdf.js/logger';

const wrappedLogger = SetContext(logger, 'AuthService', '123e4567-e89b-12d3-a456-426614174000');

wrappedLogger.info('User login successful', undefined, undefined, { userId: 'user123' });
```

In this case, the `uuid` and `context` parameters are pre-set, and you can omit them in subsequent log calls.

### **Logging Errors and Crashes**

To log errors or crashes with detailed stack traces and metadata, use the `crash` method:

```typescript
import { Crash } from '@mdf.js/crash';

try {
  // Code that may throw an error
} catch (error) {
  const crashError = Crash.from(error);
  logger.crash(crashError, 'AuthService');
}
```

The `crash` method logs the error at the `error` level, including the stack trace and additional information.

### **Configuring the Logger**

You can customize the logger by passing a configuration object:

```typescript
import { Logger, LoggerConfig } from '@mdf.js/logger';

const config: LoggerConfig = {
  console: {
    enabled: true,
    level: 'debug',
  },
  file: {
    enabled: true,
    filename: 'logs/my-app.log',
    level: 'info',
    maxFiles: 5,
    maxsize: 10485760, // 10 MB
    zippedArchive: true,
  },
  fluentd: {
    enabled: false,
    // Additional Fluentd configurations for fluent-logger module
  },
};

const logger = new Logger('my-app', config);
```

````

### **Using DebugLogger**

If you prefer using the `debug` module, utilize the `DebugLogger` class:

```typescript
import { DebugLogger } from '@mdf.js/logger';

const debugLogger = new DebugLogger('my-app');

debugLogger.debug('This is a debug message using DebugLogger');
````

### **Logger Configuration Interface**

The `LoggerConfig` interface allows you to configure different transports:

```typescript
interface LoggerConfig {
  console?: ConsoleTransportConfig;
  file?: FileTransportConfig;
  fluentd?: FluentdTransportConfig;
}
```

#### **Console Transport Configuration**

```typescript
interface ConsoleTransportConfig {
  enabled?: boolean; // Default: false
  level?: LogLevel; // Default: 'info'
}
```

#### **File Transport Configuration**

```typescript
interface FileTransportConfig {
  enabled?: boolean; // Default: false
  level?: LogLevel; // Default: 'info'
  filename?: string; // Default: 'logs/mdf-app.log'
  maxFiles?: number; // Default: 10
  maxsize?: number; // Default: 10485760 (10 MB)
  zippedArchive?: boolean; // Default: false
  json?: boolean; // Default: false
}
```

#### **Fluentd Transport Configuration**

```typescript
type FluentdTransportConfig = {
  enabled?: boolean; // Default: false
  level?: LogLevel; // Default: 'info'
  // Additional Fluentd-specific options here
};
```

### **Log Levels**

Available log levels are defined by the `LogLevel` type:

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
```

### **Error Handling in Configuration**

The logger handles configuration errors gracefully. If there's an error in the provided configuration, the logger defaults to predefined settings and logs the configuration error:

```typescript
const invalidConfig: LoggerConfig = {
  console: {
    enabled: true,
    level: 'invalid-level' as LogLevel, // This will cause a validation error
  },
};

const logger = new Logger('my-app', invalidConfig);

// The logger will use default settings and log the configuration error
```

### **Checking Logger State**

You can check if the logger has encountered any configuration errors:

```typescript
if (logger.hasError) {
  console.error('Logger configuration error:', logger.configError);
}
```

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
