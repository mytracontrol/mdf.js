/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ConsumerAdapter } from '@mdf.js/openc2-core';
import { AdapterOptions } from '../../types';
import { DummyAdapter } from './DummyAdapter';

export class DummyConsumerAdapter extends DummyAdapter implements ConsumerAdapter {
  /**
   * Create a new OpenC2 adapter for Dummy
   * @param adapterOptions - Adapter configuration options
   */
  constructor(adapterOptions: AdapterOptions) {
    super(adapterOptions, 'consumer');
  }
  /**
   * Subscribe the incoming message handler to the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  public async subscribe(handler: any): Promise<void> {
    // Dummy adapter does not need to subscribe
  }
  /**
   * Unsubscribe the incoming message handler from the underlayer transport system
   * @param handler - handler to be used
   * @returns
   */
  public async unsubscribe(handler: any): Promise<void> {
    // Dummy adapter does not need to unsubscribe
  }
}

