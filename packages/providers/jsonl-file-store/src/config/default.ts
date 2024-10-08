/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const OPEN_FILES_FOLDER_PATH = './data/open';
const CLOSED_FILES_FOLDER_PATH = './data/closed';
const FILE_ENCODING = 'utf-8';
const CREATE_FOLDERS = true;
const ROTATION_INTERVAL = 600000; /* 10 minutes */
const FAIL_ON_START_SETUP = true;
const APPEND_RETRY_OPTIONS_TIMEOUT = 5000; /* 5 seconds */
const APPEND_RETRY_OPTIONS_ATTEMPTS = 3;
const ROTATION_RETRY_OPTIONS_TIMEOUT = 5000; /* 5 seconds */
const ROTATION_RETRY_OPTIONS_ATTEMPTS = 3;

export const defaultConfig: Config = {
  openFilesFolderPath: OPEN_FILES_FOLDER_PATH,
  closedFilesFolderPath: CLOSED_FILES_FOLDER_PATH,
  fileEncoding: FILE_ENCODING,
  createFolders: CREATE_FOLDERS,
  rotationInterval: ROTATION_INTERVAL,
  failOnStartSetup: FAIL_ON_START_SETUP,
  appendRetryOptions: {
    timeout: APPEND_RETRY_OPTIONS_TIMEOUT,
    attempts: APPEND_RETRY_OPTIONS_ATTEMPTS,
  },
  rotationRetryOptions: {
    timeout: ROTATION_RETRY_OPTIONS_TIMEOUT,
    attempts: ROTATION_RETRY_OPTIONS_ATTEMPTS,
  },
};
// #endregion
