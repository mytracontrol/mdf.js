/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { RetryOptions } from '@mdf.js/utils';

/** Represents the options for the JsonlFileStoreManager */
export interface JsonlFileStoreManagerOptions {
  openFilesFolderPath: string;
  closedFilesFolderPath: string;
  createFolders: boolean;
  fileEncoding: BufferEncoding;
  rotationInterval: number;
  failOnStartSetup: boolean;
  appendRetryOptions: RetryOptions;
  rotationRetryOptions: RetryOptions;
}

/** Represents the options for the SingleJsonlFileManager */
export interface SingleJsonlFileManagerOptions extends JsonlFileStoreManagerOptions {
  baseFilename: string;
}
