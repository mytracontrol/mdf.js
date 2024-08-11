/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { FrameType } from '../../FrameType.t';

export interface Frame {
  /**
   * This is an unsigned 32-bit integer that MUST contain the total frame size of the frame header,
   * extended header, and frame body.
   * The frame is malformed if the size is less than the size of the frame header (8 bytes).
   */
  size: number;
  /**
   * The value of the data offset is an unsigned, 8-bit integer specifying a count of 4-byte words.
   * Due to the mandatory 8-byte frame header, the frame is malformed if the value is less than 2.
   */
  dataOffset: number;
  /**
   * The type code indicates the format and purpose of the frame. The subsequent bytes in the frame
   * header MAY be interpreted differently depending on the type of the frame:
   *  - A type code of 0x00 indicates that the frame is an AMQP frame.
   *  - A type code of 0x01 indicates that the frame is a SASL frame.
   */
  type: FrameType;
}
