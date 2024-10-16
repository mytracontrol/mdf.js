/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { Config } from '../provider';
// *************************************************************************************************
// #region Environment variables

/**
 * Path to the folder where the open files are stored
 * @defaultValue './data/working'
 */
const CONFIG_JSONL_ARCHIVER_WORKING_FOLDER_PATH =
  process.env['CONFIG_JSONL_ARCHIVER_WORKING_FOLDER_PATH'];
/**
 * Path to the folder where the closed files are stored
 * @defaultValue './data/archive'
 */
const CONFIG_JSONL_ARCHIVER_ARCHIVE_FOLDER_PATH =
  process.env['CONFIG_JSONL_ARCHIVER_ARCHIVE_FOLDER_PATH'];
/**
 * File encoding
 * @defaultValue 'utf-8'
 */
const CONFIG_JSONL_ARCHIVER_FILE_ENCODING = process.env['CONFIG_JSONL_ARCHIVER_FILE_ENCODING'] as
  | BufferEncoding
  | undefined;
/**
 * Create folders if they do not exist
 * @defaultValue true
 */
const CONFIG_JSONL_ARCHIVER_CREATE_FOLDERS = coerce<boolean>(
  process.env['CONFIG_JSONL_ARCHIVER_CREATE_FOLDERS']
);
/**
 * Interval in milliseconds to rotate the file
 * @defaultValue 600000
 */
const CONFIG_JSONL_ARCHIVER_ROTATION_INTERVAL = coerce<number>(
  process.env['CONFIG_JSONL_ARCHIVER_ROTATION_INTERVAL']
);
/**
 * Max size of the file before rotating it
 * @defaultValue 10485760
 */
const CONFIG_JSONL_ARCHIVER_ROTATION_SIZE = coerce<number>(
  process.env['CONFIG_JSONL_ARCHIVER_ROTATION_SIZE']
);
/**
 * Max number of lines before rotating the file
 * @defaultValue 10000
 */
const CONFIG_JSONL_ARCHIVER_ROTATION_LINES = coerce<number>(
  process.env['CONFIG_JSONL_ARCHIVER_ROTATION_LINES']
);

export const envBasedConfig: Config = {
  workingFolderPath: CONFIG_JSONL_ARCHIVER_WORKING_FOLDER_PATH,
  archiveFolderPath: CONFIG_JSONL_ARCHIVER_ARCHIVE_FOLDER_PATH,
  fileEncoding: CONFIG_JSONL_ARCHIVER_FILE_ENCODING,
  createFolders: CONFIG_JSONL_ARCHIVER_CREATE_FOLDERS,
  rotationInterval: CONFIG_JSONL_ARCHIVER_ROTATION_INTERVAL,
  rotationSize: CONFIG_JSONL_ARCHIVER_ROTATION_SIZE,
  rotationLines: CONFIG_JSONL_ARCHIVER_ROTATION_LINES,
};
// #endregion
