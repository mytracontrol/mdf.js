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

const CONFIG_WRITE_OPTIONS_ENCODING = process.env['CONFIG_WRITE_OPTIONS_ENCODING'];
const CONFIG_WRITE_OPTIONS_MODE = process.env['CONFIG_WRITE_OPTIONS_MODE'];
const CONFIG_WRITE_OPTIONS_FLAG = process.env['CONFIG_WRITE_OPTIONS_FLAG'];
const CONFIG_WRITE_OPTIONS_FLUSH = coerce<boolean>(process.env['CONFIG_WRITE_OPTIONS_FLUSH']);
const CONFIG_ROTATION_OPTIONS_INTERVAL = coerce<number>(
  process.env['CONFIG_ROTATION_OPTIONS_INTERVAL']
);
const CONFIG_ROTATION_OPTIONS_OPEN_FILES_FOLDER_PATH =
  process.env['CONFIG_ROTATION_OPTIONS_OPEN_FILES_FOLDER_PATH'];
const CONFIG_ROTATION_OPTIONS_CLOSED_FILES_FOLDER_PATH =
  process.env['CONFIG_ROTATION_OPTIONS_CLOSED_FILES_FOLDER_PATH'];
const CONFIG_ROTATION_OPTIONS_RETRY_OPTIONS_ATTEMPTS = coerce<number>(
  process.env['CONFIG_ROTATION_OPTIONS_RETRY_OPTIONS_ATTEMPTS']
);
const CONFIG_ROTATION_OPTIONS_RETRY_OPTIONS_TIMEOUT = coerce<number>(
  process.env['CONFIG_ROTATION_OPTIONS_RETRY_OPTIONS_TIMEOUT']
);

export const envBasedConfig: Config = {
  writeOptions: {
    encoding: CONFIG_WRITE_OPTIONS_ENCODING as BufferEncoding,
    mode: CONFIG_WRITE_OPTIONS_MODE,
    flag: CONFIG_WRITE_OPTIONS_FLAG,
    flush: CONFIG_WRITE_OPTIONS_FLUSH,
  },
  rotationOptions: {
    interval: CONFIG_ROTATION_OPTIONS_INTERVAL ?? defaultConfig.rotationOptions.interval,
    openFilesFolderPath:
      CONFIG_ROTATION_OPTIONS_OPEN_FILES_FOLDER_PATH ??
      defaultConfig.rotationOptions.openFilesFolderPath,
    closedFilesFolderPath:
      CONFIG_ROTATION_OPTIONS_CLOSED_FILES_FOLDER_PATH ??
      defaultConfig.rotationOptions.closedFilesFolderPath,
    retryOptions: {
      attempts: CONFIG_ROTATION_OPTIONS_RETRY_OPTIONS_ATTEMPTS,
      timeout: CONFIG_ROTATION_OPTIONS_RETRY_OPTIONS_TIMEOUT,
    },
  },
};
// #endregion
