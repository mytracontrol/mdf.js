/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import Debug from 'debug';

export const CONFIG_PROVIDER_BASE_NAME = 'http-client';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = Debug(`${CONFIG_ARTIFACT_ID}:config:${CONFIG_PROVIDER_BASE_NAME}`);

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
