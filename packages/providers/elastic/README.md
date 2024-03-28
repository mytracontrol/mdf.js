# **@mdf.js/elastic-provider**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/elastic-provider </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/elastic-provider**](#mdfjselastic-provider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**Environment variables**](#environment-variables)
  - [**License**](#license)

## **Introduction**

Elasticsearch provider for [@mdf.js](https://mytracontrol.github.io/mdf.js/) based on [elasticsearch-js](https://www.npmjs.com/package/@elastic/elasticsearch).

## **Installation**

Using npm:

```bash
npm install @mdf.js/elastic-provider
```

Using yarn:

```bash
yarn add @mdf.js/elastic-provider
```

## **Information**

Check information about **@mdf.js** providers in the documentation of the core module [**@mdf.js/core**](https://mytracontrol.github.io/mdf.js/modules/_mdf_js_core.html).

## **Use**

Checks included in the provider:

- **status**: Checks the status of the Elasticsearch nodes using the [`cat health API`](https://www.elastic.co/guide/en/elasticsearch/reference/8.13/cat-health.html) and evaluating the number of nodes in `red` state.
  - **observedValue**: Actual state of the consumer/producer provider instance \[`error`, `running`, `stopped`].
  - **status**: `pass` if the status is `running`, `warn` if the status is `stopped`, `fail` if the status is `error`.
  - **output**: in case of `error` state (status `fail`), the error message is shown.
- **nodes**: Checks and shows the number of nodes in the cluster using the [`cat nodes API`](https://www.elastic.co/guide/en/elasticsearch/reference/8.13/cat-nodes.html).
  - **observedValue**: response from the `cat nodes API` in JSON format.
  - **observedUnit**: `Nodes Health`.
  - **status**: `pass` if no nodes are in `red` state, `fail` in other case.
  - **output**: in case of `fail` state `At least one of the nodes in the system is red state`.

## **Environment variables**

- **CONFIG\_ARTIFACT\_ID** (default: `` `mdf-elastic` ``): Artifact identifier for the configuration provider
- **CONFIG\_ELASTIC\_NODE** (default: `undefined`): Node to connect to. If CONFIG\_ELASTIC\_NODES is set, this is ignored.
- **CONFIG\_ELASTIC\_NODES** (default: `['http://localhost:9200']`): List of nodes to connect to. If this is set, CONFIG\_ELASTIC\_NODE is ignored.
- **CONFIG\_ELASTIC\_MAX\_RETRIES** (default: `5`): Maximum number of retries before failing the request.
- **CONFIG\_ELASTIC\_REQUEST\_TIMEOUT** (default: `30000`): Time in milliseconds before the request is considered a timeout.
- **CONFIG\_ELASTIC\_PING\_TIMEOUT** (default: `3000`): Time in milliseconds before the request is considered a timeout.
- **CONFIG\_ELASTIC\_PROXY** (default: `undefined`): Proxy to use when connecting to the Elasticsearch cluster.
- **CONFIG\_ELASTIC\_NAME** (default: `CONFIG_ARTIFACT_ID`): Name of the Elasticsearch client.
- **CONFIG\_ELASTIC\_HTTP\_SSL\_VERIFY** (default: `true`): Whether to verify the SSL certificate.
- **CONFIG\_ELASTIC\_CA\_PATH** (default: `undefined`): Path to the CA certificate.
- **CONFIG\_ELASTIC\_CLIENT\_CERT\_PATH** (default: `undefined`): Path to the client certificate.
- **CONFIG\_ELASTIC\_CLIENT\_KEY\_PATH** (default: `undefined`): Path to the client key.
- **CONFIG\_ELASTIC\_TLS\_SERVER\_NAME** (default: `undefined`): Server name for the TLS certificate.
- **CONFIG\_ELASTIC\_AUTH\_USERNAME** (default: `undefined`): Username for the Elasticsearch cluster. If this is set, a password must also be provided.
- **CONFIG\_ELASTIC\_AUTH\_PASSWORD** (default: `undefined`): Password for the Elasticsearch cluster. If this is set, a username must also be provided.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
