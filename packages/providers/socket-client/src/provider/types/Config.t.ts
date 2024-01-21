/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { ManagerOptions, SocketOptions } from 'socket.io-client';

export interface Config extends Partial<ManagerOptions>, Partial<SocketOptions> {
  /** URL to connect to the server*/
  url?: string;
}
