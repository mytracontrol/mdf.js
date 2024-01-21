/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Port } from './Port';
import { CONFIG_PROVIDER_BASE_NAME, configEntry } from './config';
import { Config, Receiver } from './types';

export const Factory = Layer.Provider.ProviderFactoryCreator<Receiver, Config, Port>(
  Port,
  configEntry,
  CONFIG_PROVIDER_BASE_NAME,
  'service'
);
