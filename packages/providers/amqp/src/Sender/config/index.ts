/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { PortConfigValidationStruct } from '@mdf.js/provider';
import { schema } from '../../Common';
import { Config } from '../types';
import { defaultConfig } from './default';
import { envBasedConfig } from './env';

export const configEntry: PortConfigValidationStruct<Config> = {
  envBasedConfig,
  defaultConfig,
  schema,
};
export { CONFIG_PROVIDER_BASE_NAME } from '../../Common';
