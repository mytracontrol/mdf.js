/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Protocol } from '..';

const VERSION_HEADER_SIZE = 8;
const FRAME_SIZE_OFFSET = 0;
const FRAME_DATA_OFFSET = 4;
const FRAME_TYPE_OFFSET = 5;

export class Disector {
  constructor() {}

  private decode(buffer: Buffer): any {
    const version = Protocol.Version.Handler.deserialize(buffer);
    const frame = this.decodeFrame(buffer.subarray(VERSION_HEADER_SIZE));
  }
  private decodeFrame(buffer: Buffer): any {
    const size = buffer.readUInt32BE(FRAME_SIZE_OFFSET);
    const dataOffset = buffer.readUInt32BE(FRAME_DATA_OFFSET);
    const type = buffer.readUInt8(FRAME_TYPE_OFFSET);
  }
}
