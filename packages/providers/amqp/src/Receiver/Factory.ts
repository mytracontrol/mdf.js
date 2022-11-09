/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Provider } from '@mdf.js/provider';
import { configEntry, CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Config } from '../types';
import { Port } from './Port';
import { Receiver } from './types';

export const Factory = Provider.Factory<Receiver, Config, Port>(
  Port,
  configEntry,
  CONFIG_PROVIDER_BASE_NAME,
  'service'
);
