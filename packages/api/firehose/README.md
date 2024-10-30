# **@mdf.js/firehose**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/firehose</h1>
<h5 style="text-align:center;margin-top:0">Module designed to facilitate the creation of customized data streaming pipelines.</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/firehose**](#mdfjsfirehose)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**License**](#license)

## **Introduction**

**@mdf.js/firehose** is a robust module within the @mdf.js ecosystem, designed to create customized data streaming pipelines. It provides a versatile framework for constructing complex data processing workflows, enabling developers to define custom plugs and strategies for handling diverse data streams.

Before delving into the documentation, it’s essential to understand the core concepts within @mdf.js/firehose:

- **Plugs**: Plugs act as the endpoints of data pipelines, responsible for receiving and sending data to or from the pipeline. They adapt the data stream to the requirements of source or destination systems, aligning with each system’s flow needs. Plugs can be categorized as inputs (**Source**) or outputs (**Sink**) and vary by flow conditions supported by the connecting systems:
  - **Source**:
    - **Flow**: Plugs that allow continuous data entry; this flow can be paused or restarted based on the pipeline’s state. Typical for data streaming systems like message brokers.
    - **Sequence**: Plugs that enable data entry in a sequential flow, where the pipeline requests data in specified quantities from the plug. Common for data storage systems such as databases.
    - **CreditFlow**: Continuous flow plugs that require a credit system to receive data. Common in data streaming systems that necessitate authorization to continue receiving data.
  - **Sink**:
    - **Tap**: Plugs that process data one unit at a time, meaning the pipeline calls the plug’s write method for a single data instance. Common in systems that support bulk operations.
    - **Jet**: Plugs that handle data in batches, where the pipeline calls the plug’s write method with multiple data instances. Typical for systems enabling bulk processing.

- **Jobs**: Jobs are instances that transport data and metadata through the pipeline. They manage the data flow between plugs, ensuring correct processing and pipeline state maintenance. Source plugs are notified when a job completes, allowing them to “acknowledge” data from the source system. Jobs can carry additional metadata or processing information, which plugs and strategies can utilize to make decisions or perform specific actions.

- **Strategies**: Strategies provide customizable, `type`-based functions that define how to transform job-carried data. Strategies can filter, transform, enrich, or aggregate data as required. They can be chained to build complex data processing workflows, allowing developers to create tailored data pipelines.

This entire ecosystem leverages Node.js streams to build high-performance data processing pipelines capable of efficiently handling large volumes of data.

![Firehose](./media/firehose-diagram.svg)

Other key features of **@mdf.js/firehose** include:

- **Error Handling**: The module provides a robust error handling mechanism, allowing developers to define custom error handling strategies for different scenarios.
- **Logging**: The module supports logging, enabling developers to track the pipeline’s execution and performance.
- **Metrics**: The module provides metrics for monitoring pipeline performance, allowing developers to track data processing efficiency and identify bottlenecks. This metrics are offered in the Prometheus format, using the `prom-client` library.
- **Multi-Threaded Processing**: The module supports multi-threaded processing, allowing developers to leverage the full potential of multi-core processors thanks to the **"@mdf.js/service-registry"** module.
- **Tooling**: The module provides a set of tools to facilitate the creation of custom plugs and strategies, including a plug generator and a strategy generator. This plugs could be based in the **"@mdf.js** providers

## **Installation**

```bash
npm install @mdf.js/firehose
```

```bash
yarn add @mdf.js/firehose
```

## **Information**

## **Use**

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
