# **@mdf.js/http-server-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/http-server-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/http-server-provider**](#mdfjshttp-server-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**License**](#license)

## **Introduction**

HTTP server provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [express](https://www.npmjs.com/package/express).

## **Installation**

Using npm:

```bash
npm install @mdf.js/http-server-provider
```

Using yarn:

```bash
yarn add @mdf.js/http-server-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Due to the nature of the HTTP server, the status could be `running` if the server has been started properly, `stopped` if the server has been stopped or is not initialized, or `error` if the server could not be started.
  - **observedValue**: `running` if the server is running, `stopped` if the server is stopped, or `error` if the server could not be started.
  - **status**: `pass` if the server is running, `fail` could not be started or `warn` if the server is stopped.
  - **output**: In case of `error` state (status `fail`), the error message is shown.

## **Environment variables**

- **CONFIG\_SERVER\_PORT** (default: `8080`): Port for the HTTP server.
- **CONFIG\_SERVER\_HOST** (default: `localhost`): Host for the HTTP server.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
