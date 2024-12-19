/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Packets } from '../types';
import { Deserializer } from './Deserializer';
import { Serializer } from './Serializer';

/** Handler for the Version packet */
export class Handler {
  /**
   * Deserialize a buffer into a Version object
   * @param buffer - buffer to be deserialized
   * @returns a Version object
   */
  public static deserialize(buffer: Buffer): Packets.Version {
    return new Deserializer(buffer);
  }
  /**
   * Serialize a Version object into a buffer
   * @param packet - packet to be serialized
   * @returns a buffer
   */
  public static serialize(packet: Packets.Version): Buffer {
    return new Serializer(packet).toBuffer();
  }
}

