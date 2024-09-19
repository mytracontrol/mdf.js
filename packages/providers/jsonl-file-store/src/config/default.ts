/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const WRITE_OPTIONS_ENCODING = 'utf-8';
const WRITE_OPTIONS_FLAG = 'a';
const ROTATION_OPTIONS_INTERVAL = 600000; /* 10 minutes */
const ROTATION_OPTIONS_OPEN_FILES_FOLDER_PATH = './data/open';
const ROTATION_OPTIONS_CLOSED_FILES_FOLDER_PATH = './data/closed';
const ROTATION_OPTIONS_RETRY_OPTIONS_TIMEOUT = 5000; /* 10 seconds */
const ROTATION_OPTIONS_RETRY_OPTIONS_ATTEMPTS = 3;

export const defaultConfig: Config = {
  writeOptions: {
    encoding: WRITE_OPTIONS_ENCODING,
    mode: 0o666,
    flag: WRITE_OPTIONS_FLAG,
    flush: false,
  },
  rotationOptions: {
    interval: ROTATION_OPTIONS_INTERVAL,
    openFilesFolderPath: ROTATION_OPTIONS_OPEN_FILES_FOLDER_PATH,
    closedFilesFolderPath: ROTATION_OPTIONS_CLOSED_FILES_FOLDER_PATH,
    retryOptions: {
      attempts: ROTATION_OPTIONS_RETRY_OPTIONS_ATTEMPTS,
      timeout: ROTATION_OPTIONS_RETRY_OPTIONS_TIMEOUT,
    },
  },
};
// #endregion
