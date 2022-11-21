/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Manager, Port } from '../api';
import { FactoryOptions } from './FactoryOptions.i';

/** Provider factory interface */
export interface Factory<PortClient, PortConfig, T extends Port<PortClient, PortConfig>> {
  /**
   * Create a new provider
   * @param options - Provider configuration options
   */
  create<P extends PortConfig>(options?: FactoryOptions<P>): Manager<PortClient, PortConfig, T>;
}
