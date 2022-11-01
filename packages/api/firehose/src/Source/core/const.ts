/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
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
