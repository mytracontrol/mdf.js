/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';
import fs from 'fs';

/** Represents the options for writing a file. See Node fs WriteFileOptions */
export type WriteOptions = fs.WriteFileOptions & { retryOptions?: RetryOptions };

export interface RotationOptions {
  interval: number;
  openFilesFolderPath: string;
  closedFilesFolderPath: string;
  retryOptions?: RetryOptions;
}

/** Represents the options for the JsonlFileStoreManager */
export interface JsonlFileStoreManagerOptions {
  writeOptions: WriteOptions;
  rotationOptions: RotationOptions;
}
