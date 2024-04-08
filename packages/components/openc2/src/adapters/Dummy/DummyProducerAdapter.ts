/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Control, ProducerAdapter } from '@mdf.js/openc2-core';
import { AdapterOptions } from '../../types';
import { DummyAdapter } from './DummyAdapter';

export class DummyProducerAdapter extends DummyAdapter implements ProducerAdapter {
  /**
   * Create a new OpenC2 adapter for Dummy
   * @param adapterOptions - Adapter configuration options
   * @param type - component type
   */
  constructor(adapterOptions: AdapterOptions) {
    super(adapterOptions, 'consumer');
  }
  /**
   * Perform the publication of the message in the underlayer transport system
   * @param message - message to be published
   * @returns
   */
  public async publish(
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | Control.ResponseMessage[] | void> {
    // Dummy adapter does not need to publish
  }
}
