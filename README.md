# **@mdf.js**

[![Node Version](https://img.shields.io/static/v1?style=flat&logo=node.js&logoColor=green&label=node&message=%3E=20&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat&logo=typescript&label=Typescript&message=5.0&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat&logo=snyk&label=Vulnerabilities&message=0&color=300A98F)](https://snyk.io/package/npm/snyk)
[![Build Status](https://devopmytra.visualstudio.com/MytraManagementSystem/_apis/build/status%2FMytra%20Development%20Framework%20-%20mds.js?branchName=master)](https://devopmytra.visualstudio.com/MytraManagementSystem/_build/latest?definitionId=429&branchName=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmytracontrol%2Fmdf.js%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/mytracontrol/mdf.js/master)

<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js </h1>
<h5 style="text-align:center;margin-top:0">Typescript framework for core application development</h5>
<!-- markdownlint-enable MD033 -->

___

## **Table of contents**

- [**@mdf.js**](#mdfjs)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**License**](#license)

## **Introduction**

Mytra Development Framework is a set of tools for development TypeScript projects. It is based on the [**@mdf.js**](https://www.npmjs.com/org/mdf.js) organization and is composed of several packages that can be used independently but that are designed to work together. The main idea of the framework is to integrate the most common tools and packages used in the development of TypeScript projects, usually wrapping them in a simpler interface and adding some extra functionality. For example the providers offered by this framework wrap the most common packages for managing connections to different services, such as [**rhea-promise**](https://www.npmjs.com/package/rhea-promise) for AMQP connections, [**@elastic/elasticsearch**](https://www.npmjs.com/package/@elastic/elasticsearch) for Elastic, ... and offer an unified interface to create, manage and diagnose them. These interfaces are integrated with the observability component, so when an error occurs in one of the providers, the error is registered in the observability interface.

## **Installation**

Each module can be installed separately, for example:

NPM:

```bash
npm install @mdf.js/crash
```

Yarn:

```bash
yarn add @mdf.js/crash
```

## **Information**

The complete framework is composed of the following packages:

- API modules:
  - [**@mdf.js/core**](https://www.npmjs.com/package/@mdf.js/core): Package for internal interfaces and classes used by the rest of the packages.
  - [**@mdf.js/crash**](https://www.npmjs.com/package/@mdf.js/crash): Package for improving the error handling of the applications.
  - [**@mdf.js/doorkeeper**](https://www.npmjs.com/package/@mdf.js/doorkeeper): Package for managing the validation of json schemas, based on [**ajv**](https://ajv.js.org).
  - [**@mdf.js/faker**](https://www.npmjs.com/package/@mdf.js/faker): Package for generating fake data for testing.
  - [**@mdf.js/firehose**](https://www.npmjs.com/package/@mdf.js/firehose): Package for data ETL pipelines creation and management. Works together with the providers.
  - [**@mdf.js/file-flinger**](https://wwww.npmjs.com/package/@mdf.js/file-flinger): Package for managing file processing and uploading.
  - [**@mdf.js/logger**](https://www.npmjs.com/package/@mdf.js/logger): Package for logging management.
  - [**@mdf.js/middlewares**](https://www.npmjs.com/package/@mdf.js/middlewares): Package with a set of middlewares for express applications.
  - [**@mdf.js/openc2-core**](https://www.npmjs.com/package/@mdf.js/openc2-core): Package for managing the OpenC2 protocol, internally used by [**@mdf.js/openc2**](https://www.npmjs.com/package/@mdf.js/openc2).
  - [**@mdf.js/tasks**](https://www.npmjs.com/package/@mdf.js/tasks): Package for managing tasks execution: tasks limiter and tasks scheduler.
  - [**@mdf.js/utils**](https://www.npmjs.com/package/@mdf.js/utils): Package with a set of utilities for development:
    - coerce: Functions for data type coercion, specially useful for environment variables and configuration files.
    - retry: Functions for retrying functions.
    - camelCase: Functions for converting strings to camelCase.
    - cycle: Functions for managing circular references in objects.
    - escapeRegExp: Functions for escaping RegExp.
    - findNodeModule: Functions for finding node modules.
    - formatEnv: Functions for formatting environment variables.
    - loadFile: Functions for loading files.
    - mock: Functions for mocking objects, specially useful for testing in Jest.
    - prettyMS: Functions for formatting milliseconds.
- Providers:
  - [**@mdf.js/amqp-provider**](https://www.npmjs.com/package/@mdf.js/amqp-provider): Package for managing AMQP connections, based on [**rhea-promise**](https://www.npmjs.com/package/rhea-promise).
  - [**@mdf.js/elastic-provider**](https://www.npmjs.com/package/@mdf.js/elastic-provider): Package for managing Elastic connections, based on [**@elastic/elasticsearch**](https://www.npmjs.com/package/@elastic/elasticsearch).
  - [**@mdf.js/http-client-provider**](https://www.npmjs.com/package/@mdf.js/http-client-provider): Package for managing HTTP connections, based on [**axios**](https://www.npmjs.com/package/axios).
  - [**@mdf.js/http-server-provider**](https://www.npmjs.com/package/@mdf.js/http-server-provider): Package for managing HTTP servers, based on [**express**](https://www.npmjs.com/package/express).
  - [**@mdf.js/jsonl-archiver**](https://www.npmjs.com/package/@mdf.js/jsonl-archiver): Package for managing JSONL archiving.
  - [**@mdf.js/kafka-provider**](https://www.npmjs.com/package/@mdf.js/kafka-provider): Package for managing Kafka connections, based on [**kafkajs**](https://www.npmjs.com/package/kafkajs).
  - [**@mdf.js/mongo-provider**](https://www.npmjs.com/package/@mdf.js/mongo-provider): Package for managing Mongo connections, based on [**mongodb**](https://www.npmjs.com/package/mongodb).
  - [**@mdf.js/redis-provider**](https://www.npmjs.com/package/@mdf.js/redis-provider): Package for managing Redis connections, based on [**ioredis**](https://www.npmjs.com/package/ioredis).
  - [**@mdf.js/s3-provider**](https://www.npmjs.com/package/@mdf.js/s3-provider): Package for managing S3 connections, based on [**aws-sdk/client-s3**](https://www.npmjs.com/package/@aws-sdk/client-s3).
  - [**@mdf.js/service-setup**](https://www.npmjs.com/package/@mdf.js/service-setup): Package for managing the setup of the services in edge environments.
  - [**@mdf.js/socket-client-provider**](https://www.npmjs.com/package/@mdf.js/socket-client-provider): Package for managing **socket.io** connections, based on [**socket.io**](https://www.npmjs.com/package/socket.io)
  - [**@mdf.js/socket-server-provider**](https://www.npmjs.com/package/@mdf.js/socket-server-provider): Package for managing **socket.io** servers, based on [**socket.io**](https://www.npmjs.com/package/socket.io)
- Components:
  - [**@mdf.js/openc2**](https://www.npmjs.com/package/@mdf.js/openc2): Package for managing the OpenC2 protocol.
  - [**@mdf.js/service-registry**](https://www.npmjs.com/package/@mdf.js/service-registry): Package for managing the observability of the services.

## **Use**

Check the documentation of each package for more information.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at https://opensource.org/licenses/MIT.
