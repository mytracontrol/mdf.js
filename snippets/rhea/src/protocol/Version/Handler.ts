/**
 * Copyright 2024 Netin Systems S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin Systems S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin Systems S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin Systems S.L.
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
