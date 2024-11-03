# **@mdf.js/service-setup-provider**

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

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/service-setup-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/service-setup-provider**](#mdfjsservice-setup-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
    - [**What does this module want to solve?**](#what-does-this-module-want-to-solve)
    - [**Features**](#features)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
    - [**Create a new instance**](#create-a-new-instance)
    - [**Using the instance**](#using-the-instance)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

**@mdf.js/service-setup-provider** is a versatile tool designed for handling, validating, and managing different sources of configuration information in Node.js applications. It provides robust support for environment-specific configurations, presets, and schema validation, making it an essential utility for projects that require dynamic configuration management. It supports configurations in JSON, YAML, TOML, and .env file formats and environment variables, allowing developers to define and manage configurations in a structured and consistent manner.

### **What does this module want to solve?**

This module is designed and developed to facilitate the deployment of applications that operate in container environments where the same application is deployed in different contexts, such as development, testing, production, installation type A, installation type B, etc. This is the case for applications that are deployed in container environments, like Kubernetes, Docker, etc., especially in Edge Computing environments, where the application is deployed in different geographical locations, with different network configurations, hardware, etc.

In each context, the application needs to be configured differently, with configuration errors being common, especially in applications where fine-tuning of operation is achieved through a large number of configuration variables.

In these environments, it would be ideal to have a series of predefined configurations that fit each context, so that in the application deployment process, one only needs to choose the context (the predefined configuration) they wish to use, without the need for manual adjustments in the configuration variables.

At the same time, it must be possible, especially for the configuration of secrets, to have the ability to adjust environment variables that are loaded into the container at the time of execution, so that the configuration of secrets is not found in the application's source code or in configuration files, but the final result is the union of both configurations.

### **Features**

- Load and merge configuration files from various formats (JSON, YAML, TOML, .env), allowing a hierarchical configuration structure, merging configurations from different sources.
- Load environment variables and merge with the rest of the configuration sources, handling environment-specific configurations with ease.
- Validate configurations against a defined schema, using JSON Schema files.
- Built-in [express.js](https://expressjs.com/) router for exposing configuration details over HTTP.

## **Installation**

Using npm:

```bash
npm install @mdf.js/service-setup-provider
```

Using yarn:

```bash
yarn add @mdf.js/service-setup-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

### **Create a new instance**

This module is developed as a **@mdf.js** `Provider` so that it can be used easily in any application, both in the **@mdf.js** environment and in any other Node.js application.

In order to use this module, your should use the `Factory` exposed and create an instance using the `create` method:

```typescript
import { Factory } from '@mdf.js/service-setup-provider';

const default = Factory.create(); // Create a new instance with default options

const custom = Factory.create({
  config: {...} // Custom options
  name: 'custom' // Custom name
  useEnvironment: true // Use environment variables
  logger: myLoggerInstance // Custom logger
});
```

The configuration options (`config`) are the following:

- `configFiles`: List of configuration files to be loaded. The entries could be a file path or glob pattern. All the files will be loaded and merged in the order they are founded. The result of the merge will be used as the final configuration.

  Some examples:

  ```typescript
  ['./config/*.json']
  ['./config/*.json', './config/*.yaml']
  ['./config/*.json', './config/*.yaml', './config/*.yml']
  ```

- `presetFiles`: List of files with preset options to be loaded. The entries could be a file path or glob pattern. The first part of the file name will be used as the preset name. The file name should be in the format of `presetName.config.json` or `presetName.config.yaml`. The name of the preset will be used to merge different files in order to create a single preset.

  Some examples:

  ```typescript
  ['./config/presets/*.json']
  ['./config/presets/*.json', './config/presets/*.yaml']
  ['./config/presets/*.json', './config/presets/*.yaml', './config/presets/*.yml']
  ```

- `envPrefix`: Prefix or prefixes to use on configuration loading from the environment variables. The prefix will be used to filter the environment variables. The prefix will be removed from the environment variable name and the remaining part will be used as the configuration property name. The configuration property name will be converted to camel case. Environment variables will override the configuration from the configuration files.

  Some examples:

  ```typescript
  `MY_APP_` // as single prefix
  ['MY_APP_', 'MY_OTHER_APP_'] // as array of prefixes
  { MY_APP: 'myApp', MY_OTHER_APP: 'myOtherApp' } // as object with prefixes
  ```

> **Note**: is important not misunderstand the `envPrefix` option and `useEnvironment` option of the Factory.
>
> - `envPrefix`: this option is used to filter the environment variables that will be used to override the configuration from the configuration files. The `envPrefix` will affect only to the result of the final configuration object that this module is going to create.
> - `useEnvironment`: this option of the `create` method will be used to indicate if the environment variables will be used, or not, to override the configuration of this module.

- `schemaFiles`: List of files with JSON schemas used to validate the configuration. The entries could be a file path or glob pattern.

In this point we have:

- A `config` object as result of the merge of the configuration files.
- A collection of `presets` objects as result of the merge of the preset files.
- A `environment` object as result of parse the environment variables based on the `envPrefix` option.
- A collection of `schemas` objects as result of the schema files.

What we have to configure now is if we want to use a `preset` file and which one and if we want to validate the result based in a JSON schema. For this we have the following options:

- `preset`: Preset to be used as configuration base, if none is indicated, or the indicated preset is not found, the configuration from the configuration files will be used.
- `schema`: Schema to be used to validate the configuration. If none is indicated, the configuration will not be validated. The schema name should be the same as the file name without the extension.
- `checker`: DoorKeeper instance to be used to validate the configuration. If none is indicated, the setup instance will be try to create a new DoorKeeper instance using the schema files indicated in the options. If the schema files are not indicated, the configuration will not be validated.
- `base`: Object to be used as base and main configuration options. The configuration will be merged with the configuration from the configuration files. This object will override the configuration from the configuration files and the environment variables. The main reason of this option is to allow the user to define some configuration in the code and let the rest of the configuration to be loaded, using the Configuration Manager as unique source of configuration.
- `default`: Object to be used as default configuration options. The configuration will be merged with the configuration from the configuration files, the environment variables and the base option. This object will be used as the default configuration if no other configuration is found.

The `preset` option is used to indicate which preset will be used as the base configuration. The preset name should be the same as the file name without the extension. The preset will be merged with the configuration from the configuration files and the environment variables. The preset will override the configuration from the configuration files and the environment variables will override the preset.

### **Using the instance**

Once the instance is created, you can access to the `ConfigManager` instance using the `client` property of the `Provider`. The `ConfigManager` instance has the following methods and properties:

- **Properties**:
  - `defaultConfig`: configuration object with the result of the merge of the configuration files.
  - `envConfig`: configuration object with the result of the merge the environment variables.
  - `presets`: Collection of presets objects with the result of the merge of the preset files.
  - `preset`: selected present.
  - `schema`: selected schema.
  - `nonDisclosureConfig`: configuration object with the result of the merge of the configuration files, the preset WITHOUT the environment variables. In environments variables is where we should store the secrets.
  - `config`: Configuration object with the result of the merge of the configuration files, the preset and the environment variables.
  - `isErrored`: boolean that indicates if the configuration is valid or not.
  - `error`: a Multi instance with the errors found in the configuration validation if the configuration is not valid.

## **Environment variables**

- **CONFIG\_SERVICE\_SETUP\_PRESET\_FILES** (default: `'./config/presets/*.*'`): List of files with preset options to be loaded. The entries could be a file path or glob pattern. The first part of the file name will be used as the preset name. The file name should be in the format of \`presetName.config.json\` or \`presetName.config.yaml\`. The name of the preset will be used to merge different files in order to create a single preset.
- **CONFIG\_SERVICE\_SETUP\_SCHEMA\_FILES** (default: `'./config/schemas/*.*'`): List of files with JSON schemas used to validate the configuration. The entries could be a file path or glob pattern.
- **CONFIG\_SERVICE\_SETUP\_CONFIG\_FILES** (default: `'./config/*.*'`): List of configuration files to be loaded. The entries could be a file path or glob pattern. All the files will be loaded and merged in the order they are founded. The result of the merge will be used as the final configuration.
- **CONFIG\_SERVICE\_SETUP\_PRESET** (default: `undefined`): Preset to be used as configuration base, if none is indicated, or the indicated preset is not found, the configuration from the configuration files will be used.
- **CONFIG\_SERVICE\_SETUP\_SCHEMA** (default: `undefined`): Schema to be used to validate the configuration. If none is indicated, the configuration will not be validated. The schema name should be the same as the file name without the extension.
- **CONFIG\_SERVICE\_SETUP\_ENV\_PREFIX** (default: `undefined`): Prefix or prefixes to use on configuration loading from the environment variables. The prefix will be used to filter the environment variables. The prefix will be removed from the environment variable name and the remaining part will be used as the configuration property name. The configuration property name will be converted to camel case. Environment variables will override the configuration from the configuration files.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
