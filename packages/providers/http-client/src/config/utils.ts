/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DebugLogger } from '@mdf.js/logger';
export const CONFIG_PROVIDER_BASE_NAME = 'http-client';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = new DebugLogger(`mdf:${CONFIG_PROVIDER_BASE_NAME}:config`);

/**
 * Return the configuration object if any of the properties is not undefined
 * @param config - configuration object
 * @returns
 */
export function checkConfigObject<T>(config: T): T | undefined {
  if (
    config &&
    typeof config === 'object' &&
    typeof config !== null &&
    typeof config !== 'function' &&
    !Array.isArray(config)
  ) {
    return Object.values(config).some(value => value !== undefined) ? config : undefined;
  } else {
    return undefined;
  }
}

/**
 * Return username and password if both are provided
 * @param username - username environment variable
 * @param password - password environment variable
 * @returns
 */
export function selectAuth(
  username?: string,
  password?: string
): { username: string; password: string } | undefined {
  if (username && password) {
    return { username, password };
  } else {
    return undefined;
  }
}
