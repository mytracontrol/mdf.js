/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { ReadFlag } from '../Client';
import { Config } from '../provider';
// *************************************************************************************************
// #region Environment variables

const CONFIG_READ_OPTIONS_ENCODING = process.env['CONFIG_READ_OPTIONS_ENCODING'];
const CONFIG_READ_OPTIONS_FLAG = process.env['CONFIG_READ_OPTIONS_FLAG'];
const CONFIG_WRITE_OPTIONS_ENCODING = process.env['CONFIG_WRITE_OPTIONS_ENCODING'];
const CONFIG_WRITE_OPTIONS_MODE = process.env['CONFIG_WRITE_OPTIONS_MODE'];
const CONFIG_WRITE_OPTIONS_FLAG = process.env['CONFIG_WRITE_OPTIONS_FLAG'];
const CONFIG_WRITE_OPTIONS_FLUSH = coerce<boolean>(process.env['CONFIG_WRITE_OPTIONS_FLUSH']);
const CONFIG_COPY_OPTIONS_MODE = coerce<number>(process.env['CONFIG_COPY_OPTIONS_MODE']);
const CONFIG_READ_DIR_OPTIONS_ENCODING = process.env['CONFIG_READ_DIR_OPTIONS_ENCODING'];
const CONFIG_READ_DIR_OPTIONS_RECURSIVE = coerce<boolean>(
  process.env['CONFIG_READ_DIR_OPTIONS_RECURSIVE']
);

export const envBasedConfig: Config = {
  readOptions: {
    encoding: CONFIG_READ_OPTIONS_ENCODING as BufferEncoding,
    flag: CONFIG_READ_OPTIONS_FLAG as ReadFlag,
  },
  writeOptions: {
    encoding: CONFIG_WRITE_OPTIONS_ENCODING as BufferEncoding,
    mode: CONFIG_WRITE_OPTIONS_MODE,
    flag: CONFIG_WRITE_OPTIONS_FLAG,
    flush: CONFIG_WRITE_OPTIONS_FLUSH,
  },
  copyOptions: {
    mode: CONFIG_COPY_OPTIONS_MODE,
  },
  readDirOptions: {
    encoding: CONFIG_READ_DIR_OPTIONS_ENCODING as BufferEncoding,
    recursive: CONFIG_READ_DIR_OPTIONS_RECURSIVE,
  },
};
// #endregion
