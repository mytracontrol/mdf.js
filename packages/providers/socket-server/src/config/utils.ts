/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DebugLogger } from '@mdf.js/logger';
/** Base name for the socket.io server provider */
export const CONFIG_PROVIDER_BASE_NAME = 'socket.io-server';
/** Artifact identifier for the configuration provider */
export const CONFIG_ARTIFACT_ID = `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
/** Default Logger for the configuration provider */
export const logger = new DebugLogger(`mdf:${CONFIG_PROVIDER_BASE_NAME}:config`);
