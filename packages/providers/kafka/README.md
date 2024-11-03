# **@mdf.js/kafka-provider**

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

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/kafka-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/kafka-provider**](#mdfjskafka-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

Kafka provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [kafkajs](https://www.npmjs.com/package/kafkajs).

## **Installation**

Using npm:

```bash
npm install @mdf.js/kafka-provider
```

Using yarn:

```bash
yarn add @mdf.js/kafka-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Checks the status of the kafka nodes using the [**admin client**](https://kafka.js.org/docs/cluster) of the KafkaJS library, performing several requests about the status of the nodes and groups.
  - **observedValue**: actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`] based on the response, or not, to admin client requests. `error` if there is errors during the requests, `running` if the requests are successful, and `stopped` if the instance has been stopped or not initialized.
  - **status**: `pass` if the status is `running`, `warn` if the status is `stopped`, `fail` if the status is `error`.
  - **output**: Shows the error message in case of `error` state (status `fail`).
- **topics**: Checks the topics available in the Kafka connection
  - **observedValue**: List of topics available in the Kafka connection.
  - **observedUnit**: `topics`.
  - **status**: `pass` if the topics are available, `fail` in other cases.
  - **output**: `No topics available` if the topics are not available.

## **Environment variables**

- **CONFIG\_KAFKA\_PRODUCER\_\_METADATA\_MAX\_AGE** (default: `300000`): Maximum time in ms that the producer will wait for metadata
- **CONFIG\_KAFKA\_PRODUCER\_\_ALLOW\_AUTO\_TOPIC\_CREATION** (default: `true`): Allow auto topic creation
- **CONFIG\_KAFKA\_PRODUCER\_\_TRANSACTION\_TIMEOUT** (default: `60000`): Transaction timeout in ms
- **CONFIG\_KAFKA\_PRODUCER\_\_IDEMPOTENT** (default: `false`): Idempotent producer
- **CONFIG\_KAFKA\_PRODUCER\_\_TRANSACTIONAL\_ID** (default: `undefined`): Transactional id
- **CONFIG\_KAFKA\_PRODUCER\_\_MAX\_IN\_FLIGHT\_REQUEST** (default: `undefined`): Maximum number of in-flight requests
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_MAX\_RETRY\_TIME** (default: `300000`): Maximum time in ms that the producer will wait for metadata
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_INITIAL\_RETRY\_TIME** (default: `300`): Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_FACTOR** (default: `0.2`): A multiplier to apply to the retry time
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_MULTIPLIER** (default: `2`): A multiplier to apply to the retry time
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_RETRIES** (default: `5`): Maximum number of retries per call
- **CONFIG\_KAFKA\_CONSUMER\_\_GROUP\_ID** (default: `'hostname()'`): Consumer group id
- **CONFIG\_KAFKA\_CONSUMER\_\_SESSION\_TIMEOUT** (default: `30000`): The timeout used to detect consumer failures when using Kafka's group management facility. The consumer sends periodic heartbeats to indicate its liveness to the broker. If no heartbeats are received by the broker before the expiration of this session timeout, then the broker will remove this consumer from the group and initiate a rebalance.
- **CONFIG\_KAFKA\_CONSUMER\_\_REBALANCE\_TIMEOUT** (default: `60000`): The maximum time that the coordinator will wait for each member to rejoin when rebalancing the group.
- **CONFIG\_KAFKA\_CONSUMER\_\_HEARTBEAT\_INTERVAL** (default: `3000`): The expected time between heartbeats to the consumer coordinator when using Kafka's group management facility. Heartbeats are used to ensure that the consumer's session stays active and to facilitate rebalancing when new consumers join or leave the group. The value must be set lower than \`sessionTimeout\`, but typically should be set no higher than 1/3 of that value. It can be adjusted even lower to control the expected time for normal rebalances.
- **CONFIG\_KAFKA\_CONSUMER\_\_METADATA\_MAX\_AGE** (default: `300000`): The period of time in milliseconds after which we force a refresh of metadata even if we haven't seen any partition leadership changes to proactively discover any new brokers or partitions.
- **CONFIG\_KAFKA\_CONSUMER\_\_ALLOW\_AUTO\_TOPIC\_CREATION** (default: `true`): Allow automatic topic creation on the broker when subscribing to or assigning non-existing topics.
- **CONFIG\_KAFKA\_CONSUMER\_\_MAX\_BYTES\_PER\_PARTITION** (default: `1048576`): The maximum amount of data per-partition the server will return.
- **CONFIG\_KAFKA\_CONSUMER\_\_MIN\_BYTES** (default: `1`): Minimum amount of data the server should return for a fetch request. If insufficient data is available the request will wait until some is available.
- **CONFIG\_KAFKA\_CONSUMER\_\_MAX\_BYTES** (default: `10485760`): The maximum amount of data the server should return for a fetch request.
- **CONFIG\_KAFKA\_CONSUMER\_MAX\_WAIT\_TIME\_IN\_MS** (default: `5000`): The maximum amount of time the server will block before answering the fetch request if there isn't sufficient data to immediately satisfy \`minBytes\`.
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_MAX\_RETRY\_TIME** (default: `30000`): Maximum time in milliseconds to wait for a successful retry
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_INITIAL\_RETRY\_TIME** (default: `300`): Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_FACTOR** (default: `0.2`): A multiplier to apply to the retry time
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_MULTIPLIER** (default: `2`): A multiplier to apply to the retry time
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_RETRIES** (default: `5`): Maximum number of retries per call
- **CONFIG\_KAFKA\_CONSUMER\_\_READ\_UNCOMMITTED** (default: `false`): Whether to read uncommitted messages
- **CONFIG\_KAFKA\_CONSUMER\_\_MAX\_IN\_FLIGHT\_REQUEST** (default: `undefined`): Maximum number of in-flight requests
- **CONFIG\_KAFKA\_CONSUMER\_\_RACK\_ID** (default: `undefined`): The consumer will only be assigned partitions from the leader of the partition to which it is assigned.
- **CONFIG\_KAFKA\_LOG\_LEVEL** (default: `` `error` ``): Define the log level for the kafka provider, possible values are: - \`error\` - \`warn\` - \`info\` - \`debug\` - \`trace\`
- **CONFIG\_KAFKA\_CLIENT\_\_CLIENT\_ID** (default: `hostname`): Client identifier
- **CONFIG\_KAFKA\_CLIENT\_\_BROKERS** (default: `'127.0.0.1:9092'`): Kafka brokers
- **CONFIG\_KAFKA\_CLIENT\_\_CONNECTION\_TIMEOUT** (default: `1000`): Time in milliseconds to wait for a successful connection
- **CONFIG\_KAFKA\_CLIENT\_\_AUTHENTICATION\_TIMEOUT** (default: `1000`): Timeout in ms for authentication requests
- **CONFIG\_KAFKA\_CLIENT\_\_REAUTHENTICATION\_THRESHOLD** (default: `1000`): When periodic reauthentication (connections.max.reauth.ms) is configured on the broker side, reauthenticate when \`reauthenticationThreshold\` milliseconds remain of session lifetime.
- **CONFIG\_KAFKA\_CLIENT\_\_REQUEST\_TIMEOUT** (default: `30000`): Time in milliseconds to wait for a successful request
- **CONFIG\_KAFKA\_CLIENT\_\_ENFORCE\_REQUEST\_TIMEOUT** (default: `true`): The request timeout can be disabled by setting this value to false.
- **CONFIG\_KAFKA\_MAX\_RETRY\_TIME** (default: `30000`): Maximum time in milliseconds to wait for a successful retry
- **CONFIG\_KAFKA\_INITIAL\_RETRY\_TIME** (default: `300`): Initial value used to calculate the retry in milliseconds (This is still randomized following the randomization factor)
- **CONFIG\_KAFKA\_RETRY\_FACTOR** (default: `0.2`): Randomization factor
- **CONFIG\_KAFKA\_RETRY\_MULTIPLIER** (default: `2`): Exponential factor
- **CONFIG\_KAFKA\_RETRIES** (default: `5`): Maximum number of retries per call
- **CONFIG\_KAFKA\_CLIENT\_SSL\_ENABLED** (default: `false`): Whether to use SSL
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_REJECT\_UNAUTHORIZED** (default: `true`): Whether to verify the SSL certificate.
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_SERVER\_NAME** (default: `undefined`): Server name for the TLS certificate.
- **CONFIG\_KAFKA\_CLIENT\_SSL\_CA\_PATH** (default: `undefined`): Path to the CA certificate.
- **CONFIG\_KAFKA\_CLIENT\_SSL\_CERT\_PATH** (default: `undefined`): Path to the client certificate.
- **CONFIG\_KAFKA\_CLIENT\_SSL\_KEY\_PATH** (default: `undefined`): Path to the client key.
- **CONFIG\_KAFKA\_CLIENT\_\_SASL\_USERNAME** (default: `undefined`): SASL username
- **CONFIG\_KAFKA\_CLIENT\_\_SASL\_PASSWORD** (default: `undefined`): SASL password
- **NODE\_APP\_INSTANCE** (default: `undefined`): Used as default container id, receiver name, sender name, etc. in cluster configurations.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
