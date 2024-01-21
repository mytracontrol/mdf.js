/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { ObservabilityServiceOptions } from './ObservabilityServiceOptions.i';

export interface ObservabilityOptions extends Layer.App.Metadata, ObservabilityServiceOptions {}
