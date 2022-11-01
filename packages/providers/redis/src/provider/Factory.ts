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

import { Provider } from '@mdf.js/provider';
import { configEntry } from '../config';
import { Port } from './Port';
import { Client, Config, FactoryOptions, ProviderInstance } from './types';

export class Factory {
  /** Provider */
  private readonly provider: ProviderInstance;
  /**
   * Create a new Redis provider
   * @param options - Provider configuration options
   */
  public static create(options?: FactoryOptions): ProviderInstance {
    return new Factory(options).provider;
  }
  /**
   * Private constructor for Redis provider factory
   * @param options - Provider configuration options
   */
  private constructor(options?: FactoryOptions) {
    this.provider = new Provider.Manager<Client, Config, Port>(
      Port,
      {
        name: options?.name || 'redis',
        type: 'database',
        validation: configEntry,
        useEnvironment: options?.useEnvironment ?? true,
        logger: options?.logger,
      },
      options?.config
    );
  }
}
