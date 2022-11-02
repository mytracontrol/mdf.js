/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ComponentAdapter } from './ComponentAdapter.i';
import { OnCommandHandler } from './OnCommandHandler.t';

export interface ConsumerAdapter extends ComponentAdapter {
  /**
   * Subscribe the incoming command handler to the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  subscribe(handler: OnCommandHandler): Promise<void>;
  /**
   * Unsubscribe the incoming command handler from the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  unsubscribe(handler: OnCommandHandler): Promise<void>;
}
