# **@mdf.js**

[![Node Version](https://img.shields.io/static/v1?style=flat\&logo=node.js\&logoColor=green\&label=node\&message=%3E=20\&color=blue)](https://nodejs.org/en/)
[![Typescript Version](https://img.shields.io/static/v1?style=flat\&logo=typescript\&label=Typescript\&message=5.4\&color=blue)](https://www.typescriptlang.org/)
[![Known Vulnerabilities](https://img.shields.io/static/v1?style=flat\&logo=snyk\&label=Vulnerabilities\&message=0\&color=300A98F)](https://snyk.io/package/npm/snyk)

<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <div style="text-align:center;background-image:radial-gradient(circle farthest-corner at 50% 50%, #104c60, #0c0c13);">
    <img src="https://assets.website-files.com/626a3ef32d23835d9b2e4532/6290ab1e2d3e0d922913a6e3_digitalizacion_ENG.svg"alt="netin"width="500">
  </div>
</p>

<h1 style="text-align:center;margin-bottom:0">Mytra Development Framework - @mdf.js </h1>
<h5 style="text-align:center;margin-top:0">Typescript tools for development</h5>

<!-- markdownlint-enable MD033 -->

***

## **Table of contents**

- [**@mdf.js**](#mdfjs)
  - [**Table of contents**](#table-of-contents)
  - [**Introduction**](#introduction)
  - [**Installation**](#installation)
  - [**Information**](#information)
  - [**Use**](#use)
  - [**License**](#license)
  - [**Keygen: Detailed Explanation of Key Generation**](#keygen-detailed-explanation-of-key-generation)
    - [**Overview**](#overview)
    - [**Placeholders**](#placeholders)
      - [**Predefined Placeholders**](#predefined-placeholders)
      - [**Custom Placeholders**](#custom-placeholders)
    - [**Keygen Options**](#keygen-options)
  - [Usage](#usage)
    - [Importing the Keygen Class](#importing-the-keygen-class)
    - [Creating an Instance](#creating-an-instance)
    - [Generating a Key](#generating-a-key)
  - [Examples](#examples)
    - [Example 1: Default Behavior](#example-1-default-behavior)
    - [Example 2: Custom File and Key Patterns](#example-2-custom-file-and-key-patterns)
    - [Example 3: Applying Default Values](#example-3-applying-default-values)
    - [Example 4: Using Date Placeholders](#example-4-using-date-placeholders)
    - [Example 5: Advanced Customization](#example-5-advanced-customization)
  - [Error Handling](#error-handling)
    - [Filename Does Not Match Pattern](#filename-does-not-match-pattern)
    - [Placeholder Not Found in Values](#placeholder-not-found-in-values)
  - [Logging and Debugging](#logging-and-debugging)
  - [Class Reference](#class-reference)
    - [Constructor](#constructor)
    - [Methods](#methods)
      - [`generateKey(filePath: string): string`](#generatekeyfilepath-string-string)
  - [Interfaces](#interfaces)
    - [`KeygenOptions`](#keygenoptions)
  - [Tips and Best Practices](#tips-and-best-practices)
  - [Conclusion](#conclusion)
  - [Additional Resources](#additional-resources)
  - [Support](#support)

## **Introduction**

## **Installation**

## **Information**

## **Use**

## **License**

Copyright 2024 Mytra Control S.L. All rights reserved.

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.

## **Keygen: Detailed Explanation of Key Generation**

When a file is processed, a identification key is generated in order to identify this "pack" of information in the upper layers of the platform. This key is generated based on the file name, through customizable patterns, which use placeholders to extract values from the file name or generate them at runtime.

### **Overview**

The key generation process involves the following steps:

1. **Parsing the File Name**: Extract placeholders from the file name using a specified file pattern.
2. **Generating Placeholders**: Create a set of predefined placeholders based on the current date and time.
3. **Merging Placeholders**: Combine default values, parsed placeholders, and generated placeholders into a single set.
4. **Generating the Key**: Replace placeholders in the key pattern with actual values from the merged placeholders.

### **Placeholders**

Placeholders are enclosed in curly braces `{}` and are used in both the file pattern and key pattern. They are replaced with actual values during the key generation process.

#### **Predefined Placeholders**

The following placeholders are available by default:

- `{_filename}`: The name of the file without its extension.
- `{_extension}`: The file extension (including the dot).
- `{_timestamp}`: The current timestamp in milliseconds.
- `{_date}`: The current date in `YYYY-MM-DD` format.
- `{_time}`: The current time in `HH:mm:ss` format.
- `{_datetime}`: The current date and time in `YYYY-MM-DD_HH-mm-ss` format.
- `{_year}`: The current year.
- `{_month}`: The current month (zero-padded).
- `{_day}`: The current day of the month (zero-padded).
- `{_hour}`: The current hour (zero-padded).
- `{_minute}`: The current minute (zero-padded).
- `{_second}`: The current second (zero-padded).

#### **Custom Placeholders**

You can define custom placeholders by specifying them in the `filePattern`. These placeholders will extract corresponding values from the file name.

**Example**:

- **File Name**: `sensor1_temperature_2023-10-24.jsonl`
- **File Pattern**: `{sensor}_{measurement}_{date}.jsonl`
- **Placeholders Extracted**: `sensor`, `measurement`, `date`

### **Keygen Options**

The `Keygen` class accepts an optional `options` object to customize its behavior:

- **`filePattern`**: A pattern to match and parse the file name.
- **`keyPattern`**: A pattern to generate the key using placeholders.
- **`defaultValues`**: An object containing default values for placeholders not found in the file name.

**Default Options**:

```typescript
const DEFAULT_KEY_GEN_OPTIONS: Required<KeygenOptions> = {
  filePattern: '*',              // Matches any file
  keyPattern: '{_filename}',     // Uses the file name without extension as the key
  defaultValues: {},             // No default values
};
```

## Usage

### Importing the Keygen Class

```typescript
import { Keygen } from './Keygen';
import type { KeygenOptions } from './types';
```

### Creating an Instance

```typescript
const keygen = new Keygen(options);
```

- **`options`**: An object conforming to the `KeygenOptions` interface (optional).

### Generating a Key

```typescript
const key = keygen.generateKey('/path/to/yourfile.txt');
```

- **`filePath`**: The path to the file for which the key is to be generated.

## Examples

### Example 1: Default Behavior

**Description**: Generate a key using default settings.

**Code**:

```typescript
const keygen = new Keygen();
const key = keygen.generateKey('/path/to/myfile.txt');
console.log(key); // Output: 'myfile'
```

**Explanation**:

- **File Pattern**: Matches any file (`'*'`).
- **Key Pattern**: `{_filename}` (uses the file name without extension).
- **Result**: The key is `'myfile'`.

### Example 2: Custom File and Key Patterns

**Description**: Generate a key by extracting custom placeholders from the file name.

**Options**:

```typescript
const options: KeygenOptions = {
  filePattern: '{sensor}_{measurement}_{date}.jsonl',
  keyPattern: '{sensor}/{measurement}/{date}',
};
```

**Code**:

```typescript
const keygen = new Keygen(options);
const key = keygen.generateKey('/path/to/sensor1_temperature_2023-10-24.jsonl');
console.log(key); // Output: 'sensor1/temperature/2023-10-24'
```

**Explanation**:

- **File Pattern**: `{sensor}_{measurement}_{date}.jsonl` extracts `sensor`, `measurement`, and `date` from the file name.
- **Key Pattern**: `{sensor}/{measurement}/{date}` constructs the key using the extracted values.

### Example 3: Applying Default Values

**Description**: Use default values for placeholders not present in the file name.

**Options**:

```typescript
const options: KeygenOptions = {
  filePattern: '{sensor}_{measurement}_{date}.jsonl',
  keyPattern: '{sensor}/{measurement}/{date}/{location}',
  defaultValues: { location: 'defaultLocation' },
};
```

**Code**:

```typescript
const keygen = new Keygen(options);
const key = keygen.generateKey('/path/to/sensor1_temperature_2023-10-24.jsonl');
console.log(key); // Output: 'sensor1/temperature/2023-10-24/defaultLocation'
```

**Explanation**:

- **Default Values**: `{ location: 'defaultLocation' }` provides a value for the `location` placeholder.
- **Result**: The key includes `'defaultLocation'` since `location` is not extracted from the file name.

### Example 4: Using Date Placeholders

**Description**: Generate a key that includes current date components.

**Options**:

```typescript
const options: KeygenOptions = {
  filePattern: '{sensor}_{measurement}.jsonl',
  keyPattern: '{sensor}/{measurement}/{_year}/{_month}/{_day}',
};
```

**Code**:

```typescript
const keygen = new Keygen(options);
const key = keygen.generateKey('/path/to/sensor1_temperature.jsonl');
console.log(key); // Output: 'sensor1/temperature/2023/10/24' // Date components will vary
```

**Explanation**:

- **Date Placeholders**: `{_year}`, `{_month}`, `{_day}` are replaced with current date components.
- **Result**: The key includes the current date.

### Example 5: Advanced Customization

**Description**: Generate a key using complex file patterns and default values.

**File Details**:

- **File Name**: `mySensor_flowMeter1_2024-12-30_2024-12-31.jsonl`
- **File Pattern**: `{sensor}_{measurement}_{year}-{month}-{day}_{end}`
- **Default Values**: `{ source: 'myFileFlinger1' }`
- **Key Pattern**: `{sensor}/{measurement}/{year}/{month}/{day}/data_{source}`

**Code**:

```typescript
const options: KeygenOptions = {
  filePattern: '{sensor}_{measurement}_{year}-{month}-{day}_{end}',
  keyPattern: '{sensor}/{measurement}/{year}/{month}/{day}/data_{source}',
  defaultValues: { source: 'myFileFlinger1' },
};

const keygen = new Keygen(options);
const key = keygen.generateKey('/path/to/mySensor_flowMeter1_2024-12-30_2024-12-31.jsonl');
console.log(key); // Output: 'mySensor/flowMeter1/2024/12/30/data_myFileFlinger1'
```

**Explanation**:

- **Custom Placeholders**: Extracts `sensor`, `measurement`, `year`, `month`, `day`, and `end`.
- **Default Values**: Provides `source` placeholder.
- **Result**: Constructs a detailed key using both extracted and default values.

## Error Handling

The `Keygen` class throws errors when it encounters issues during key generation.

### Filename Does Not Match Pattern

If the file name does not match the specified `filePattern`, a `Crash` error is thrown.

**Example**:

```typescript
const options: KeygenOptions = {
  filePattern: '{sensor}_{measurement}_{date}.jsonl',
};

const keygen = new Keygen(options);

try {
  keygen.generateKey('/path/to/invalid_filename.jsonl');
} catch (error) {
  console.error(error.message);
  // Output: 'Filename [invalid_filename.jsonl] does not match the pattern [{sensor}_{measurement}_{date}.jsonl]'
}
```

### Placeholder Not Found in Values

If a placeholder in the `keyPattern` is not found in the merged placeholders (parsed values, default values, or predefined placeholders), a `Crash` error is thrown.

**Example**:

```typescript
const options: KeygenOptions = {
  filePattern: '{sensor}_{measurement}_{date}.jsonl',
  keyPattern: '{sensor}/{measurement}/{date}/{unknown}',
};

const keygen = new Keygen(options);

try {
  keygen.generateKey('/path/to/sensor1_temperature_2023-10-24.jsonl');
} catch (error) {
  console.error(error.message);
  // Output: 'Error generating a key based on pattern [{sensor}/{measurement}/{date}/{unknown}] for file [sensor1_temperature_2023-10-24.jsonl]: Placeholder [unknown] not found in values'
}
```

## Logging and Debugging

The `Keygen` class includes logging capabilities for development and troubleshooting.

- **Logger Instance**: You can provide a custom logger by passing it as the second parameter in the constructor.
- **Debug Messages**: The class logs detailed debug messages, including generated placeholders and keys.
- **Error Messages**: Errors include detailed messages to aid in debugging.

**Example**:

```typescript
import { DebugLogger } from '@mdf.js/logger';

const logger = new DebugLogger('KeygenLogger');
const keygen = new Keygen(options, logger);
```

## Class Reference

### Constructor

```typescript
constructor(options?: KeygenOptions, logger?: LoggerInstance)
```

- **`options`**: An object conforming to the `KeygenOptions` interface.
- **`logger`**: An optional logger instance for debugging.

### Methods

#### `generateKey(filePath: string): string`

Generates a key for the given file path.

- **Parameters**:
  - `filePath`: The path to the file.
- **Returns**:
  - A string representing the generated key.
- **Throws**:
  - `Crash` error if the file name doesn't match the pattern or if placeholders are missing.

## Interfaces

### `KeygenOptions`

```typescript
interface KeygenOptions {
  filePattern?: string;
  keyPattern?: string;
  defaultValues?: Record<string, string>;
}
```

- **`filePattern`**: Pattern to parse the file name.
- **`keyPattern`**: Pattern to generate the key.
- **`defaultValues`**: Default values for placeholders.

## Tips and Best Practices

- **Always Define `filePattern` and `keyPattern`**: While defaults exist, specifying these patterns ensures that key generation aligns with your requirements.
- **Use Consistent Placeholders**: Ensure that placeholders used in `keyPattern` are either extracted from the file name, provided as default values, or are predefined placeholders.
- **Handle Errors Gracefully**: Wrap key generation in try-catch blocks to handle potential errors, especially when dealing with dynamic file names.
- **Test Patterns Thoroughly**: Use unit tests to verify that your patterns correctly parse file names and generate the expected keys.

## Conclusion

The `Keygen` class offers a flexible and powerful way to generate keys for files based on customizable patterns. By leveraging placeholders and default values, you can tailor the key generation process to fit a wide range of scenarios.

Whether you need simple keys based on file names or complex keys that incorporate metadata and timestamps, the `Keygen` class can be configured to meet your needs.

## Additional Resources

- **Source Code**: Refer to the `Keygen` class source code for implementation details.
- **Unit Tests**: Review the provided unit tests for examples of how to use the class and validate its behavior.

## Support

If you encounter issues or have questions, please reach out to the maintainers or consult the project documentation for further assistance.

***

*Note: Replace `'./Keygen'` and `'./types'` with the actual paths to your `Keygen` class and types in your project.*
