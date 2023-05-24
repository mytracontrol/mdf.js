/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { ServerOptions } from 'socket.io';
import { InstrumentOptions } from './InstrumentOptions.i';
export interface Config extends Partial<ServerOptions> {
  /** Server port */
  port?: number;
  /** Server host */
  host?: string;
  /** Enable the admin UI */
  enableUI?: boolean;
  /** Interface UI options */
  ui?: InstrumentOptions;
}
