/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Schema } from 'joi';

/**
 * Port configuration validation structure
 * @param PortConfig - Port configuration object, could be an extended version of the client config
 */
export interface PortConfigValidationStruct<PortConfig> {
  /** Default configuration options */
  defaultConfig: PortConfig;
  /** Environment based configuration options */
  envBasedConfig: PortConfig;
  /** Schema for configuration validation */
  schema: Schema<PortConfig>;
}
