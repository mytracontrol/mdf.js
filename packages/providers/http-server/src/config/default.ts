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
