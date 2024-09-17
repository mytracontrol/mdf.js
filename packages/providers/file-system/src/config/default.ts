/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { constants } from 'fs';
import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const READ_OPTIONS_ENCODING = 'utf-8';
const READ_OPTIONS_FLAG = 'r';
const WRITE_OPTIONS_ENCODING = 'utf-8';
const WRITE_OPTIONS_FLAG = 'a';
const COPY_OPTIONS_MODE = constants.COPYFILE_EXCL;

export const defaultConfig: Config = {
  readOptions: {
    encoding: READ_OPTIONS_ENCODING,
    flag: READ_OPTIONS_FLAG,
  },
  writeOptions: {
    encoding: WRITE_OPTIONS_ENCODING,
    mode: 0o666,
    flag: WRITE_OPTIONS_FLAG,
    flush: false,
  },
  copyOptions: {
    mode: COPY_OPTIONS_MODE,
  },
  readDirOptions: {
    encoding: 'utf8',
    recursive: false,
  },
};
// #endregion
