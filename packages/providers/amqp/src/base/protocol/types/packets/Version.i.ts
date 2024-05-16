/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ProtocolId } from '../ProtocolId.t';

export interface Version {
  /** The name of the protocol, should be `AMQP` */
  name: string;
  /** The protocol identifier */
  protocolId: ProtocolId;
  /** The major version number */
  major: number;
  /** The minor version number */
  minor: number;
  /** The revision number */
  revision: number;
}
