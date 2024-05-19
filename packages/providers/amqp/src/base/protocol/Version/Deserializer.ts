/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { Packets, ProtocolId } from '../types';

const VERSION_NAME_OFFSET = 0;
const VERSION_NAME_SIZE = 4;
const VERSION_PROTOCOL_ID_OFFSET = 4;
const VERSION_MAJOR_OFFSET = 5;
const VERSION_MINOR_OFFSET = 6;
const VERSION_REVISION_OFFSET = 7;
const VERSION_HEADER_SIZE = 8;

/** Deserializer for the Version packet */
export class Deserializer implements Packets.Version {
  /** The name of the protocol */
  readonly name: string;
  /** The protocol identifier */
  readonly protocolId: ProtocolId;
  /** The major version number */
  readonly major: number;
  /** The minor version number */
  readonly minor: number;
  /** The revision number */
  readonly revision: number;
  /**
   * Deserialize a buffer into a Version object
   * @param buffer - packet to be deserialized
   */
  constructor(buffer: Buffer) {
    if (buffer.length !== VERSION_HEADER_SIZE) {
      throw new Crash(
        `Invalid buffer size for Version frame, expected ${VERSION_HEADER_SIZE} but got ${buffer.length}`,
        { name: 'ProtocolError' }
      );
    }
    this.name = buffer.toString('utf8', VERSION_NAME_OFFSET, VERSION_NAME_SIZE);
    if (this.name !== 'AMQP') {
      throw new Crash(`Invalid protocol header for AMQP, expected 'AMQP' but got '${this.name}'`, {
        name: 'ProtocolError',
      });
    }
    this.protocolId = buffer.readUInt8(VERSION_PROTOCOL_ID_OFFSET);
    this.major = buffer.readUInt8(VERSION_MAJOR_OFFSET);
    this.minor = buffer.readUInt8(VERSION_MINOR_OFFSET);
    this.revision = buffer.readUInt8(VERSION_REVISION_OFFSET);
    if (this.protocolId !== 3 && this.protocolId !== 2 && this.protocolId !== 0) {
      throw new Crash(`Unsupported AMQP protocol identifier: ${this.toString()}`, {
        name: 'ProtocolError',
      });
    } else if (this.major !== 1 || this.minor !== 0 || this.revision !== 0) {
      throw new Crash(`Unsupported AMQP protocol version: ${this.toString()}`, {
        name: 'ProtocolError',
      });
    }
  }
  /** Return a object representation */
  public toJSON(): Packets.Version {
    return {
      name: this.name,
      protocolId: this.protocolId,
      major: this.major,
      minor: this.minor,
      revision: this.revision,
    };
  }
  /** Return a string representation of the object */
  public toString() {
    return JSON.stringify(this.toJSON());
  }
}
