/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import Debug from 'debug';

export const CONFIG_PROVIDER_BASE_NAME = 'mongo';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = Debug(`${CONFIG_ARTIFACT_ID}:config:${CONFIG_PROVIDER_BASE_NAME}`);
