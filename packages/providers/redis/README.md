# **@mdf.js/redis-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/redis-provider</h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/redis-provider**](#mdfjsredis-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**License**](#license)

## **Introduction**

Redis provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [ioredis](https://www.npmjs.com/package/ioredis).

## **Installation**

Using npm:

```bash
npm install @mdf.js/redis-provider
```

Using yarn:

```bash
yarn add @mdf.js/redis-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Checks the ping messages from the server.
  - **observedValue**: actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`] based in the last ping event. `stopped` if the provider is stopped or has not been initialized yet, `running` if the provider is running and the last ping event was successful, `error` if the provider is running and the last ping event was not successful.
  - **status**: `pass` if the status is `running`, `warn` if the status is `stopped`, `fail` if the status is `error`.
- **memory**:
  - **observedValue**: actual memory usage of the provider instance. The values are in expressed in bytes: `used memory` / `max memory`.
  - **observedUnit**: `used memory / max memory`.
  - **status**: `fail` if there is a problem getting the memory usage, or if the memory usage is greater or equal than 100% of the maximum memory, `warn` if the memory usage is greater than 80% of the maximum memory, `pass` in other case.

## **Environment variables**

- **CONFIG\_REDIS\_HOST**: Default REDIS connection host
- **CONFIG\_REDIS\_PORT**: Default REDIS connection port
- **CONFIG\_REDIS\_DB**: Default REDIS connection database
- **CONFIG\_REDIS\_PASSWORD**: Default REDIS connection password
- **CONFIG\_REDIS\_RETRY\_DELAY\_FACTOR**: Default REDIS connection retry delay factor
- **CONFIG\_REDIS\_RETRY\_DELAY\_MAX**: Default REDIS connection retry delay max
- **CONFIG\_REDIS\_KEEPALIVE**: Default REDIS connection keepAlive
- **CONFIG\_REDIS\_CONNECTION\_TIMEOUT**: Default REDIS connection keepAlive
- **CONFIG\_REDIS\_CHECK\_INTERVAL**: Default REDIS status check interval
- **CONFIG\_REDIS\_DISABLE\_CHECKS**: Disable Redis checks

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
