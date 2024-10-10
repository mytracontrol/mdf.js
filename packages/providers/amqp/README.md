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
        name: process.env['NODE_APP_INSTANCE'] ||'mdf-amqp',
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
        name: process.env['NODE_APP_INSTANCE'] ||'mdf-amqp',
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
      container_id: process.env['NODE_APP_INSTANCE'] || 'mdf-amqp',
      reconnect: 5000,
      initial_reconnect_delay: 30000,
      max_reconnect_delay: 10000,
      non_fatal_errors: ['amqp:connection:forced'],
      idle_time_out: 5000,
      reconnect_limit: Number.MAX_SAFE_INTEGER,
      keepAlive: true,
      keepAliveInitialDelay: 2000,
      timeout: 10000,
      all_errors_non_fatal: true,
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
      idle_time_out: process.env['CONFIG_AMQP_IDLE_TIME_OUT'], // coerced to number
      keepAlive: process.env['CONFIG_AMQP_KEEP_ALIVE'], // coerced to boolean
      keepAliveInitialDelay: process.env['CONFIG_AMQP_KEEP_ALIVE_INITIAL_DELAY'], // coerced to number
      timeout: process.env['CONFIG_AMQP_TIMEOUT'], // coerced to number
      all_errors_non_fatal: process.env['CONFIG_AMQP_ALL_ERRORS_NON_FATAL'], // coerced to boolean
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

```json
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

- **CONFIG\_AMQP\_SENDER\_NAME** (default: `` NODE_APP_INSTANCE || `mdf-amqp` ``): The name of the link. This should be unique for the container. If not specified a unique name is generated.
- **CONFIG\_AMQP\_SENDER\_SETTLE\_MODE** (default: `2`): It specifies the sender settle mode with following possible values: - 0 - "unsettled" - The sender will send all deliveries initially unsettled to the receiver. - 1 - "settled" - The sender will send all deliveries settled to the receiver. - 2 - "mixed" - (default) The sender MAY send a mixture of settled and unsettled deliveries to the receiver.
- **CONFIG\_AMQP\_SENDER\_AUTO\_SETTLE** (default: `true`): Whether sent messages should be automatically settled once the peer settles them.
- **CONFIG\_AMQP\_RECEIVER\_NAME** (default: `` NODE_APP_INSTANCE || `mdf-amqp` ``): The name of the link. This should be unique for the container. If not specified a unique name is generated.
- **CONFIG\_AMQP\_RECEIVER\_SETTLE\_MODE** (default: `0`): It specifies the receiver settle mode with following possible values: - 0 - "first" - The receiver will spontaneously settle all incoming transfers. - 1 - "second" - The receiver will only settle after sending the disposition to the sender and receiving a disposition indicating settlement of the delivery from the sender.
- **CONFIG\_AMQP\_RECEIVER\_CREDIT\_WINDOW** (default: `0`): A "prefetch" window controlling the flow of messages over this receiver. Defaults to \`1000\` if not specified. A value of \`0\` can be used to turn off automatic flow control and manage it directly.
- **CONFIG\_AMQP\_RECEIVER\_AUTO\_ACCEPT** (default: `false`): Whether received messages should be automatically accepted.
- **CONFIG\_AMQP\_RECEIVER\_AUTO\_SETTLE** (default: `true`): Whether received messages should be automatically settled once the remote settles them.
- **CONFIG\_AMQP\_USER\_NAME** (default: `'mdf-amqp'`): User name for the AMQP connection
- **CONFIG\_AMQP\_PASSWORD** (default: `undefined`): The secret key to be used while establishing the connection
- **CONFIG\_AMQP\_HOST** (default: `undefined`): The hostname of the AMQP server
- **CONFIG\_AMQP\_HOSTNAME** (default: `127.0.0.1`): The hostname presented in \`open\` frame, defaults to host.
- **CONFIG\_AMQP\_PORT** (default: `5672`): The port of the AMQP server
- **CONFIG\_AMQP\_TRANSPORT** (default: `'tcp'`): The transport option. This is ignored if connection\_details is set.
- **NODE\_APP\_INSTANCE** (default: `'tcp'`): The transport option. This is ignored if connection\_details is set.
- **CONFIG\_AMQP\_CONTAINER\_ID** (default: `` process.env['NODE_APP_INSTANCE'] || `mdf-amqp` ``): The id of the source container. If not provided then this will be the id (a guid string) of the assocaited container object. When this property is provided, it will be used in the \`open\` frame to let the peer know about the container id. However, the associated container object would still be the same container object from which the connection is being created. The \`"container\_id"\` is how the peer will identify the 'container' the connection is being established from. The container in AMQP terminology is roughly analogous to a process. Using a different container id on connections from the same process would cause the peer to treat them as coming from distinct processes.
- **CONFIG\_AMQP\_ID** (default: `undefined`): A unique name for the connection. If not provided then this will be a string in the following format: "connection-\<counter>".
- **CONFIG\_AMQP\_RECONNECT** (default: `5000`): If true (default), the library will automatically attempt to reconnect if disconnected. If false, automatic reconnect will be disabled. If it is a numeric value, it is interpreted as the delay between reconnect attempts (in milliseconds).
- **CONFIG\_AMQP\_RECONNECT\_LIMIT** (default: `undefined`): Maximum number of reconnect attempts. Applicable only when reconnect is true.
- **CONFIG\_AMQP\_INITIAL\_RECONNECT\_DELAY** (default: `30000`): Time to wait in milliseconds before attempting to reconnect. Applicable only when reconnect is true or a number is provided for reconnect.
- **CONFIG\_AMQP\_MAX\_RECONNECT\_DELAY** (default: `10000`): Maximum reconnect delay in milliseconds before attempting to reconnect. Applicable only when reconnect is true.
- **CONFIG\_AMQP\_MAX\_FRAME\_SIZE** (default: `4294967295`): The largest frame size that the sending peer is able to accept on this connection.
- **CONFIG\_AMQP\_NON\_FATAL\_ERRORS** (default: `['amqp:connection:forced']`): An array of error conditions which if received on connection close from peer should not prevent reconnect (by default this only includes \`"amqp:connection:forced"\`).
- **CONFIG\_AMQP\_NON\_FATAL\_ERRORS** (default: `['amqp:connection:forced']`): An array of error conditions which if received on connection close from peer should not prevent reconnect (by default this only includes \`"amqp:connection:forced"\`).
- **CONFIG\_AMQP\_CA\_PATH** (default: `undefined`): The path to the CA certificate file
- **CONFIG\_AMQP\_CLIENT\_CERT\_PATH** (default: `undefined`): The path to the client certificate file
- **CONFIG\_AMQP\_CLIENT\_KEY\_PATH** (default: `undefined`): The path to the client key file
- **CONFIG\_AMQP\_REQUEST\_CERT** (default: `false`): If true the server will request a certificate from clients that connect and attempt to verify that certificate. Defaults to false.
- **CONFIG\_AMQP\_REJECT\_UNAUTHORIZED** (default: `true`): If true the server will reject any connection which is not authorized with the list of supplied CAs. This option only has an effect if requestCert is true.
- **CONFIG\_AMQP\_IDLE\_TIME\_OUT** (default: `5000`): The maximum period in milliseconds between activity (frames) on the connection that is desired from the peer. The open frame carries the idle-time-out field for this purpose. To avoid spurious timeouts, the value in idle\_time\_out is set to be half of the peer’s actual timeout threshold.
- **CONFIG\_AMQP\_KEEP\_ALIVE** (default: `true`): If true the server will send a keep-alive packet to maintain the connection alive.
- **CONFIG\_AMQP\_KEEP\_ALIVE\_INITIAL\_DELAY** (default: `2000`): The initial delay in milliseconds for the keep-alive packet.
- **CONFIG\_AMQP\_TIMEOUT** (default: `10000`): The time in milliseconds to wait for the connection to be established.
- **CONFIG\_AMQP\_ALL\_ERRORS\_NON\_FATAL** (default: `true`): Determines if rhea's auto-reconnect should attempt reconnection on all fatal errors
- **NODE\_APP\_INSTANCE** (default: `undefined`): Used as default container id, receiver name, sender name, etc. in cluster configurations.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
