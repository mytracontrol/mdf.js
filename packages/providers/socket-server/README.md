# **@mdf.js/socket-server-provider**

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

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/socket-server-provider</h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/socket-server-provider**](#mdfjssocket-server-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

Socket server provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [socket.io](https://www.npmjs.com/package/socket.io).

## **Installation**

Using npm:

```bash
npm install @mdf.js/socket-server-provider
```

Using yarn:

```bash
yarn add @mdf.js/socket-server-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Check the status of the server based in the status of the listening port and the error events from the socket-io server.
  - **observedValue**: actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`] based in the last ping event. `stopped` if the provider is stopped or has not been initialized yet, `running` if the provider is running and the server is listening and `error` if the provider is running but the server is not listening.
  - **status**: `pass` if the status is `running`, `warn` if the status is `stopped`, `fail` if the status is `error`.

## **Environment variables**

- **CONFIG\_SOCKET\_IO\_SERVER\_PORT** (default: `8080`): Port where the server will listen
- **CONFIG\_SOCKET\_IO\_SERVER\_HOST** (default: `'localhost'`): Host where the server will listen
- **CONFIG\_SOCKET\_IO\_SERVER\_PATH** (default: `'/socket.io'`): Path where the server will listen
- **CONFIG\_SOCKET\_IO\_SERVER\_ENABLE\_UI** (default: `true`): Enable the UI
- **CONFIG\_SOCKET\_IO\_SERVER\_CORS\_\_ORIGIN** (default: `` `/[\s\S]*\/` ``): CORS origin
- **CONFIG\_SOCKET\_IO\_SERVER\_CORS\_\_CREDENTIALS** (default: `true`): CORS credentials

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
