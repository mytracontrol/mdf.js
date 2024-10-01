# **@mdf.js/jsonl-file-store-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/jsonl-file-store-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/jsonl-file-store-provider**](#mdfjsjsonl-file-store-provider)
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

**@mdf.js/jsonl-file-store-provider** is a tool designed for managing the storage of jsonl files in Node.js applications`. It allows to append data to mmultiple files, maintaining the append and rotation processes independent for each file.

### **What does this module want to solve?**

This module is designed and developed to facilitate the storage of jsonl files, integrating error handling for metrics and files statistics information.

### **Features**

- Append data to files (as per jsonl format, each line is a json string)
- File rotation handling, autmatically performed by timeout

## **Installation**

Using npm:

```bash
npm install @mdf.js/jsonl-file-store-provider
```

Using yarn:

```bash
yarn add @mdf.js/jsonl-file-store-provider
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
  {
    openFilesFolderPath: './data/open',
    closedFilesFolderPath: './data/closed',
    fileEncoding: 'utf-8',
    createFolders: true,
    rotationInterval: 600000 /* 10 minutes */,
    failOnStartSetup: true,
    appendRetryOptions: {
      timeout: 5000; /* 5 seconds */
      attempts: 3,
    },
    rotationRetryOptions: {
      timeout: 5000; /* 5 seconds */
      attempts: 3,
    },
  }
  ```

- **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

  ```typescript
  { 
    openFilesFolderPath: process.env['CONFIG_OPEN_FILES_FOLDER_PATH'],
    closedFilesFolderPath: process.env['CONFIG_CLOSED_FILES_FOLDER_PATH'],
    fileEncoding: process.env['CONFIG_FILE_ENCODING'],
    createFolders: process.env['CONFIG_CREATE_FOLDERS'],  /* boolean */
    rotationInterval: process.env['CONFIG_ROTATION_INTERVAL'],  /* number */
    failOnStartSetup: process.env['CONFIG_FAIL_ON_START_SETUP'],  /* boolean */
    appendRetryOptions: {
      timeout: process.env['CONFIG_APPEND_RETRY_OPTIONS_TIMEOUT'],  /* number */
      attempts: process.env['CONFIG_APPEND_RETRY_OPTIONS_ATTEMPTS'],  /* number */
    },
    rotationRetryOptions: {
      timeout: process.env['CONFIG_ROTATION_RETRY_OPTIONS_TIMEOUT'],  /* number */
      attempts: process.env['CONFIG_ROTATION_RETRY_OPTIONS_ATTEMPTS'],  /* number */
    },
  }
  ```

## **Environment variables**

- **CONFIG\_OPEN\_FILES\_FOLDER\_PATH** (default: `./data/open`): The folder path where open files are stored, i.e., the folder for the file that is being written currently.
- **CONFIG\_CLOSED\_FILES\_FOLDER\_PATH** (default: `./data/closed`): The directory path where closed files will be stored, i.e., the to which files are moved when the timeout is reached. Then, a new file is created to start writting in it in the open files folder.
-  **CONFIG\_FILE\_ENCODING** (default: `utf-8`): The encoding for writting (appending) data to files.
- **CONFIG\_CREATE\_FOLDERS** (default: `true`): It indicates whether to create open and closed files folders if they do not exist.
- **CONFIG\_ROTATION\_OPTIONS\_INTERVAL** (default: `600000`): The interval (in milliseconds) at which the file rotation should occur.
- **CONFIG\_FAIL\_ON\_START\_SETUP** (default: `true`): It indicates if the provider should fail in case any error occurs on start setup. For example, if this variable is `true`, and `CONFIG\_CREATE\_FOLDERS` is `false` when the folders does not previously exist, the provider will throw an error on start.
- **CONFIG\_APPEND\_RETRY\_OPTIONS\_TIMEOUT** (default: `5000`): Maximum time, in milliseconds, for an append operation to complete (the first attempt as well as retries).
- **CONFIG\_APPEND\_RETRY\_OPTIONS\_ATTEMPTS** (default: `3`): Maximum number of attempts for an append operation, including the first execution before retries.
- **CONFIG\_ROTATION\_RETRY\_OPTIONS\_TIMEOUT** (default: `5000`): Maximum time, in milliseconds, for an rotation operation to complete (the first attempt as well as retries).
- **CONFIG\_ROTATION\_RETRY\_OPTIONS\_ATTEMPTS** (default: `3`): Maximum number of attempts for a rotate operation, including the first execution before retries.


## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
