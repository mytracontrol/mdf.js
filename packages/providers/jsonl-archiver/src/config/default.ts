/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const DEFAULT_CONFIG_JSONL_ARCHIVER_WORKING_FOLDER_PATH = './data/working';
const DEFAULT_CONFIG_JSONL_ARCHIVER_ARCHIVE_FOLDER_PATH = './data/archive';
const DEFAULT_CONFIG_JSONL_ARCHIVER_FILE_ENCODING = 'utf-8';
const DEFAULT_CONFIG_JSONL_ARCHIVER_CREATE_FOLDERS = true;
const DEFAULT_CONFIG_JSONL_ARCHIVER_ROTATION_INTERVAL = 600000;
const DEFAULT_CONFIG_JSONL_ARCHIVER_ROTATION_SIZE = 10 * 1024 * 1024; /* 10 MB */
const DEFAULT_CONFIG_JSONL_ARCHIVER_ROTATION_LINES = 10000;

export const defaultConfig: Config = {
  workingFolderPath: DEFAULT_CONFIG_JSONL_ARCHIVER_WORKING_FOLDER_PATH,
  archiveFolderPath: DEFAULT_CONFIG_JSONL_ARCHIVER_ARCHIVE_FOLDER_PATH,
  fileEncoding: DEFAULT_CONFIG_JSONL_ARCHIVER_FILE_ENCODING,
  createFolders: DEFAULT_CONFIG_JSONL_ARCHIVER_CREATE_FOLDERS,
  rotationInterval: DEFAULT_CONFIG_JSONL_ARCHIVER_ROTATION_INTERVAL,
  rotationSize: DEFAULT_CONFIG_JSONL_ARCHIVER_ROTATION_SIZE,
  rotationLines: DEFAULT_CONFIG_JSONL_ARCHIVER_ROTATION_LINES,
};
// #endregion
