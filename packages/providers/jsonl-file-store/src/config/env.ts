/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { Config } from '../provider';
import { defaultConfig } from './default';
// *************************************************************************************************
// #region Environment variables

const CONFIG_OPEN_FILES_FOLDER_PATH = process.env['CONFIG_OPEN_FILES_FOLDER_PATH'];
const CONFIG_CLOSED_FILES_FOLDER_PATH = process.env['CONFIG_CLOSED_FILES_FOLDER_PATH'];
const CONFIG_FILE_ENCODING = process.env['CONFIG_FILE_ENCODING'];
const CONFIG_CREATE_FOLDERS = coerce<boolean>(process.env['CONFIG_CREATE_FOLDERS']);
const CONFIG_ROTATION_INTERVAL = coerce<number>(process.env['CONFIG_ROTATION_INTERVAL']);
const CONFIG_FAIL_ON_START_SETUP = coerce<boolean>(process.env['CONFIG_FAIL_ON_START_SETUP']);
const CONFIG_APPEND_RETRY_OPTIONS_TIMEOUT = coerce<number>(
  process.env['CONFIG_APPEND_RETRY_OPTIONS_TIMEOUT']
);
const CONFIG_APPEND_RETRY_OPTIONS_ATTEMPTS = coerce<number>(
  process.env['CONFIG_APPEND_RETRY_OPTIONS_ATTEMPTS']
);
const CONFIG_ROTATION_RETRY_OPTIONS_TIMEOUT = coerce<number>(
  process.env['CONFIG_ROTATION_RETRY_OPTIONS_TIMEOUT']
);
const CONFIG_ROTATION_RETRY_OPTIONS_ATTEMPTS = coerce<number>(
  process.env['CONFIG_ROTATION_RETRY_OPTIONS_ATTEMPTS']
);

export const envBasedConfig: Config = {
  openFilesFolderPath: CONFIG_OPEN_FILES_FOLDER_PATH ?? defaultConfig.openFilesFolderPath,
  closedFilesFolderPath: CONFIG_CLOSED_FILES_FOLDER_PATH ?? defaultConfig.closedFilesFolderPath,
  fileEncoding: CONFIG_FILE_ENCODING as BufferEncoding,
  createFolders: CONFIG_CREATE_FOLDERS ?? defaultConfig.createFolders,
  rotationInterval: CONFIG_ROTATION_INTERVAL ?? defaultConfig.rotationInterval,
  failOnStartSetup: CONFIG_FAIL_ON_START_SETUP ?? defaultConfig.failOnStartSetup,
  appendRetryOptions: {
    timeout: CONFIG_APPEND_RETRY_OPTIONS_TIMEOUT,
    attempts: CONFIG_APPEND_RETRY_OPTIONS_ATTEMPTS,
  },
  rotationRetryOptions: {
    timeout: CONFIG_ROTATION_RETRY_OPTIONS_TIMEOUT,
    attempts: CONFIG_ROTATION_RETRY_OPTIONS_ATTEMPTS,
  },
};
// #endregion
