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
    - [**Health checks**](#health-checks)
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

In this module there are implemented two providers:

- The consumer (`Receiver`), that wraps the [rhea-promise](https://www.npmjs.com/package/rhea-promise) `Receiver`, which wraps the [rhea](https://www.npmjs.com/package/rhea) `Receiver` class.

  ```typescript
  import { Receiver } from '@mdf.js/amqp-provider';

  const ownReceiver = Receiver.Factory.create({
    name: `myAMQPReceiverName`,
    config: {...}, //rhea - AMQP CommonConnectionOptions
    logger: myLoggerInstance,
    useEnvironment: true,
  });
  ```

  - **Defaults**:

    ```typescript
    {
      // ... Common client options, see below
      receiver_options: {
        name: 'mdf-amqp',
        rcv_settle_mode: 0,
        credit_window: 0,
        autoaccept: false,
        autosettle: true,
      }
    }
    ```

  - **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

    ```typescript
    {
      // ... Common client options, see below
      receiver_options: {
        name: process.env['CONFIG_AMQP_RECEIVER_NAME'],
        rcv_settle_mode: process.env['CONFIG_AMQP_RECEIVER_SETTLE_MODE'], // coerced to number
        credit_window: process.env['CONFIG_AMQP_RECEIVER_CREDIT_WINDOW'], // coerced to number
        autoaccept: process.env['CONFIG_AMQP_RECEIVER_AUTO_ACCEPT'], // coerced to boolean
        autosettle: process.env['CONFIG_AMQP_RECEIVER_AUTO_SETTLE'], // coerced to boolean
      }
    }
    ```

- The producer (`Sender`) that wraps the [rhea-promise](https://www.npmjs.com/package/rhea-promise) `AwaitableSender` class.

  ```typescript
  import { Sender } from '@mdf.js/amqp-provider';

  const ownSender = Sender.Factory.create({
    name: `myAMQPSenderName`,
    config: {...}, //rhea - AMQP CommonConnectionOptions
    logger: myLoggerInstance,
    useEnvironment: true,
  });
  ```

  - **Defaults**:

    ```typescript
    {
      // ... Common client options, see below
      sender_options: {
        name: 'mdf-amqp',
        snd_settle_mode: 2,
        autosettle: true,
        target: {},
      }
    }
    ```

  - **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

    ```typescript
    {
      // ... Common client options, see below
      sender_options: {
        name: process.env['CONFIG_AMQP_SENDER_NAME'],
        snd_settle_mode: process.env['CONFIG_AMQP_SENDER_SETTLE_MODE'], // coerced to number
        autosettle: process.env['CONFIG_AMQP_SENDER_AUTO_SETTLE'], // coerced to boolean
      }
    }
    ```

- Common client options:
  - **Defaults**:

    ```typescript
    {
      username: 'mdf-amqp',
      host: '127.0.0.1',
      port: 5672,
      transport: 'tcp',
      container_id: 'mdf-amqp',
      reconnect: 5000,
      initial_reconnect_delay: 30000,
      max_reconnect_delay: 10000,
      non_fatal_errors: ['amqp:connection:forced'],
    }
    ```

  - **Environment**: remember to set the `useEnvironment` flag to `true` to use these environment variables.

    ```typescript
    {
      username: process.env['CONFIG_AMQP_USER_NAME'],
      password: process.env['CONFIG_AMQP_PASSWORD'],
      host: process.env['CONFIG_AMQP_HOST'],
      hostname: process.env['CONFIG_AMQP_HOSTNAME'],
      port: process.env['CONFIG_AMQP_PORT'], // coerced to number
      transport: process.env['CONFIG_AMQP_TRANSPORT'],
      container_id: process.env['CONFIG_AMQP_CONTAINER_ID'],
      id: process.env['CONFIG_AMQP_ID'],
      reconnect: process.env['CONFIG_AMQP_RECONNECT'], // coerced to number
      reconnect_limit: process.env['CONFIG_AMQP_RECONNECT_LIMIT'], // coerced to number
      initial_reconnect_delay: process.env['CONFIG_AMQP_INITIAL_RECONNECT_DELAY'], // coerced to number
      max_reconnect_delay: process.env['CONFIG_AMQP_MAX_RECONNECT_DELAY'], // coerced to number
      max_frame_size: process.env['CONFIG_AMQP_MAX_FRAME_SIZE'], // coerced to number
      non_fatal_errors: process.env['CONFIG_AMQP_NON_FATAL_ERRORS'], // coerced to array from string separated by ','
      key: process.env['CONFIG_AMQP_CLIENT_KEY_PATH'], // The file will be read and the content will be used as the key
      cert: process.env['CONFIG_AMQP_CLIENT_CERT_PATH'], // The file will be read and the content will be used as the cert
      ca: process.env['CONFIG_AMQP_CA_PATH'], // The file will be read and the content will be used as the CA
      requestCert: process.env['CONFIG_AMQP_REQUEST_CERT'], // coerced to boolean
      rejectUnauthorized: process.env['CONFIG_AMQP_REJECT_UNAUTHORIZED'], // coerced to boolean
    };
    ```

### **Health checks**

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

```typescript
{
  "[mdf-amqp:status]": [
    {
      "status": "pass",
      "componentId": "00000000-0000-0000-0000-000000000000",
      "observedValue": "running",
      "componentType": "service",
      "output": undefined
    }
  ],
  "[mdf-amqp:credits]": [
    {
      "status": "pass",
      "componentId": "00000000-0000-0000-0000-000000000000",
      "observedValue": 10,
      "observedUnit": "credits",
      "output": undefined
    }
  ]
}
```

## **Environment variables**

- **CONFIG\_AMQP\_SENDER\_NAME**: undefined
- **CONFIG\_AMQP\_SENDER\_SETTLE\_MODE**: undefined
- **CONFIG\_AMQP\_SENDER\_AUTO\_SETTLE**: undefined
- **CONFIG\_AMQP\_RECEIVER\_NAME**: undefined
- **CONFIG\_AMQP\_RECEIVER\_SETTLE\_MODE**: undefined
- **CONFIG\_AMQP\_RECEIVER\_CREDIT\_WINDOW**: undefined
- **CONFIG\_AMQP\_RECEIVER\_AUTO\_ACCEPT**: undefined
- **CONFIG\_AMQP\_RECEIVER\_AUTO\_SETTLE**: undefined
- **CONFIG\_AMQP\_USER\_NAME**: undefined
- **CONFIG\_AMQP\_PASSWORD**: undefined
- **CONFIG\_AMQP\_HOST**: undefined
- **CONFIG\_AMQP\_HOSTNAME**: undefined
- **CONFIG\_AMQP\_PORT**: undefined
- **CONFIG\_AMQP\_TRANSPORT**: undefined
- **CONFIG\_AMQP\_CONTAINER\_ID**: undefined
- **CONFIG\_AMQP\_ID**: undefined
- **CONFIG\_AMQP\_RECONNECT**: undefined
- **CONFIG\_AMQP\_RECONNECT\_LIMIT**: undefined
- **CONFIG\_AMQP\_INITIAL\_RECONNECT\_DELAY**: undefined
- **CONFIG\_AMQP\_MAX\_RECONNECT\_DELAY**: undefined
- **CONFIG\_AMQP\_MAX\_FRAME\_SIZE**: undefined
- **CONFIG\_AMQP\_NON\_FATAL\_ERRORS**: undefined
- **CONFIG\_AMQP\_NON\_FATAL\_ERRORS**: undefined
- **CONFIG\_AMQP\_CA\_PATH**: undefined
- **CONFIG\_AMQP\_CLIENT\_CERT\_PATH**: undefined
- **CONFIG\_AMQP\_CLIENT\_KEY\_PATH**: undefined
- **CONFIG\_AMQP\_REQUEST\_CERT**: undefined
- **CONFIG\_AMQP\_REJECT\_UNAUTHORIZED**: undefined

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
