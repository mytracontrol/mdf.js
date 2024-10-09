/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { RetryOptions } from '@mdf.js/utils';

/** Represents the options for the JsonlFileStoreManager */
export interface ArchiveOptions {
  /**
   * Separator to use when writing the data to the file
   * @example '\n'
   * @default '\n'
   */
  separator?: string;
  /**
   * If set, this property will be used to store the data in the file, it could be a nested property
   * in the data object expressed as a dot separated string
   * @example 'data.property'
   * @default undefined
   */
  propertyData?: string;
  /**
   * If set, this property will be used as the filename, it could be a nested property in the data
   * object expressed as a dot separated string
   * @example 'data.property'
   * @default undefined
   */
  propertyFileName?: string;
  /**
   * If set, this property will be used to skip the data, it could be a nested property in the data
   * object expressed as a dot separated string
   * @example 'data.property'
   * @default undefined
   */
  propertySkip?: string;
  /**
   * If set, this value will be used to skip the data, it could be a string, number or boolean. If
   * value is not set, but `propertySkip` is set, a not falsy value will be used to skip the data,
   * this means that any value that is not `false`, `0` or `''` will be used to skip the data.
   * @example 'skip' | 0 | false
   * @default undefined
   */
  propertySkipValue?: string | number | boolean;
  /**
   * Base filename for the files
   * @example 'file'
   * @default 'file'
   */
  defaultBaseFilename?: string;
  /**
   * Path to the folder where the working files are stored
   * @example './data/working'
   * @default './data/working'
   */
  workingFolderPath: string;
  /**
   * Path to the folder where the closed files are stored
   * @example './data/archive'
   * @default './data/archive'
   */
  archiveFolderPath: string;
  /**
   * If true, it will create the folders if they don't exist
   * @example true
   * @default true
   */
  createFolders: boolean;
  /**
   * Maximum inactivity time in milliseconds before a handler is cleaned up
   * @example 60000
   * @default undefined
   */
  inactiveTimeout?: number;
  /**
   * Encoding to use when writing to files
   * @example 'utf-8'
   */
  fileEncoding: BufferEncoding;
  /**
   * Interval in milliseconds to rotate the file
   * @example 3600000 (1 hour)
   * @default undefined
   */
  rotationInterval?: number;
  /**
   * Max size of the file before rotating it
   * @example 10485760 (10 MB)
   * @default undefined
   */
  rotationSize?: number;
  /**
   * Max number of lines before rotating the file
   * @example 10000 (10k lines)
   * @default undefined
   */
  rotationLines?: number;
  /**
   * Retry options for the file handler operations
   * @example { attempts: 3, timeout: 1000, waitTime: 1000, maxWaitTime: 10000 }
   * @default { attempts: 3, timeout: 1000, waitTime: 1000, maxWaitTime: 10000 }
   */
  retryOptions?: RetryOptions;
  /**
   * Logger instance to use
   * @default undefined
   */
  logger?: LoggerInstance;
}
