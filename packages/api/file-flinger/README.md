# **@mdf.js/file-flinger**

[![Node Version](https://img.shields.io/static/v1?style=flat&logo=node.js&logoColor=green&label=node&message=%3E=20&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat&logo=typescript&label=Typescript&message=5.4&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat&logo=snyk&label=Vulnerabilities&message=0&color=300A98F)](https://snyk.io/package/npm/snyk)
[![Documentation](https://img.shields.io/static/v1?style=flat&logo=markdown&label=Documentation&message=API&color=blue)](https://mytracontrol.github.io/mdf.js/)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg" alt="netin" width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js/file-flinger</h1>
<h5 style="text-align:center;margin-top:0">Module designed to facilitate data file processing for cold path ingestion</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js/file-flinger**](#mdfjsfile-flinger)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Use**](#use)
    - [**Creating a Pusher**](#creating-a-pusher)
    - [**Event Handling**](#event-handling)
    - [**FileFlinger Configuration and Lifecycle**](#fileflinger-configuration-and-lifecycle)
    - [**Metrics and Health Checks**](#metrics-and-health-checks)
    - [**Keygen: Detailed Explanation of Key Generation**](#keygen-detailed-explanation-of-key-generation)
      - [**Overview**](#overview)
      - [**Placeholders**](#placeholders)
        - [**Predefined Placeholders**](#predefined-placeholders)
        - [**Custom Placeholders**](#custom-placeholders)
      - [**Keygen Options**](#keygen-options)
      - [**Examples**](#examples)
        - [**Example 1: Default Behavior**](#example-1-default-behavior)
        - [**Example 2: Custom File and Key Patterns**](#example-2-custom-file-and-key-patterns)
        - [**Example 3: Applying Default Values**](#example-3-applying-default-values)
        - [**Example 4: Using Date Placeholders**](#example-4-using-date-placeholders)
        - [**Example 5: Advanced Customization**](#example-5-advanced-customization)
      - [**Error Handling**](#error-handling)
      - [**Tips and Best Practices**](#tips-and-best-practices)
  - [**License**](#license)

## **Introduction**

**@mdf.js/file-flinger** is a robust module within the `@mdf.js` ecosystem, designed to facilitate customized data file processing workflows for cold path ingestion. It provides a versatile framework for constructing file processing pipelines, enabling developers to define custom pushers to deliver data files to various destinations.

Before delving into the documentation, it is essential to understand the core concepts within `@mdf.js/file-flinger`:

- **Keygen**: A key generation utility that creates unique identifiers for processed files based on customizable patterns. This feature is crucial for tracking and managing data files across the platform by generating consistent and meaningful identifiers.
- **Pusher**: A pusher is a component that sends processed files to a specific destination. Developers can create custom pushers to integrate with various data storage solutions, such as databases, cloud storage, or data lakes. The file-flinger module supports multiple pushers, allowing users to define different destinations for processed files concurrently.
- **Watcher**: The watcher module monitors directories for incoming files and triggers processing workflows when new files are detected. It plays a pivotal role in automating data ingestion tasks by initiating processing as soon as new data arrives.
- **Post-processing tasks**: After processing a file, it is possible to execute a set of tasks to clean up the file system, move files to another location, archive them, or perform other operations. This post-processing can be different for completed and failed files, providing flexibility in handling different outcomes.

## **Installation**

- **npm**:

  ```bash
  npm install @mdf.js/file-flinger
  ```

- **yarn**:

  ```bash
  yarn add @mdf.js/file-flinger
  ```

## **Use**

### **Creating a Pusher**

To build a file processing workflow, you need to create custom pushers that send processed files to specific destinations. A pusher is responsible for delivering files to storage systems like databases, cloud storage, or data lakes.

To create a pusher, you need to define a class that implements the `Pusher` interface. This interface extends `Layer.App.Resource`, which provides methods and properties for managing the resource lifecycle and health status.

When implementing a pusher, you should ensure the following:

- **Lifecycle Methods**: Implement `start()`, `stop()`, and `close()` methods to manage the pusher's lifecycle.
- **Push Method**: Implement the `push(filePath: string, key: string)` method, which handles the logic to send the file to the destination using the provided file path and key.
- **Metrics**: Provide a `metrics` getter that returns a Prometheus `Registry` containing the pusher's metrics.
- **Health Status**: Provide `status` and `checks` getters that return the pusher's health status and checks, which are crucial for monitoring the pusher's health.

If you are using the `@mdf.js` framework to create your pusher, you can integrate the pusher's health information with the provider's health information.

Here is an example of a custom pusher class:

```typescript
import { EventEmitter } from 'events';
import { Pusher } from '@mdf.js/file-flinger';
import { Registry } from 'prom-client';
import { Health } from '@mdf.js/core';

// Class that implements the Pusher interface
class MyCustomPusher extends EventEmitter implements Pusher {
  /** Constructor */
  constructor() {
    super();
  }

  /**
   * Push the file to the storage
   * @param filePath - The file path to push
   * @param key - The key to use
   */
  public async push(filePath: string, key: string): Promise<void> {
    // Implementation of file pushing logic
  }

  /** Start the pusher and the underlying provider */
  public async start(): Promise<void> {
    // Initialization logic
  }

  /** Stop the pusher and the underlying provider */
  public async stop(): Promise<void> {
    // Graceful shutdown logic
  }

  /** Stop the pusher and the underlying provider and clean the resources */
  public async close(): Promise<void> {
    // Cleanup logic
  }

  /** Prometheus registry to store the metrics of the pusher */
  public get metrics(): Registry {
    // Return Prometheus registry with pusher metrics
    return new Registry();
  }

  /** Pusher health status */
  public get status(): Health.Status {
    // Return health status
    return 'pass';
  }

  /** Pusher health checks */
  public get checks(): Health.Checks {
    // Return object with health checks
    return {};
  }
}
```

### **Event Handling**

The `FileFlinger` class extends `EventEmitter` and emits several events that you can listen to:

- `error`: Emitted when the component detects an error.

  ```typescript
  fileFlinger.on('error', (error) => {
    console.error('An error occurred:', error);
  });
  ```

- `status`: Emitted when the component's status changes.

  ```typescript
  fileFlinger.on('status', (status) => {
    console.log('FileFlinger status:', status);
  });
  ```

### **FileFlinger Configuration and Lifecycle**

To instantiate a `FileFlinger`, you need to provide a name and an options object that configures its behavior. The options include:

- **`pushers`**: An array of pushers that will be used to send files to their destinations.
- **`watchPath`**: The path or array of paths to monitor for incoming files.
- **`filePattern`** (default: `undefined`): A glob pattern or custom pattern to match the files to be processed.
- **`keyPattern`** (default: `{_filename}`): A pattern used by the key generator (`Keygen`) to create unique keys for the files.
- **`defaultValues`** (default: `{}`): An object containing default values for placeholders used in patterns.
- **`cwd`** (default: `undefined`): The base directory for relative paths.
- **`maxErrors`** (default: `10`): The maximum number of errors to store in the error list.
- **`retryDelay`** (default: `30000`): Delay in milliseconds between retries for failed file processing operations.
- **`archiveFolder`** (default: `undefined`): The directory where processed files will be moved if the post-processing strategy is `archive` or `zip`.
- **`deadLetterFolder`** (default: `undefined`): The directory where files with processing errors will be moved if the error strategy is `dead-letter`.
- **`postProcessingStrategy`** (default: `'delete'`): Strategy for handling files after successful processing. Options are:
  - `'delete'`: Delete the file.
  - `'archive'`: Move the file to the `archiveFolder`.
  - `'zip'`: Compress the file and move it to the `archiveFolder`.
- **`errorStrategy`** (default: `'delete'`): Strategy for handling files that encountered errors during processing. Options are:
  - `'delete'`: Delete the file.
  - `'ignore'`: Leave the file as is.
  - `'dead-letter'`: Move the file to the `deadLetterFolder`.
- **`retryOptions`**: Configuration for retrying file operations. Includes:
  - **`attempts`** (default: `3`): Number of retry attempts.
  - **`maxWaitTime`** (default: `60000`): Maximum total wait time in milliseconds between retries.
  - **`timeout`** (default: `10000`): Timeout in milliseconds for each retry attempt.
  - **`waitTime`** (default: `1000`): Initial wait time in milliseconds between retries, which may be increased based on a backoff strategy.

Here's how to create a `FileFlinger` instance with custom options:

```typescript
import { FileFlinger } from '@mdf.js/file-flinger';

const fileFlinger = new FileFlinger('MyFileFlinger', {
  pushers: [/* Your custom pushers */],
  watchPath: '/path/to/watch',
  filePattern: '{sensor}_{measurement}_{date}.jsonl',
  keyPattern: '{sensor}/{measurement}/{date}',
  defaultValues: {},
  cwd: process.cwd(),
  maxErrors: 10,
  retryDelay: 30000,
  archiveFolder: '/path/to/archive',
  deadLetterFolder: '/path/to/dead-letter',
  postProcessingStrategy: 'archive',
  errorStrategy: 'dead-letter',
  retryOptions: {
    attempts: 3,
    maxWaitTime: 60000,
    timeout: 10000,
    waitTime: 1000,
  },
});
```

To manage the lifecycle of the `FileFlinger`, you can use the following methods:

- `start(): Promise<void>`: Starts the `FileFlinger`, initializing all watchers and pushers, and begins processing files as they arrive.
- `stop(): Promise<void>`: Stops the `FileFlinger`, gracefully shutting down all watchers and pushers.
- `close(): Promise<void>`: Stops the `FileFlinger` and cleans up all resources, including closing any open file handles or network connections.

Example:

```typescript
// Start the FileFlinger
await fileFlinger.start();

// The FileFlinger is now monitoring for files and processing them.

// When you need to stop the FileFlinger
await fileFlinger.stop();

// If you want to completely close and clean up resources
await fileFlinger.close();
```

### **Metrics and Health Checks**

The `FileFlinger` class includes a Prometheus `Registry` to store metrics related to the file processing pipeline. These metrics can be used to monitor the performance and health of the system.

Default metrics included in the `FileFlinger` are:

- `api_all_job_processed_total`: The total number of jobs processed, labeled by `type`.
- `api_all_errors_job_processing_total`: The total number of errors encountered during job processing, labeled by `type`.
- `api_all_job_in_processing_total`: The number of jobs currently being processed, labeled by `type`.
- `api_publishing_job_duration_milliseconds`: The duration of file processing jobs in milliseconds, labeled by `type`.

The `type` label typically represents the key generated for the file, allowing you to categorize metrics by file type or other meaningful identifiers.

Pushers should also provide metrics and health information. They should implement the `metrics`, `status`, and `checks` properties:

- **`metrics`**: Returns a Prometheus `Registry` with the pusher's metrics.
- **`status`**: Returns the health status of the pusher (`'pass'` or `'fail'`).
- **`checks`**: Returns an object containing detailed health checks for the pusher.

You can access the `FileFlinger`'s metrics and health information:

```typescript
// Access metrics
const metricsRegistry = fileFlinger.metrics;

// Access health status and checks
const fileFlingerStatus = fileFlinger.status;
const fileFlingerChecks = fileFlinger.checks;
```

### **Keygen: Detailed Explanation of Key Generation**

The `Keygen` utility is responsible for generating unique and meaningful identifiers (keys) for processed files. These keys are used to identify and track files within the system and are crucial for organizing data in storage destinations.

#### **Overview**

The key generation process involves:

1. **Parsing the File Name**: Extract placeholders from the file name using a specified `filePattern`.
2. **Generating Predefined Placeholders**: Create a set of predefined placeholders based on the current date and time.
3. **Merging Placeholders**: Combine default values, parsed placeholders, and predefined placeholders into a single set.
4. **Generating the Key**: Replace placeholders in the `keyPattern` with actual values from the merged placeholders to produce the final key.

#### **Placeholders**

Placeholders are enclosed in curly braces `{}` and are used in both the `filePattern` and `keyPattern`. They are replaced with actual values during key generation.

##### **Predefined Placeholders**

The following placeholders are available by default:

- `{_filename}`: The base name of the file without its extension.
- `{_extension}`: The file extension (including the dot), e.g., `.jsonl`.
- `{_timestamp}`: The current timestamp in milliseconds since the Unix epoch.
- `{_date}`: The current date in `YYYY-MM-DD` format.
- `{_time}`: The current time in `HH:mm:ss` format.
- `{_datetime}`: The current date and time in `YYYY-MM-DD_HH-mm-ss` format.
- `{_year}`: The current year as a four-digit number.
- `{_month}`: The current month as a two-digit number (01-12).
- `{_day}`: The current day of the month as a two-digit number (01-31).
- `{_hour}`: The current hour as a two-digit number (00-23).
- `{_minute}`: The current minute as a two-digit number (00-59).
- `{_second}`: The current second as a two-digit number (00-59).

##### **Custom Placeholders**

You can define custom placeholders by specifying them in the `filePattern`. These placeholders extract corresponding values from the file name.

**Example**:

- **File Name**: `sensor1_temperature_2023-10-24.jsonl`
- **File Pattern**: `{sensor}_{measurement}_{date}.jsonl`
- **Extracted Placeholders**: `sensor`, `measurement`, `date`

#### **Keygen Options**

The `Keygen` class accepts an `options` object to customize its behavior:

- **`filePattern`**: A pattern used to parse the file name and extract placeholders.
- **`keyPattern`**: A pattern used to generate the key by replacing placeholders with actual values.
- **`defaultValues`**: An object containing default values for placeholders that may not be present in the file name.

**Default Options**:

```typescript
const DEFAULT_KEY_GEN_OPTIONS: Required<KeygenOptions> = {
  filePattern: '*',              // Matches any file name
  keyPattern: '{_filename}',     // Uses the file name without extension as the key
  defaultValues: {},             // No default values provided
};
```

#### **Examples**

##### **Example 1: Default Behavior**

**Description**: Generate a key using default settings.

```yaml
# filePattern: undefined
keyPattern: '{_filename}'
# defaultValues: {}
```

- **Filename**: `myfile.txt`
- **Key**: `myfile`

**Explanation**:

- Since `filePattern` is `undefined`, any file name matches.
- The `keyPattern` `{_filename}` uses the file name without the extension.
- The key generated is `'myfile'`.

##### **Example 2: Custom File and Key Patterns**

**Description**: Generate a key by extracting custom placeholders from the file name.

```yaml
filePattern: '{sensor}_{measurement}_{date}.jsonl'
keyPattern: '{sensor}/{measurement}/{date}'
# defaultValues: {}
```

- **Filename**: `sensor1_temperature_2023-10-24.jsonl`
- **Key**: `sensor1/temperature/2023-10-24`

**Explanation**:

- The `filePattern` extracts `sensor`, `measurement`, and `date` from the file name.
- The `keyPattern` constructs the key using these placeholders.

##### **Example 3: Applying Default Values**

**Description**: Use default values for placeholders not present in the file name.

```yaml
filePattern: '{sensor}_{measurement}_{date}.jsonl'
keyPattern: '{sensor}/{measurement}/{date}/{location}'
defaultValues:
  location: 'defaultLocation'
```

- **Filename**: `sensor1_temperature_2023-10-24.jsonl`
- **Key**: `sensor1/temperature/2023-10-24/defaultLocation`

**Explanation**:

- The `location` placeholder is not present in the file name.
- The `defaultValues` provide a value for `location`.

##### **Example 4: Using Date Placeholders**

**Description**: Generate a key that includes current date components.

```yaml
filePattern: '{sensor}_{measurement}.jsonl'
keyPattern: '{sensor}/{measurement}/{_year}/{_month}/{_day}'
# defaultValues: {}
```

- **Filename**: `sensor1_temperature.jsonl`
- **Key**: `sensor1/temperature/2024/11/03`

**Explanation**:

- The placeholders `{_year}`, `{_month}`, `{_day}` are replaced with the current date components.

##### **Example 5: Advanced Customization**

**Description**: Generate a key using complex file patterns and default values.

```yaml
filePattern: '{sensor}_{measurement}_{year}-{month}-{day}_{end}.jsonl'
keyPattern: '{sensor}/{measurement}/{year}/{month}/{day}/data_{source}'
defaultValues:
  source: 'myFileFlinger1'
```

- **Filename**: `mySensor_flowMeter1_2024-12-30_2024-12-31.jsonl`
- **Key**: `mySensor/flowMeter1/2024/12/30/data_myFileFlinger1`

**Explanation**:

- Custom placeholders `sensor`, `measurement`, `year`, `month`, `day`, and `end` are extracted from the file name.
- The `source` placeholder is provided via `defaultValues`.

#### **Error Handling**

During key generation, some errors can occur. These errors are emitted as `error` events and can be handled by listening to the `FileFlinger`'s `error` event.

- **Filename Does Not Match Pattern**: If the file name does not match the `filePattern`, an error is emitted.

  **Error Message**: `'Filename [invalid_filename.jsonl] does not match the pattern [{sensor}_{measurement}_{date}.jsonl]'`

- **Placeholder Not Found in Values**: If a placeholder in the `keyPattern` is not found in the merged placeholders, an error is emitted.

  **Error Message**: `'Error generating a key based on pattern [{sensor}/{measurement}/{date}/{unknown}] for file [sensor1_temperature_2023-10-24.jsonl]: Placeholder [unknown] not found in values'`

#### **Tips and Best Practices**

- **Define Both `filePattern` and `keyPattern`**: Explicitly specify these patterns to ensure keys are generated as expected.
- **Ensure Consistency**: Make sure placeholders used in `keyPattern` are either extracted from the file name, provided in `defaultValues`, or are predefined placeholders.
- **Test Your Patterns**: Validate your patterns with various file names to ensure they work correctly.
- **Handle Errors Gracefully**: Implement error handling for key generation errors to prevent processing failures.

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.