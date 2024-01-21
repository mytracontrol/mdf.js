/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { coerce } from '@mdf.js/utils';
import { ReadableOptions } from 'stream';

export const DEFAULT_CONFIG_SOURCE_PLUG_MAX_UNKNOWN_JOBS = 100;
export const DEFAULT_CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL = 10000;

export const CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL = coerce(
  process.env['CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL'],
  DEFAULT_CONFIG_SOURCE_PLUG_CHECK_UNCLEANED_INTERVAL
);

export const CONFIG_SOURCE_PLUG_MAX_UNKNOWN_JOBS = coerce(
  process.env['CONFIG_SOURCE_PLUG_MAX_UNKNOWN_JOBS'],
  DEFAULT_CONFIG_SOURCE_PLUG_MAX_UNKNOWN_JOBS
);

export const DEFAULT_READABLE_OPTIONS: ReadableOptions = {
  /** Buffer level when stream.write() starts returning false. Default: 16384 (16KB), or 32 for
   *  objectMode streams.*/
  highWaterMark: 32,
  /** If specified, then buffers will be decoded to strings using the specified encoding. */
  encoding: undefined,
  /** Whether this stream should behave as a stream of objects. Meaning that stream.read(n) returns
   *  a single value instead of a Buffer of size n */
  objectMode: true,
  /** Whether this stream should automatically call .destroy() on itself after ending. */
  autoDestroy: false,
};
