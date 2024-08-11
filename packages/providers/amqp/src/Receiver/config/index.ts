/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { schema } from '../../Common';
import { Config } from '../types';
import { defaultConfig } from './default';
import { envBasedConfig } from './env';

export const configEntry: Layer.Provider.PortConfigValidationStruct<Config> = {
  envBasedConfig,
  defaultConfig,
  schema,
};
export { CONFIG_PROVIDER_BASE_NAME } from '../../Common';
