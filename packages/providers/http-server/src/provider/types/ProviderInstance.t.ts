/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Provider } from '@mdf.js/provider';
import { Port } from '../Port';
import { Server } from './Client.t';
import { Config } from './Config.t';

export type ProviderInstance = Provider.Manager<Server, Config, Port>;
