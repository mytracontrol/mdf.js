/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { WritableOptions } from 'stream';

export const DEFAULT_WRITABLE_OPTIONS: WritableOptions = {
  /** Buffer level when stream.write() starts returning false. Default: 16384 (16KB), or 32 for
   *  objectMode streams.*/
  highWaterMark: 32,
  /** Whether to encode strings passed to stream.write() to Buffers (with the encoding specified in
   *  the stream.write() call) before passing them to stream._write(). Other types of data are not
   *  converted (i.e. Buffers are not decoded into strings). Setting to false will prevent strings
   *  from being converted. */
  decodeStrings: false,
  /** The default encoding that is used when no encoding is specified as an argument to
   *  stream.write() */
  defaultEncoding: undefined,
  /** Whether or not the stream.write(anyObj) is a valid operation. When set, it becomes possible to
   *  write JavaScript values other than string, Buffer or Uint8Array if supported by the stream
   *  implementation. */
  objectMode: true,
  /** Whether or not the stream should emit 'close' after it has been destroyed. */
  emitClose: true,
  /** Whether this stream should automatically call .destroy() on itself after ending. */
  autoDestroy: false,
};
