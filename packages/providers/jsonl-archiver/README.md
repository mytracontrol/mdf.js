# **@mdf.js/jsonl-archiver-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/jsonl-archiver-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/jsonl-archiver-provider**](#mdfjsjsonl-archiver-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
    - [**What does this module want to solve?**](#what-does-this-module-want-to-solve)
    - [**Features**](#features)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
    - [**Create a new instance**](#create-a-new-instance)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

**@mdf.js/jsonl-archiver-provider** is a tool designed for managing the storage of jsonl files in Node.js applications. It allows to append data to multiple files, maintaining the append and rotation processes independent for each file.

### **What does this module want to solve?**

Abstract the management of jsonl files in Node.js applications, providing a simple and efficient way to store data in a jsonl format. This module is designed to be used in the **@mdf.js** environment, but it can be used in any Node.js application. Some examples of use cases are:

- Store logs in a jsonl format
- Store data in a jsonl format

### **Features**

- Append data to files (as per jsonl format, each line is a json string), with:
  - Automatic file rotation by size, lines or time, moving the file to an archive folder.
  - Automatic destination file selection by json properties.
  - Automatic skip data to be appended by json properties.

## **Installation**

Using npm:

```bash
npm install @mdf.js/jsonl-archive-provider
```

Using yarn:

```bash
yarn add @mdf.js/jsonl-archive-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

### **Create a new instance**

This module is developed as a **@mdf.js** `Provider` so that it can be used easily in any application, both in the **@mdf.js** environment and in any other Node.js application.

In order to use this module, your should use the `Factory` exposed and create an instance using the `create` method:

```typescript
import { Factory } from '@mdf.js/jsonl-file-store-provider';

const default = Factory.create(); // Create a new instance with default options

const custom = Factory.create({
  config: {...} // Custom options
  name: 'custom' // Custom name
  useEnvironment: true // Use environment variables
  logger: myLoggerInstance // Custom logger
});
```

The configuration options (`config`) are the following:

- **Defaults**:

  ```typescript
  export interface ArchiveOptions {
    separator?: string;
    propertyData?: string;
    propertyFileName?: string;
    propertySkip?: string;
    propertySkipValue?: string | number | boolean;
    defaultBaseFilename?: string;
    workingFolderPath: string;
    archiveFolderPath: string;
    createFolders: boolean;
    inactiveTimeout?: number;
    fileEncoding: BufferEncoding;
    rotationInterval?: number;
    rotationSize?: number;
    rotationLines?: number;
    retryOptions?: RetryOptions;
    logger?: LoggerInstance;
  }
  ```

  Where each property has the next meaning:

  - **separator** (default: `\n`): Separator to use when writing the data to the file.
  - **propertyData** (default: `undefined`): If set, this property will be used to store the data in the file, it could be a nested property in the data object expressed as a dot separated string.
  - **propertyFileName** (default: `undefined`): If set, this property will be used as the filename, it could be a nested property in the data object expressed as a dot separated string.
  - **propertySkip** (default: `undefined`): If set, this property will be used to skip the data, it could be a nested property in the data object expressed as a dot separated string.
  - **propertySkipValue** (default: `undefined`): If set, this value will be used to skip the data, it could be a string, number or boolean. If value is not set, but `propertySkip` is set, a not falsy value will be used to skip the data, this means that any value that is not `false`, `0` or `''` will be used to skip the data.
  - **defaultBaseFilename** (default: `'file'`): Base filename for the files.
  - **workingFolderPath** (default: `'./data/working'`): Path to the folder where the working files are stored.
  - **archiveFolderPath** (default: `'./data/archive'`): Path to the folder where the closed files are stored.
  - **createFolders** (default: `true`): If true, it will create the folders if they don't exist.
  - **inactiveTimeout** (default: `undefined`): Maximum inactivity time in milliseconds before a handler is cleaned up.
  - **fileEncoding** (default: `'utf-8'`): Encoding to use when writing to files.
  - **rotationInterval** (default: `600000`): Interval in milliseconds to rotate the file.
  - **rotationSize** (default: `10485760`): Max size of the file before rotating it.
  - **rotationLines** (default: `10000`): Max number of lines before rotating the file.
  - **retryOptions** (default: `{ attempts: 3, timeout: 1000, waitTime: 1000, maxWaitTime: 10000 }`): Retry options for the file handler operations. Check the [**@mdf.js/utils**](https://mytracontrol.github.io/mdf.js/interfaces/_mdf_js_utils.RetryOptions.html) module for more information.
  - **logger** (default: `undefined`): Logger instance to use. Check the [**@mdf.js/logger**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_logger.html) module for more information.

- **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

  ```typescript
  { 
    workingFolderPath: process.env['CONFIG_JSONL_ARCHIVER_WORKING_FOLDER_PATH'],
    archiveFolderPath: process.env['CONFIG_JSONL_ARCHIVER_ARCHIVE_FOLDER_PATH'],
    fileEncoding: process.env['CONFIG_JSONL_ARCHIVER_FILE_ENCODING'],
    createFolders: process.env['CONFIG_JSONL_ARCHIVER_CREATE_FOLDERS'],  /* boolean */
    rotationInterval: process.env['CONFIG_JSONL_ARCHIVER_ROTATION_INTERVAL'],  /* number */
    rotationSize: process.env['CONFIG_JSONL_ARCHIVER_ROTATION_SIZE'],  /* number */
    rotationLines: process.env['CONFIG_JSONL_ARCHIVER_ROTATION_LINES'],  /* number */
  }
  ```

## **Environment variables**

- **CONFIG\_JSONL\_ARCHIVER\_WORKING\_FOLDER\_PATH** (default: `'./data/working'`): Path to the folder where the open files are stored
- **CONFIG\_JSONL\_ARCHIVER\_ARCHIVE\_FOLDER\_PATH** (default: `'./data/archive'`): Path to the folder where the closed files are stored
- **CONFIG\_JSONL\_ARCHIVER\_FILE\_ENCODING** (default: `'utf-8'`): File encoding
- **CONFIG\_JSONL\_ARCHIVER\_CREATE\_FOLDERS** (default: `true`): Create folders if they do not exist
- **CONFIG\_JSONL\_ARCHIVER\_ROTATION\_INTERVAL** (default: `600000`): Interval in milliseconds to rotate the file
- **CONFIG\_JSONL\_ARCHIVER\_ROTATION\_SIZE** (default: `10485760`): Max size of the file before rotating it
- **CONFIG\_JSONL\_ARCHIVER\_ROTATION\_LINES** (default: `10000`): Max number of lines before rotating the file

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
