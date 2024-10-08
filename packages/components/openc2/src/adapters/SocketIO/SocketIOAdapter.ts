/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health, Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { SocketIOClient } from '@mdf.js/socket-client-provider';
import { AdapterOptions, SocketIOClientOptions } from '../../types';
import { Adapter } from '../Adapter';

export abstract class SocketIOAdapter extends Adapter implements Layer.App.Resource {
  /** Socket.IO provider instance */
  protected readonly provider: SocketIOClient.Provider;
  /**
   * Create a new OpenC2 adapter for Socket.IO
   * @param adapterOptions - Adapter configuration options
   * @param type - component type
   * @param options - Socket.IO client configuration options
   */
  constructor(
    adapterOptions: AdapterOptions,
    type: 'producer' | 'consumer',
    options?: SocketIOClientOptions
  ) {
    super(adapterOptions, type);
    this.provider = SocketIOClient.Factory.create({
      config: {
        ...options,
        auth: {
          nodeId: adapterOptions.id,
          actuators: adapterOptions.actuators ?? [],
          type,
          token: adapterOptions.token,
        },
      },
      name: adapterOptions.id,
    });
  }
  /** Adapter health status */
  public get status(): Health.Status {
    return this.provider.status;
  }
  /** Component checks */
  public get checks(): Health.Checks {
    return this.provider.checks;
  }
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  public async start(): Promise<void> {
    try {
      await this.provider.start();
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error performing the subscription to OpenC2 topics: ${error.message}`,
        error.uuid,
        { cause: error }
      );
    }
  }
  /** Connect the OpenC2 Adapter to the underlayer transport system */
  public async stop(): Promise<void> {
    try {
      await this.provider.stop();
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(
        `Error performing the unsubscription to OpenC2 topics: ${error.message}`,
        error.uuid,
        { cause: error }
      );
    }
  }
  /** Close the OpenC2 Adapter to the underlayer transport system */
  public async close(): Promise<void> {
    try {
      await this.provider.close();
    } catch (rawError) {
      const error = Crash.from(rawError);
      throw new Crash(`Error closing the OpenC2 adapter: ${error.message}`, error.uuid, {
        cause: error,
      });
    }
  }
}
