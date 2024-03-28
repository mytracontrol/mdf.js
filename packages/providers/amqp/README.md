# **@mdf.js/amqp-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/amqp-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/amqp-provider**](#mdfjsamqp-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

[AMQP](https://es.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol) provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [rhea](https://www.npmjs.com/package/rhea-promise).

## **Installation**

Using npm:

```bash
npm install @mdf.js/amqp-provider
```

Using yarn:

```bash
yarn add @mdf.js/amqp-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Checks the status of the AMQP connection
  - **observedValue**: Actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`].
  - **status**: `pass` if the status is `running`, `warn` if the status is `stopped`, `fail` if the status is `error`.
  - **output**: in case of `error` state (status `fail`), the error message is shown.
- **credits**: Checks the credits of the AMQP connection
  - **observedValue**: Actual number of credits in the consumer/producer instance.
  - **observedUnit**: `credits`.
  - **status**: `pass` if the number of credits is greater than `0`, `warn` otherwise.
  - **output**: `No credits available` if the number of credits is `0`.

## **Environment variables**

- **CONFIG\_AMQP\_SENDER\_NAME** (default: `undefined`): Sender name for the AMQP connection
- **CONFIG\_AMQP\_SENDER\_SETTLE\_MODE** (default: `` `2` ``): Sender settle mode for the AMQP connection
- **CONFIG\_AMQP\_SENDER\_AUTO\_SETTLE** (default: `` `true` ``): Sender auto settle for the AMQP connection
- **CONFIG\_AMQP\_RECEIVER\_NAME** (default: `` `${CONFIG_ARTIFACT_ID}` ``): Receiver name for the AMQP connection
- **CONFIG\_AMQP\_RECEIVER\_SETTLE\_MODE** (default: `` `0` ``): Receiver settle mode for the AMQP connection
- **CONFIG\_AMQP\_RECEIVER\_CREDIT\_WINDOW** (default: `` `0` ``): Receiver credit window for the AMQP connection
- **CONFIG\_AMQP\_RECEIVER\_AUTO\_ACCEPT** (default: `` `false` ``): Receiver auto accept for the AMQP connection
- **CONFIG\_AMQP\_RECEIVER\_AUTO\_SETTLE** (default: `` `true` ``): Receiver auto settle for the AMQP connection
- **CONFIG\_ARTIFACT\_ID**: Artifact identifier for the configuration provider
- **CONFIG\_AMQP\_USER\_NAME** (default: `` `mdf-amqp` ``): User name for the AMQP connection
- **CONFIG\_AMQP\_PASSWORD** (default: `undefined`): Password for the AMQP connection
- **CONFIG\_AMQP\_HOST** (default: `` `127.0.0.1` ``): Host for the AMQP connection
- **CONFIG\_AMQP\_HOSTNAME** (default: `undefined`): Hostname for the AMQP connection
- **CONFIG\_AMQP\_PORT** (default: `` `5672` ``): Port for the AMQP connection
- **CONFIG\_AMQP\_TRANSPORT** (default: `` `tcp` ``): Transport for the AMQP connection
- **CONFIG\_AMQP\_CONTAINER\_ID** (default: `` `${CONFIG_ARTIFACT_ID}` ``): Container ID for the AMQP connection
- **CONFIG\_AMQP\_ID** (default: `undefined`): ID for the AMQP connection
- **CONFIG\_AMQP\_RECONNECT** (default: `` `5000` ``): Reconnect time for the AMQP connection
- **CONFIG\_AMQP\_RECONNECT\_LIMIT** (default: `undefined`): Reconnect limit for the AMQP connection
- **CONFIG\_AMQP\_INITIAL\_RECONNECT\_DELAY** (default: `` `30000` ``): Initial reconnect delay for the AMQP connection
- **CONFIG\_AMQP\_MAX\_RECONNECT\_DELAY** (default: `` `10000` ``): Maximum reconnect delay for the AMQP connection
- **CONFIG\_AMQP\_MAX\_FRAME\_SIZE** (default: `undefined`): Maximum frame size for the AMQP connection
- **CONFIG\_AMQP\_NON\_FATAL\_ERRORS** (default: `` `['amqp:connection:forced']` ``): Non-fatal errors for the AMQP connection
- **CONFIG\_AMQP\_NON\_FATAL\_ERRORS** (default: `` `['amqp:connection:forced']` ``): Non-fatal errors for the AMQP connection
- **CONFIG\_AMQP\_CA\_PATH** (default: `undefined`): Path to the CA Cert for the AMQP connection
- **CONFIG\_AMQP\_CLIENT\_CERT\_PATH** (default: `undefined`): Path to the client cert for the AMQP connection
- **CONFIG\_AMQP\_CLIENT\_KEY\_PATH** (default: `undefined`): Path to the client key for the AMQP connection
- **CONFIG\_AMQP\_REQUEST\_CERT** (default: `` `false` ``): Request certificate for the AMQP connection
- **CONFIG\_AMQP\_REJECT\_UNAUTHORIZED** (default: `` `false` ``): Reject unauthorized for the AMQP connection

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
