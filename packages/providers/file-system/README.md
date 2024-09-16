# **@mdf.js/file-system-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/file-system-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/file-system-provider**](#mdfjsfile-system-provider)
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

**@mdf.js/file-system-provider** is a tool designed for managing different file system operation (read, append to, copy, moves, and delete files) in Node.js applications.

### **What does this module want to solve?**

This module is designed and developed to facilitate the file system operations, integrating error handling for metrics and state information.

### **Features**

- Read files.
- Append data to files.
- Copy files.
- Delete files.
- Move files.

## **Installation**

Using npm:

```bash
npm install @mdf.js/file-system-provider
```

Using yarn:

```bash
yarn add @mdf.js/file-system-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

### **Create a new instance**

This module is developed as a **@mdf.js** `Provider` so that it can be used easily in any application, both in the **@mdf.js** environment and in any other Node.js application.

In order to use this module, your should use the `Factory` exposed and create an instance using the `create` method:

```typescript
import { Factory } from '@mdf.js/file-system-provider';

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
    
    readOptions: {
      encoding: 'utf-8',
      flag: 'r',
    },
    writeOptions: {
      encoding: 'utf-8',
      mode: 0o666 (readable and writable)
      flag: 'a',
      flush: false
    },
    copyOptions: {
      mode: fs.constants.COPYFILE_EXCL
    }
  }
  ```
For more details about options, see https://nodejs.org/api/fs.html

- **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

  ```typescript
  {  
    readOptions: {
      encoding: process.env['CONFIG_READ_OPTIONS_ENCODING'],
      flag: process.env['CONFIG_READ_OPTIONS_FLAG'],
    },
    writeOptions: {
      encoding: process.env['CONFIG_WRITE_OPTIONS_ENCODING'],
      mode: process.env['CONFIG_WRITE_OPTIONS_MODE'],
      flag: process.env['CONFIG_WRITE_OPTIONS_FLAG'],
      flush: process.env['CONFIG_WRITE_OPTIONS_FLUSH'],
    },
    copyOptions: {
      mode: process.env['CONFIG_COPY_OPTIONS_MODE'],
    }
  }
  ```

## **Environment variables**

- **CONFIG\_READ\_OPTIONS\_ENCODING** (default: `utf-8`): The encoding for reading files.
- **CONFIG\_READ\_OPTIONS\_FLAG** (default: `r`): The flag for reading files. 
-  **CONFIG\_WRITE\_OPTIONS\_ENCODING** (default: `utf-8`): The encoding for writting files, including, appending data to them.
-  **CONFIG\_WRITE\_OPTIONS\_MODE** (default: `0o666`): The mode for reading files.
-  **CONFIG\_WRITE\_OPTIONS\_FLAG** (default: `a`): The flag for reading files. 
-  **CONFIG\_WRITE\_OPTIONS\_FLUSH** (default: `false`): Whether to flush the underlaying descriptor of a file before clising it or not.
-  **CONFIG_COPY_OPTIONS_MODE** (default: `fs.constants.COPYFILE_EXCL = 1`): The mode for reading files.

For possible values, check the following documentation:
-  [**fs readFileSync**](https://nodejs.org/api/fs.html#fsreadfilesyncpath-options)
-  [**fs appendFileSync**](https://nodejs.org/api/fs.html#fsappendfilesyncpath-data-options)
-  [**fs copyFileSync**](https://nodejs.org/api/fs.html#fscopyfilesyncsrc-dest-mode)

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
