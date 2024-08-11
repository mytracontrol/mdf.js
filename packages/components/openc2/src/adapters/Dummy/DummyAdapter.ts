/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { AdapterOptions } from '../../types';
import { Adapter } from '../Adapter';

export abstract class DummyAdapter extends Adapter implements Layer.App.Resource {
  /**
   * Create a new OpenC2 adapter for Dummy
   * @param adapterOptions - Adapter configuration options
   * @param type - component type
   */
  constructor(adapterOptions: AdapterOptions, type: 'producer' | 'consumer') {
    super(adapterOptions, type);
  }
  /** Adapter health status */
  public get status(): Health.Status {
    return Health.STATUS.PASS;
  }
  /** Component checks */
  public get checks(): Health.Checks {
    return {};
  }
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  public async start(): Promise<void> {
    // Dummy adapter does not need to start
  }
  /** Disconnect the OpenC2 Adapter from the underlayer transport system */
  public async stop(): Promise<void> {
    // Dummy adapter does not need to stop
  }
  /** Disconnect the OpenC2 Adapter to the underlayer transport system */
  public async close(): Promise<void> {
    // Dummy adapter does not need to close
  }
}
