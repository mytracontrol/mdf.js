# **@mdf.js/mongo-provider**

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

<h1 style="text-align:center;margin-bottom:0">MongoDB Provider for @mdf.js/mongo-provider</h1>
<h5 style="text-align:center;margin-top:0">Mytra Development Framework - @mdf.js</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/mongo-provider**](#mdfjsmongo-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

MongoDB provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [mongodb](https://www.npmjs.com/package/mongodb).

## **Installation**

Using npm:

```bash
npm install @mdf.js/mongo-provider
```

Using yarn:

```bash
yarn add @mdf.js/mongo-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Checks the status of the MongoDB nodes using the heartbeat events from the client.
  - **observedValue**: actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`] based in the last heartbeat event. `stopped` if the provider is stopped or has not been initialized yet, `running` if the provider is running and the last heartbeat event was successful, `error` if the provider is running and the last heartbeat event was not successful.
  - **observedUnit**: `status`.
  - **status**: `fail` if the observed value is `error`, `warn` if the observed value is `stopped`, `pass` in other case.
- **heartbeat**:
  - **observedValue**: `failed` if the last heartbeat was not successful, heartbeat information if the last heartbeat was successful.
  - **observedUnit**: `heartbeat result`.
  - **status**: `fail` if the observed value is `failed`, `pass` in other case.
  - **output**: shows the connection identifier and the failure message in case of `failed` state (status `fail`). `undefined` in other case.
- **lastCommand**:
  - **observedValue**: `succeeded` if the last command executed in the provider was successful, `failed` if the last command executed in the provider failed.
  - **observedUnit**: `command result`.
  - **status**: `pass` if the observed value is `succeeded`, `fail` if the observed value is `failed`.
  - **output**: Shows the command name and the command failure message in case of `failed` state (status `fail`). `undefined` if the observed value is `succeeded`.
- **lastFailedCommands**:
  - **observedValue**: Shows the last 10 failed commands executed in the provider, each entry shows the date of the command in ISO format, the command name and the failure message.
  - **observedUnit**: `last failed commands`.
  - **status**: `pass`.
  - **output**: `undefined`.

## **Environment variables**

- **CONFIG\_MONGO\_URL** (default: `` `mongodb://127.0.0.1:27017/mdf` ``): URL for the mongo database
- **CONFIG\_MONGO\_CA\_PATH** (default: `undefined`): Path to the CA for the mongo database
- **CONFIG\_MONGO\_CERT\_PATH** (default: `undefined`): Path to the cert for the mongo database
- **CONFIG\_MONGO\_KEY\_PATH** (default: `undefined`): Path to the key for the mongo database

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
