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
import { TransformOptions } from 'stream';

export const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  /** Buffer level when stream.write() starts returning false. Default: 16384 (16KB), or 32 for
   *  objectMode streams.*/
  highWaterMark: 32,
  /** Whether to encode strings passed to stream.write() to Buffers (with the encoding specified in
   *  the stream.write() call) before passing them to stream._write(). Other types of data are not
   *  converted (i.e. Buffers are not decoded into strings). Setting to false will prevent strings
   *  from being converted. */
  decodeStrings: false,
  /** If specified, then buffers will be decoded to strings using the specified encoding. */
  encoding: undefined,
  /** The default encoding that is used when no encoding is specified as an argument to
   *  stream.write() */
  defaultEncoding: undefined,
  /** Whether or not the stream.write(anyObj) is a valid operation. When set, it becomes possible to
   *  write JavaScript values other than string, Buffer or Uint8Array if supported by the stream
   *  implementation. */
  objectMode: true,
  /** Whether or not the stream should emit 'close' after it has been destroyed. */
  emitClose: false,
  /** Whether this stream should automatically call .destroy() on itself after ending. */
  autoDestroy: false,
};
