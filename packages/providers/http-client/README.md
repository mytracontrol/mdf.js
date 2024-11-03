# **@mdf.js/http-client-provider**

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

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/http-client-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/http-client-provider**](#mdfjshttp-client-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
    - [**Health checks**](#health-checks)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

HTTP client provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [axios](https://www.npmjs.com/package/axios).

## **Installation**

Using npm:

```bash
npm install @mdf.js/http-client-provider
```

Using yarn:

```bash
yarn add @mdf.js/http-client-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

The provider implemented in this module wraps the [axios](https://www.npmjs.com/package/axios) client.

```typescript
import { HTTP } from '@mdf.js/http-client-provider';

const client = HTTP.Factory.create({
  name: `myHTTPClientProvider`,
  config: {
    requestConfig?: {...}, // a CreateAxiosDefaults object from axios
    httpAgentOptions: {...}, // an http AgentOptions object from Node.js
    httpsAgentOptions: {...}, // an https AgentOptions object from Node.js
  },
  logger: myLoggerInstance,
  useEnvironment: true,
});
```

- **Defaults**:

  ```typescript
  {}
  ```

- **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

  ```typescript
  {
    requestConfig: {
      baseURL: process.env['CONFIG_HTTP_CLIENT_BASE_URL'],
      timeout: process.env['CONFIG_HTTP_CLIENT_TIMEOUT'],
      auth: { // Only if username and password are set
        username: process.env['CONFIG_HTTP_CLIENT_AUTH_USERNAME'],
        password: process.env['CONFIG_HTTP_CLIENT_AUTH_PASSWORD'],
      },
    },
    httpAgentOptions: {
      keepAlive: process.env['CONFIG_HTTP_CLIENT_KEEPALIVE'],
      keepAliveInitialDelay: process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY'],
      keepAliveMsecs: process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS'],
      maxSockets: process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS'],
      maxTotalSockets: process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL'],
      maxFreeSockets: process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE'],
    },
    httpsAgentOptions: {
      keepAlive: process.env['CONFIG_HTTP_CLIENT_KEEPALIVE'],
      keepAliveInitialDelay: process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_INITIAL_DELAY'],
      keepAliveMsecs: process.env['CONFIG_HTTP_CLIENT_KEEPALIVE_MSECS'],
      maxSockets: process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS'],
      maxTotalSockets: process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_TOTAL'],
      maxFreeSockets: process.env['CONFIG_HTTP_CLIENT_MAX_SOCKETS_FREE'],
      rejectUnauthorized: process.env['CONFIG_HTTP_CLIENT_REJECT_UNAUTHORIZED'],
      ca: process.env['CONFIG_HTTP_CLIENT_CA_PATH'],
      cert: process.env['CONFIG_HTTP_CLIENT_CLIENT_CERT_PATH'],
      key: process.env['CONFIG_HTTP_CLIENT_CLIENT_KEY_PATH'],
    },
  }
  ```

### **Health checks**

Checks included in the provider:

- **status**: Due to the nature of the HTTP client, the status check is not implemented. The provider is always in `running` state.
  - **observedValue**: `running`.
  - **status**: `pass`.
  - **output**: `undefined`.
  - **componentType**: `service`.

```json
{
  "[mdf-http-client:status]": [
    {
      "status": "pass",
      "componentId": "00000000-0000-0000-0000-000000000000",
      "observedValue": "running",
      "componentType": "service",
      "output": undefined,
    },
  ],
}
```

## **Environment variables**

- **CONFIG\_HTTP\_CLIENT\_BASE\_URL** (default: `undefined`): Base URL for the HTTP client requests.
- **CONFIG\_HTTP\_CLIENT\_TIMEOUT** (default: `undefined`): Time in milliseconds before the request is considered a timeout.
- **CONFIG\_HTTP\_CLIENT\_AUTH\_USERNAME** (default: `undefined`): Username for the HTTP client authentication, if username is set, password must be set too.
- **CONFIG\_HTTP\_CLIENT\_AUTH\_PASSWORD** (default: `undefined`): Password for the HTTP client authentication if password is set, username must be set too.
- **CONFIG\_HTTP\_CLIENT\_KEEPALIVE** (default: `false`): Keep sockets around in a pool to be used by other requests in the future.
- **CONFIG\_HTTP\_CLIENT\_KEEPALIVE\_INITIAL\_DELAY** (default: `undefined`): Time in milliseconds before the keep alive feature is enabled.
- **CONFIG\_HTTP\_CLIENT\_KEEPALIVE\_MSECS** (default: `1000`): When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive. Only relevant if keepAlive is set to true.
- **CONFIG\_HTTP\_CLIENT\_MAX\_SOCKETS** (default: `Infinity`): Maximum number of sockets to allow per host. Default for Node 0.10 is 5, default for Node 0.12 is Infinity.
- **CONFIG\_HTTP\_CLIENT\_MAX\_SOCKETS\_TOTAL** (default: `Infinity`): Maximum number of sockets allowed for all hosts in total. Each request will use a new socket until the maximum is reached. Default: Infinity.
- **CONFIG\_HTTP\_CLIENT\_MAX\_SOCKETS\_FREE** (default: `256`): Maximum number of sockets to leave open in a free state. Only relevant if keepAlive is set to true.
- **CONFIG\_HTTP\_CLIENT\_REJECT\_UNAUTHORIZED** (default: `true`): Reject unauthorized TLS certificates.
- **CONFIG\_HTTP\_CLIENT\_CA\_PATH** (default: `undefined`): Path to the CA certificate file.
- **CONFIG\_HTTP\_CLIENT\_CLIENT\_CERT\_PATH** (default: `undefined`): Path to the client certificate file.
- **CONFIG\_HTTP\_CLIENT\_CLIENT\_KEY\_PATH** (default: `undefined`): Path to the client key file.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
