# **@mdf.js/mqtt-provider**

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

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/mqtt-provider</h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/mqtt-provider**](#mdfjsmqtt-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

MQTT provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [mqtt](https://www.npmjs.com/package/mqtt).

## **Installation**

Using npm:

```bash
npm install @mdf.js/mqtt-provider
```

Using yarn:

```bash
yarn add @mdf.js/mqtt-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Checks the ping messages from the server.
  - **observedValue**: actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`] based in the last ping event. `stopped` if the provider is stopped or has not been initialized yet, `running` if the provider is running and the last ping event was successful, `error` if the provider is running and the last ping event was not successful.
  - **observedUnit**: `status`.
  - **status**: `fail` if the observed value is `error`, `warn` if the observed value is `stopped`, `pass` in other case.
- **lastError**:
  - **observedValue**: last error message from the provider.
  - **observedUnit**: `Last error`.
  - **status**: `pass`.
  - **output**: last error message from the provider.

## **Environment variables**

- **CONFIG\_MQTT\_URL** (default: `'mqtt://localhost:1883'`): URL of the server
- **CONFIG\_MQTT\_PROTOCOL** (default: `'mqtt'`): Protocol to use
- **CONFIG\_MQTT\_USERNAME** (default: `undefined`): Username
- **CONFIG\_MQTT\_PASSWORD** (default: `undefined`): Password
- **CONFIG\_MQTT\_CLIENT\_ID** (default: `'mqtt-client'`): Client ID
- **CONFIG\_MQTT\_KEEPALIVE** (default: `60`): Keepalive in seconds
- **CONFIG\_MQTT\_CLIENT\_CA\_PATH** (default: `undefined`): CA file path
- **CONFIG\_MQTT\_CLIENT\_CLIENT\_CERT\_PATH** (default: `undefined`): Client cert file path
- **CONFIG\_MQTT\_CLIENT\_CLIENT\_KEY\_PATH** (default: `undefined`): Client key file path
- **NODE\_APP\_INSTANCE** (default: `undefined`): Used as default container id, receiver name, sender name, etc. in cluster configurations.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
