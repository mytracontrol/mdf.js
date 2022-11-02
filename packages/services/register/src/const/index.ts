/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { coerce } from '@mdf.js/utils';

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
