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
export const CONFIG_PROVIDER_BASE_NAME = 'elastic';
export const CONFIG_ARTIFACT_ID =
  process.env['CONFIG_ARTIFACT_ID'] || `mdf-${CONFIG_PROVIDER_BASE_NAME}`;
export const logger = Debug(`${CONFIG_ARTIFACT_ID}:config:${CONFIG_PROVIDER_BASE_NAME}`);

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
