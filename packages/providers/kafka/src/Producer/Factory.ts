/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { configEntry, CONFIG_PROVIDER_BASE_NAME } from './config';
import { Port } from './Port';
import { Config, Producer } from './types';

export const Factory = Layer.Provider.ProviderFactoryCreator<Producer, Config, Port>(
  Port,
  configEntry,
  CONFIG_PROVIDER_BASE_NAME,
  'service'
);
