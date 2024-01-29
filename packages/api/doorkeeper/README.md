# **@mdf.js/doorkeeper**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=16%20||%2018\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=4.8\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">@mdf.js/doorkeeper</h1>
<h5 style="text-align:center;margin-top:0">Improved, but simplified, JSON Schema validation using AJV </h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/doorkeeper**](#mdfjsdoorkeeper)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**API**](#api)
  - [**License**](#license)

## **Introduction**

The goal of **@mdf.js/doorkeeper** is to provide a simple and robust solution for validating, registering, and managing JSON schemas in diverse applications. The code is designed to leverage advanced JSON schema validation using AJV (Another JSON Schema Validator), enriched with additional functionalities.

## **Installation**

- **npm**

```bash
npm install @mdf.js/doorkeeper
```

- **yarn**

```bash
yarn add @mdf.js/doorkeeper
```

## **Information**

This package is part of the **@mdf.js** project, a collection of packages for building applications with Node.js and Typescript.

**@mdf.js/doorkeeper** has been designed to store and manage all the JSON schemas used in an application, allowing to assign a unique identifier to each schema, which it is associated with concrete type or interface, in this way, it is possible to validate the data of the application in a simple and robust way and to obtain the type of the data for Typescript applications.

```typescript
import { Doorkeeper } from '@mdf.js/doorkeeper';

export interface User {
  name: string;
  age: number;
};

export interface Address {
  street: string;
  city: string;
  country: string;
};

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name', 'age'],
  additionalProperties: false,
};

const addressSchema = {
  type: 'object',
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
    country: { type: 'string' },
  },
  required: ['street', 'city', 'country'],
  additionalProperties: false,
};

export interface Schemas {
  'User': User;
  'Address': Address;
}

const checker = new Doorkeeper<Schemas>().register({
  'User': userSchema,
  'Address': addressSchema,
});

const user: User = {
  name: 'John',
  age: 30,
};

const address: Address = {
  street: 'Main Street',
  city: 'New York',
  country: 'USA',
};

const myNewUser = await checker.validate('User', user); // myNewUser is of type User
const myNewAddress = await checker.validate('Address', address); // myNewAddress is of type Address
```

## **Use**

## **API**

- {@link Doorkeeper<T>}

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
