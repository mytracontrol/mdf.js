/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Packets } from '../types';

const VERSION_HEADER_SIZE = 8;
const VERSION_NAME_OFFSET = 0;
const VERSION_NAME_SIZE = 4;
const VERSION_PROTOCOL_ID_OFFSET = 4;
const VERSION_MAJOR_OFFSET = 5;
const VERSION_MINOR_OFFSET = 6;
const VERSION_REVISION_OFFSET = 7;

/** Serializer for the Version packet */
export class Serializer {
  /** Buffer to store the serialized data */
  private buffer: Buffer;
  /**
   * Serialize a Version object into a buffer
   * @param packet - packet to be serialized
   */
  constructor(packet: Packets.Version) {
    this.buffer = Buffer.alloc(VERSION_HEADER_SIZE);
    this.buffer.write(packet.name, VERSION_NAME_OFFSET, VERSION_NAME_SIZE, 'ascii');
    this.buffer.writeUInt8(packet.protocolId, VERSION_PROTOCOL_ID_OFFSET);
    this.buffer.writeUInt8(packet.major, VERSION_MAJOR_OFFSET);
    this.buffer.writeUInt8(packet.minor, VERSION_MINOR_OFFSET);
    this.buffer.writeUInt8(packet.revision, VERSION_REVISION_OFFSET);
  }
  /** Return the buffer representation */
  toBuffer(): Buffer {
    return this.buffer;
  }
}
