/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import express from 'express';
import path from 'path';
import { Config } from '../provider';

// *************************************************************************************************
// #region Default values
const CONFIG_SERVER_PORT = 8080;
const CONFIG_SERVER_HOST = 'localhost';
export const CONFIG_SERVER_DEFAULT_APP = express().use(
  express.static(path.join(__dirname, 'public'))
);

export const defaultConfig: Config = {
  port: CONFIG_SERVER_PORT,
  host: CONFIG_SERVER_HOST,
  app: CONFIG_SERVER_DEFAULT_APP,
};
// #endregion
