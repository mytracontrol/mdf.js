# **@mdf.js/service-registry**

[![Node Version](https://img.shields.io/static/v1?style=flat&logo=node.js&logoColor=green&label=node&message=%3E=20&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat&logo=typescript&label=Typescript&message=5.4&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat&logo=snyk&label=Vulnerabilities&message=0&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/service-registry</h1>
<h5 style="text-align:center;margin-top:0">Service register, used for tooling microservices adding observability and control capabilities.
</h5>

<!-- markdownlint-enable MD033 -->

---

## **Table of contents**

- [**@mdf.js/service-registry**](#mdfjsservice-registry)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Use**](#use)
    - [**Parameterization Options**](#parameterization-options)
      - [**BootstrapOptions**](#bootstrapoptions)
      - [**ServiceRegistryOptions**](#serviceregistryoptions)
      - [**CustomOptions**](#customoptions)
    - [**Module's Programmatic Interface**](#modules-programmatic-interface)
    - [**Module's REST-API Interface**](#modules-rest-api-interface)
    - [**Module's Control Interface**](#modules-control-interface)
  - [**License**](#license)

## **Introduction**

The **@mdf.js/service-register** is a core package of the **Mytra Development Framework**. This module is designed for instrumenting microservices, adding observability and control capabilities, among other features. This allows developers to focus on the business logic development, instead of implementing these capabilities into each microservice.

In summary, the **@mdf.js/service-register** module provides the following features:

- **Configuration management**: Load configurations from files, environment variables, or the `package.json` file.
- **Logging**: Use a logger with different transports, levels, and formats.
- **Metrics**: Collect metrics from the application and expose them through an HTTP server in Prometheus format.
- **Health checks**: Expose an HTTP server with health checks for the application.
- **Control Interface**: Allow to create a built-in OpenC2 consumer for controlling the application.

The **@mdf.js/service-register** module is intended to be loaded at the start of the application, even supporting the use of [`cluster`](https://nodejs.org/api/cluster.html) for creating multiple instances of the application.

_With default parameters:_

```typescript
import { ServiceRegistry } from '@mdf.js/service-registry';

const service = new ServiceRegistry();
// Our business logic goes here
service.register([myProvider, myResource, myService]);
await service.start(); // This also starts the registered resources
```

_With custom parameters:_

```typescript
import { ServiceRegistry } from '@mdf.js/service-registry';

const service = new ServiceRegistry(
  {
    configFiles: ['./config/config.json'],
    useEnvironment: true,
    loadReadme: true,
  },
  {
    loggerOptions: {
      console: {
        enabled: true,
        level: 'info',
      }
    },
    metadata: {
      name: 'service-registry',
      version: '1.0.0',
      description: 'Service registry, used for tooling microservices with observability and control capabilities.',
    }
    ...
  },
  {
    myOwnProperty: `myNeededValue`
  }
);

const myProvider = new MyProvider(service.get('myProviderConfig'));
const myResource = new MyResource(service.get('myResourceConfig.option1'));
const myService = new MyService(service.settings.custom.myOwnProperty);
service.logger.info('My custom log message');
// Our business logic goes here
service.register([myProvider, myResource, myService]);
await service.start(); // This also starts the registered resources
```

_Using `cluster` for creating multiple instances:_

```typescript
import { ServiceRegistry } from '@mdf.js/service-registry';
import cluster from 'cluster';

if (cluster.isMaster) {
  const service = new ServiceRegistry(
    {},
    {
      observabilityOptions: {
        isCluster: true, // Necessary to indicate that the service is running in cluster mode
      },
    }
  );
  for (let i = 0; i < 4; i++) {
    cluster.fork({
      NODE_APP_INSTANCE: `MyOwnIdentifier-${i}`,
    });
  }
  await service.start(); // Even with resources registered, they will not be started
} else {
  const service = new ServiceRegistry();
  // Our business logic goes here
  service.register([myProvider, myResource, myService]);
  await service.start(); // This also starts the registered resources
}
```

## **Installation**

```bash
npm install @mdf.js/service-register
```

```bash
yarn add @mdf.js/service-register
```

## **Use**

To better understand how this module works, we will divide the documentation into several parts:

- **Parameterization Options**: Parameters that can be passed to the `ServiceRegistry` class constructor.
- **Module's Programmatic Interface**: How to access the module's functionalities from the code.
- **Module's REST-API Interface**: How to access the module's functionalities through a REST API.
- **Module's Control Interface**: How to control the module's functionalities through a control interface.

```typescript
import { ServiceRegistry } from '@mdf.js/service-registry';

const service = new ServiceRegistry(
  {
    configFiles: ['./config/config.json'],
    useEnvironment: true,
    loadReadme: true,
  },
  {
    loggerOptions: {
      console: {
        enabled: true,
        level: 'info',
      }
    },
    metadata: {
      name: 'service-registry',
      version: '1.0.0',
      description: 'Service registry, used for tooling microservices with observability and control capabilities.',
    }
    ...
  },
  {
    myOwnProperty: `myNeededValue`
  }
);
```

### **Parameterization Options**

- **BootstrapOptions**: Service bootstrap options, primarily allowing configuration of how the module **@mdf.js/service-registry** loads its settings, enabling loading from files, environment variables, or even the project's `package.json` file.
- **ServiceRegistryOptions**: Used as configuration values for the **@mdf.js/service-registry** module itself, such as the service name, version, description, etc. They override the default values or values loaded from other sources.
- **CustomOptions**: Custom options, used as configuration values for the service being developed. These values can be accessed through the `settings.custom` property of the `ServiceRegistry` object. These properties override the default values or values loaded from other sources.

#### **BootstrapOptions**

| Property         | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Default value                                                                                     |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `configFiles`    | `string[]` | List of files with deploying options to be loaded. The entries could be a file path or glob pattern. It supports configurations in JSON, YAML, TOML, and .env file formats. Check [**@mdf.js/service-setup-provider**](https://www.npmjs.com/package/@mdf.js/service-setup-provider) for more details.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `[]`                                                                                              |
| `presetFiles`    | `string[]` | List of files with preset options to be loaded. The entries could be a file path or glob pattern. The first part of the file name will be used as the preset name. The file name should be in the format of `presetName.config.json` or `presetName.config.yaml`. The name of the preset will be used to merge different files in order to create a single preset. Check [**@mdf.js/service-setup-provider**](https://www.npmjs.com/package/@mdf.js/service-setup-provider) for more details.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `[]`                                                                                              |
| `preset`         | `string`   | Preset to be used as configuration base, if none is indicated, or the indicated preset is not found, the configuration from the configuration files will be used. Check [**@mdf.js/service-setup-provider**](https://www.npmjs.com/package/@mdf.js/service-setup-provider) for more details.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `process.env['CONFIG_CUSTOM_PRESET']` `process.env['CONFIG_SERVICE_REGISTRY_PRESET']` `undefined` |
| `useEnvironment` | `boolean`  | Flag indicating that the environment configuration variables should be used. The configuration loaded by environment variables will be merged with the rest of the configuration, overriding the configuration from files, but not the configuration passed as argument to Service Registry. When option is set some filters are applied to the environment variables to avoid conflicts in the configuration.<br>The filters are:<br><br>- `CONFIG_METADATA_`: Application metadata configuration.<br>- `CONFIG_OBSERVABILITY_`: Observability service configuration.<br>- `CONFIG_LOGGER_`: Logger configuration.<br>- `CONFIG_RETRY_OPTIONS_`: Retry options configuration.<br>- `CONFIG_ADAPTER_`: Consumer adapter configuration.<br><br>The loader expect environment configuration variables represented in `SCREAMING_SNAKE_CASE`, that will parsed to `camelCase` and merged with the rest of the configuration. The consumer adapter configuration is an exception, due to the kind of configuration, it should be provided by configuration parameters. | `false`                                                                                           |
| `loadReadme`     | `boolean`  | Flag indicating that the README.md file should be loaded. If this flag is set to `true`, the module will scale parent directories looking for a `README.md` file to load, if the file is found, the README content will be exposed in the observability endpoints. If the flag is a string, the string will be used as the file name to look for.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `false`                                                                                           |
| `loadPackage`    | `boolean`  | lag indicating that the package.json file should be loaded. If this flag is set to `true`, the the module will scale parent directories looking for a `package.json` file to load, if the file is found, the package information will be used to fullfil the `metadata` field.<br><br>- `package.name` will be used as the `metadata.name`.<br>- `package.version` will be used as the `metadata.version`, and the first part of the version will be used as the `metadata.release`.<br>- `package.description` will be used as the `metadata.description`.<br>- `package.keywords` will be used as the `metadata.tags`.<br>- `package.config.${name}`, where `name` is the name of the configuration, will be used to find the rest of properties with the same name that in the metadata.<br><br>This information will be merged with the rest of the configuration, overriding the configuration from files, but not the configuration passed as argument to Service Registry.                                                                                  | `false`                                                                                           |
| `consumer`       | `boolean`  | Flag indicating if the OpenC2 Consumer command interface should be enabled. The command interface is a set of commands that can be used to interact with the application. The commands are exposed in the observability endpoints and can be used to interact with the service, or, if a consumer adapter is configured, to interact with the service from a central controller.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `false`                                                                                           |

#### **ServiceRegistryOptions**

- `metadata` (`Metadata`): Metadata information of the application or microservice. This information is used to identify the application in the logs, metrics, and traces... and is shown in the service observability endpoints.
  - **Properties**:
    - `name` (`string`): Name of the application or microservice.
    - `description` (`string`): Description of the application or microservice.
    - `version` (`string`): Version of the application or microservice.
    - `release` (`string`): Release of the application or microservice.
    - `instanceId` (`string`): Unique identifier of the application or microservice. This value is generated by the application if it is not provided.
    - `serviceId` (`string`): Human readable identifier of the application or microservice, should be unique in the system.
    - `serviceGroupId` (`string`): Group of the application or microservice to which it belongs.
    - `namespace` (`string`): Service namespace, used to identify declare which namespace the service belongs to. It must start with `x-` as it is a custom namespace and will be used for custom headers, openc2 commands, etc.
    - `tags` (`string[]`): Tags of the application or microservice.
    - `links`: service links to related services or resources.
      - `self` (`string`): Link to the service itself or the service observability endpoints.
      - `related` (`string`): Link to related services or resources of the service.
      - `about` (`string`): Link to the documentation of the service or the service README.
  - **Default value**:

    ```ts
    {
      name: 'mdf-app',
      version: '0.0.0',
      release: '0',
      description: undefined,
      instanceId: '12345678-1234-...', // This value is generated by the application
    }
    ```

- `consumerOptions` (`ConsumerOptions`): OpenC2 Consumer configuration options. This configuration is used to setup the OpenC2 consumer, ff this configuration is not provided the consumer will not be started. The consumer is used to receive OpenC2 commands from a central controller.
  - **Properties**:
    - `id` (`string`): Consumer identifier, used to identify the consumer in the system.
    - `maxInactivityTime` (`number`): Maximum time of inactivity before the consumer is stopped.
    - `registerLimit` (`number`): Maximum number of commands that can be registered at the same time.
    - `retryOptions` (`RetryOptions`): Retry options for the consumer.
    - `actionTargetPairs` (`ActionTargetPairs`): Action-Target pairs supported by the consumer. All the commands that are not in this list will be rejected, even if they has been included in the resolver map. If the command is only in this list, a `command` event will be emitted. Check below for more information.
    - `profiles` (`string[]`): Profiles supported by the consumer.
    - `actuator` (`string[]`): Actuator instance to be used by the consumer.
    - `resolver` (`ResolverMap`): Resolver map used by the consumer to resolve the commands. If a `namespace` is provided, a default resolver map will be included in order to provide a command interface for observability and control requests:
      - `query:${namespace}:health`: Query the health of the service.
      - `query:${namespace}:stats`: Query the metrics of the service.
      - `query:${namespace}:errors`: Query the errors of the service.
      - `query:${namespace}:config`: Query the configuration of the service.
      - `start:${namespace}:resources`: Start the resources of the service. (Only available if the service is NOT in cluster mode).
      - `stop:${namespace}:resources`: Stop the resources of the service. (Only available if the service is NOT in cluster mode).
      - `restart:${namespace}:all`: Kill the process, the service restart should be done by an external process manager.
  - **Default value**: `undefined`
- `adapterOptions` (`AdapterOptions`): Consumer adapter options: Redis or SocketIO. In order to configure the consumer instance, `consumer` and `adapter` options must be provided, in other case the consumer will start with a Dummy adapter with no connection to any external service, so only HTTP commands over the observability endpoints will be processed.
  - **Properties**:
    - `type` (`string`): Type of the adapter, could be `redis` or `socketio`.
    - `config` (`Redis.Config` | `SocketIO.Config`): Configuration options for the adapter, depending on the type of adapter. Check the documentations of the providers [**@mdf.js/redis-provider**](https://https://www.npmjs.com/package/@mdf.js/redis-provider) and [**@mdf.js/socket-client-provider**](https://www.npmjs.com/package/@mdf.js/socket-client-provider) for more details.
  - **Default value**: `undefined`
- `observabilityOptions` (`ObservabilityOptions`): Observability configuration options.
  - **Properties**:
    - `port` (`number`): Port of the observability server.
    - `primaryPort` (`number`): Primary port of the observability server in cluster mode, all the request to services over the `port` will be redirected to the primary port transparently.
    - `host` (`string`): Host of the observability server.
    - `isCluster` (`boolean`): Flag indicating that the service is running in cluster mode. If the service is running in cluster mode, the observability server will be started in all the instances of the cluster, but only the primary instance will be able to receive commands.
    - `includeStack` (`boolean`): Flag indicating that the stack trace should be included in the error register.
    - `clusterUpdateInterval` (`number`): Interval of time in milliseconds to update the cluster information.
    - `maxSize` (`number`): Maximum size of the error register.
  - **Default value**:
  
    ```ts
    {
      primaryPort: 9080,
      host: 'localhost',
      isCluster: false,
      includeStack: false,
      clusterUpdateInterval: 10000,
      maxSize: 100,
    }
    ```

- `loggerOptions` (`LoggerOptions`): Logger Options. If provided, a logger instance from the `@mdf.js/logger` package will be created and used by the application in all the internal services of the Application Wrapper. At the same time, the logger is exposed to the application to be used in the application services. If this options is not provided, a `Debug` logger will be used internally, but it will not be exposed to the application.
  - **Properties**: check the documentation of the package [@mdf.js/logger](https://www.npmjs.com/package/@mdf.js/logger).
  - **Default value**:

    ```ts
    {
      console: {
        enabled: true,
        level: 'info',
      },
      file: {
        enabled: false,
        level: 'info',
      },
    }
    ```

- `retryOptions` (`RetryOptions`): Retry options. If provided, the application will use this options to retry to start the services/resources registered in the Application Wrapped instance. If this options is not provided, the application will not retry to start the services/resources.
  - **Properties**: check the documentation of the package [@mdf.js/utils](https://www.npmjs.com/package/@mdf.js/utils).
  - **Default value**:
  
    ```ts
    {
      attempts: 3,
      maxWaitTime: 10000,
      timeout: 5000,
      waitTime: 1000,
    }
    ```

- `configLoaderOptions` (`ConfigLoaderOptions`): Configuration loader options. These options is used to load the configuration information of the application that is been wrapped by the Application Wrapper. This configuration could be loaded from files or environment variables, or even both.
  
  To understand the configuration loader options, check the documentation of the package [@mdf.js/service-setup-provider](https://www.npmjs.com/package/@mdf.js/service-setup-provider).
  >**Note**: Use different files for Application Wrapper configuration and for your own services to avoid conflicts.

  - **Properties**: check the documentation of the package [@mdf.js/service-setup-provider](https://www.npmjs.com/package/@mdf.js/service-setup-provider).
  - **Default value**:
  
      ```ts
      {
        configFiles: ['./config/custom/*.*'],
        presetFiles: ['./config/custom/presets/*.*'],
        schemaFiles: ['./config/custom/schemas/*.*'],
        preset: process.env['CONFIG_CUSTOM_PRESET'] || process.env['CONFIG_SERVICE_REGISTRY_PRESET'],
        useEnvironment: false,
        loadReadme: false,
        loadPackage: false,
      }
      ```

#### **CustomOptions**

These options are used to provide custom configuration to the services that are been wrapped by the Service Registry. These options are accessible through the `settings.custom` or `customSettings` property of the `ServiceRegistry` object. The options that you provide here will be merged with the rest of the configuration loaded based on the `configLoaderOptions`, being the last one the one that will override the rest of the configuration, in this way, you can create your own way to select the configuration that you want to use in your services, besides the use of the integrated [@mdf.js/service-setup-provider](https://www.npmjs.com/package/@mdf.js/service-setup-provider) for this purpose.

### **Module's Programmatic Interface**

- **Properties**:
  - `errors` (`ErrorRecord[]`): Errors recorded by the application, the maximum size of the error register is defined by the `maxSize` option in the `observabilityOptions`.
  - `health` (`Layer.App.Health`): Health object, check the documentation of the package [@mdf.js/core](https://www.npmjs.com/package/@mdf.js/core) for more details.
  - `status` (`Health.Status`): Service status, check the documentation of the package [@mdf.js/core](https://www.npmjs.com/package/@mdf.js/core) for more details.
  - `serviceRegistrySettings` (`ServiceRegistrySettings`): final configuration parameters which are used by the service registry.
  - `customSettings` (`CustomSettings`): final result of the custom parameters.
  - `settings` (`ServiceSetting`): final result of the settings.
- **Methods**:
  - `register(resource: Layer.Observable | Layer.Observable[]): void`: Register a resource or an array of resources to the observability services of the application. If the resource fullfil the `Layer.App.Resource` or `Layer.App.Service` interfaces, the resource will be started when the application starts. Check the documentation of the package [@mdf.js/core](https://www.npmjs.com/package/@mdf.js/core) for more details.
  - `get<T>(path: string | string[], defaultValue: T): T | undefined`: Get a configuration value by path from the settings. If the path is not found, the default value will be returned.
  - `get<P extends keyof CustomSettings>(key: P, defaultValue: CustomSettings[P]): CustomSettings[P] | undefined`: Get a custom configuration value by key from the custom settings. If the key is not found, the default value will be returned.
  - `async start(): Promise<void>`: Start the application, this method will start all the resources registered in the application. If the application is running in cluster mode, only the primary instance will start the resources.
  - `async stop(): Promise<void>`: Stop the application, this method will stop all the resources registered in the application. If the application is running in cluster mode, only the primary instance will stop the resources.
- **Events**:
  - `on(event: 'command', listener: (job: CommandJobHandler) => void): this`: Event emitted when a command is received by the consumer. The event listener will receive a `CommandJobHandler` object with the command information. See below for more information.

### **Module's REST-API Interface**

By default the observability server is started in the port `9080`, over the `localhost`. The observability server exposes the following endpoints:

- `http://${host}:${port}/v${release}/health`: Health check endpoint, returns the health of the service.
- `http://${host}:${port}/v${release}/metrics?json=true`: Metrics endpoint, returns the metrics of the service in Prometheus format, if the query parameter `json=true` is provided, the metrics will be returned in JSON format.
- `http://${host}:${port}/v${release}/registry`: Errors endpoint, returns the errors registered by the service, the maximum size of the error register is defined by the `maxSize` option in the `observabilityOptions`.

If a consumer adapter is configured, the observability server will expose the following endpoints:

- `http://${host}:${port}/v${release}/openc2/command`: OpenC2 command interface, used to send OpenC2 commands to the service. See below for more information.
- `http://${host}:${port}/v${release}/openc2/jobs`: OpenC2 jobs interface, used to query the jobs registered by the service.
- `http://${host}:${port}/v${release}/openc2/pendingJobs`: OpenC2 pending jobs interface, used to query the pending jobs registered by the service.
- `http://${host}:${port}/v${release}/openc2/messages`: OpenC2 messages interface, used to query the messages registered by the service.

If the user register a service that fullfil the `Layer.App.Service` interface, including the `Links` and `Router` properties, the service will be started when the application starts, and the service will be exposed in the observability endpoints. Check the documentation of the package [@mdf.js/core](https://www.npmjs.com/package/@mdf.js/core) for more details.

### **Module's Control Interface**

The **@mdf.js/service-registry** module use the [OpenC2](https://openc2.org/) as Command and Control Interface (CCI).

This interface are based on the two modules of **@mdf.js**:
- **@mdf.js/openc2-core**: module that implement the OpenC2 core specification for Consumer, Provider and Gateway entities, not attached to any transport layer.
- **@mdf.js/openc2**: module that implement a tooling interface, to allow the use of OpenC2 entities over several transport layers: MQTT, Redis Pub/Sub, AMQP, SocketIO ...

Please check the documentation of the packages [@mdf.js/openc2](https://www.npmjs.com/package/@mdf.js/openc2) and [@mdf.js/openc2-core](https://www.npmjs.com/package/@mdf.js/openc2-core), and the OpenC2 specification for more details.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.