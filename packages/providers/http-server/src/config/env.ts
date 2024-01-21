/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { Config } from '../provider';

// *************************************************************************************************
// #region Environment variables
const CONFIG_SERVER_PORT = coerce<number>(process.env['CONFIG_SERVER_PORT']);
const CONFIG_SERVER_HOST = process.env['CONFIG_SERVER_HOST'];

export const envBasedConfig: Config = {
  port: CONFIG_SERVER_PORT,
  host: CONFIG_SERVER_HOST,
};
// #endregion
