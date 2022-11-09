# **@mdf.js/provider**

[![Node Version](https://img.shields.io/static/v1?style=flat&logo=node.js&logoColor=green&label=node&message=%3E=16%20||%2018&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat&logo=typescript&label=Typescript&message=4.8&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat&logo=snyk&label=Vulnerabilities&message=0&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">@mdf.js/provider</h1>
<h5 style="text-align:center;margin-top:0">Resources management instrumentation API for observability in @mdf.js</h5>

<!-- markdownlint-enable MD033 -->

---

## **Table of contents**

- [**@mdf.js/provider**](#mdfjsprovider)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
    - [I want to use a provider already instrumented](#i-want-to-use-a-provider-already-instrumented)
    - [I want to instrument a provider with this **@mdf.js/provider** API](#i-want-to-instrument-a-provider-with-this-mdfjsprovider-api)
  - [**Use**](#use)
  - [**License**](#license)

## **Introduction**

La API Provider de **@mdf.js** permite instrumentar proveedores de recursos (bases de datos, servicios de publicación/subscripción, etc.) de modo que puedan ser gestionados de forma estandarizada dentro de la API de **@mdf.js**, especialmente, en lo referente a:

- Observabilidad, ya que todos los _**Providers**_ implementan la interfaz [`Health.Component`](https://www.npmjs.com/package/@mdf.js/observability).
- Gestión de la configuración, ya que se provee una interfaz para la gestión de configuraciones por defecto, especificas o mediante variables de entorno.
- Gestión del estado del proveedor de recursos, mediante la estandarización de los estados y modos de operación de los _**Providers**_.

Algunos ejemplos de proveedores instrumentados con esta API son:

- [**@mdf.js/mongodb-provider**](https://www.npmjs.com/package/@mdf.js/mongo-provider)
- [**@mdf.js/redis-provider**](https://www.npmjs.com/package/@mdf.js/redis-provider)
- [**@mdf.js/elastic-provider**](https://www.npmjs.com/package/@mdf.js/elastic-provider)

## **Installation**

```shell
npm install @mdf.js/provider
```

- **yarn**

```shell
yarn add @mdf.js/provider
```

## **Information**

### I want to use a provider already instrumented

Un proveedor que haya sido instrumentado con **@mdf.js/provider** API, nos ofrece:

- `Factory`: la factoría nos permite crear nuevas instancias de nuestro `Provider` con la configuración deseada en cada caso. La `Factory` cuenta con un solo método, `create`, es una función que recibe como parámetro un objeto de configuración y devuelve una nueva instancia del `Provider` con la configuración especificada.

  El objeto de configuración que recibe la `Factory` es un objeto que puede contener las siguientes propiedades:

  - `config`: objeto de configuración específico del `Provider`. Si no se especifica, se utilizará la configuración por defecto del `Provider`.
  - `useEnvironment`: booleano que indica si se debe utilizar la configuración especificada en las variables de entorno.

```typescript
import { Mongo } from '@mdf.js/mongo-provider';
// default values + environment variables
const myDefaultValuesMongoProvider = Mongo.Factory.create();
// custom values + default values + environment variables
const myCustomValuesMongoProvider = Mongo.Factory.create({
  config: {
    url: 'mongodb://localhost:27017',
    appName: 'myName',
  },
  name: 'myProviderName' // used in observability
});
// custom values + default values
const myCustomValuesMongoProvider = Mongo.Factory.create({
  config: {
    url: 'mongodb://localhost:27017',
    appName: 'myName',
  },
  useEnvironment: false
});
// default values + environment variables + ownLogger
import { Logger } from '@mdf.js/logger';
const myLogger = new Logger('MyNewLogger', {
  console: {
    enabled: true,
    level: 'info',
  }
});
const myDefaultValuesMongoProvider = Mongo.Factory.create({
  logger: myLogger
});
```

### I want to instrument a provider with this **@mdf.js/provider** API

## **Use**

## **License**

Copyright 2022 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at https://opensource.org/licenses/MIT.
