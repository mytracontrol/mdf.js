# **@mdf.js/kafka-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

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

- **CONFIG\_KAFKA\_CLIENT\_\_CLIENT\_ID**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_BROKERS**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_BROKERS**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_CONNECTION\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_AUTHENTICATION\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_REAUTHENTICATION\_THRESHOLD**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_REQUEST\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_ENFORCE\_REQUEST\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_MAX\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_INITIAL\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_RETRY\_FACTOR**: undefined
- **CONFIG\_KAFKA\_RETRY\_MULTIPLIER**: undefined
- **CONFIG\_KAFKA\_RETRIES**: undefined
- **CONFIG\_KAFKA\_CLIENT\_SSL**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_REJECT\_UNAUTHORIZED**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_SERVER\_NAME**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_CA\_PATH**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_CERT\_PATH**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_KEY\_PATH**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SASL\_USERNAME**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SASL\_PASSWORD**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_METADATA\_MAX\_AGE**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_ALLOW\_AUTO\_TOPIC\_CREATION**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_TRANSACTION\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_IDEMPOTENT**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_TRANSACTIONAL\_ID**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_MAX\_IN\_FLIGHT\_REQUEST**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_MAX\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_INITIAL\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_FACTOR**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_MULTIPLIER**: undefined
- **CONFIG\_KAFKA\_PRODUCER\_\_RETRY\_\_RETRIES**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_CLIENT\_ID**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_BROKERS**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_BROKERS**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_CONNECTION\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_AUTHENTICATION\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_REAUTHENTICATION\_THRESHOLD**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_REQUEST\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_ENFORCE\_REQUEST\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_MAX\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_INITIAL\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_RETRY\_FACTOR**: undefined
- **CONFIG\_KAFKA\_RETRY\_MULTIPLIER**: undefined
- **CONFIG\_KAFKA\_RETRIES**: undefined
- **CONFIG\_KAFKA\_CLIENT\_SSL**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_REJECT\_UNAUTHORIZED**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_SERVER\_NAME**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_CA\_PATH**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_CERT\_PATH**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SSL\_\_KEY\_PATH**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SASL\_USERNAME**: undefined
- **CONFIG\_KAFKA\_CLIENT\_\_SASL\_PASSWORD**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_GROUP\_ID**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_SESSION\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_REBALANCE\_TIMEOUT**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_HEARTBEAT\_INTERVAL**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_METADATA\_MAX\_AGE**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_ALLOW\_AUTO\_TOPIC\_CREATION**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_MAX\_BYTES\_PER\_PARTITION**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_MIN\_BYTES**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_MAX\_BYTES**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_MAX\_WAIT\_TIME\_IN\_MS**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_MAX\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_INITIAL\_RETRY\_TIME**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_FACTOR**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_MULTIPLIER**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_RETRY\_\_RETRIES**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_READ\_UNCOMMITTED**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_MAX\_IN\_FLIGHT\_REQUEST**: undefined
- **CONFIG\_KAFKA\_CONSUMER\_\_RACK\_ID**: undefined
- **CONFIG\_ARTIFACT\_ID**: Artifact identifier for the configuration provider
- **CONFIG\_KAFKA\_LOG\_LEVEL**: undefined

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
