/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Port } from '../Port';
import { AwaitableSender } from './Client.t';
import { Config } from './Config.t';

export type ProviderInstance = Layer.Provider.Manager<AwaitableSender, Config, Port>;
