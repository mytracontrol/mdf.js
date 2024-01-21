/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { LoggerInstance } from '@mdf.js/logger';
import { Manager } from './Manager';
import { Port } from './Port';
import { Factory, FactoryOptions, PortConfigValidationStruct } from './types';

/**
 * Create a new Provider Factory based in a Port
 * @param port - Port instance
 * @param validation - Port config validation struct
 * @param defaultName - Default name for the provider
 * @param type - Provider type
 * @returns Factory class, with a static `create` methods to create a provider instances
 */
export default function <PortClient, PortConfig, T extends Port<PortClient, PortConfig>>(
  port: new (config: PortConfig, logger: LoggerInstance) => T,
  validation: PortConfigValidationStruct<PortConfig>,
  defaultName: string,
  type: string
): Factory<PortClient, PortConfig, T> {
  return class MixinFactory {
    /** Provider */
    private readonly provider: Manager<PortClient, PortConfig, T>;
    /**
     * Create a new provider
     * @param options - Provider configuration options
     */
    public static create<P extends PortConfig>(
      options?: FactoryOptions<P>
    ): Manager<PortClient, PortConfig, T> {
      return new MixinFactory(options).provider;
    }
    /**
     * Private constructor for provider factory
     * @param options - Provider configuration options
     */
    private constructor(options?: FactoryOptions<PortConfig>) {
      this.provider = new Manager<PortClient, PortConfig, T>(
        port,
        {
          name: options?.name || defaultName,
          type,
          validation,
          useEnvironment: options?.useEnvironment ?? true,
          logger: options?.logger,
        },
        options?.config
      );
    }
  };
}
