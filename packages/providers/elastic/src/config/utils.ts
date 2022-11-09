/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DebugLogger } from '@mdf.js/logger';
export const CONFIG_PROVIDER_BASE_NAME = 'elastic';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = new DebugLogger(`${CONFIG_PROVIDER_BASE_NAME}:config`);

/**
 * Return nodes (as an array), checking the environment variables
 * @param node - node environment variable
 * @param nodes - nodes environment variable
 * @returns
 */
export function nodeToNodes(node?: string, nodes?: string): string[] | undefined {
  const _nodes = nodes ? nodes.split(',') : undefined;
  if (_nodes) {
    return _nodes;
  } else if (node) {
    return [node];
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
