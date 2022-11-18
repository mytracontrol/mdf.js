/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Provider } from '@mdf.js/provider';
import { Config } from '../../types/Config.t';
import { Port } from '../Port';
import { AwaitableSender } from './Client.t';

export type ProviderInstance = Provider.Manager<AwaitableSender, Config, Port>;
