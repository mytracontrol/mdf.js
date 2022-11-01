/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Health } from '@mdf/core';
import { Crash } from '@mdf/crash';
import { SocketIOClient } from '@mdf/socket-client-provider';
import { AdapterOptions, SocketIOClientOptions } from '../../types';
import { Adapter } from '../Adapter';

export abstract class SocketIOAdapter extends Adapter implements Health.Component {
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
  /** Component checks */
  public get checks(): Health.API.Checks {
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
}
