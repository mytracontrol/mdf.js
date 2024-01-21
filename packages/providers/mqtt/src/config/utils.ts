/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DebugLogger } from '@mdf.js/logger';
export const CONFIG_PROVIDER_BASE_NAME = 'mqtt';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = new DebugLogger(`mdf:${CONFIG_PROVIDER_BASE_NAME}:config`);
