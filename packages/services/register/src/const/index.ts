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
import { coerce } from '@mdf/utils';

const DEFAULT_CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL = 10000;
const DEFAULT_CONFIG_REGISTER_INCLUDE_STACK = false;
const DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE = 100;

export const CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL = coerce(
  process.env['CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL'],
  DEFAULT_CONFIG_REGISTER_CLUSTER_UPDATE_INTERVAL
);

export const CONFIG_REGISTER_INCLUDE_STACK = coerce(
  process.env['CONFIG_REGISTER_INCLUDE_STACK'],
  DEFAULT_CONFIG_REGISTER_INCLUDE_STACK
);

export const CONFIG_REGISTER_MAX_LIST_SIZE = coerce(
  process.env['CONFIG_REGISTER_MAX_LIST_SIZE'],
  DEFAULT_CONFIG_REGISTER_MAX_LIST_SIZE
);
