/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce, loadFile } from '@mdf.js/utils';
import { MqttProtocol } from 'mqtt/*';
import { Config } from '../provider';
import { logger } from './utils';

// *************************************************************************************************
// #region Environment variables
const CONFIG_MQTT_URL = process.env['CONFIG_MQTT_URL'];
const CONFIG_MQTT_PROTOCOL = process.env['CONFIG_MQTT_PROTOCOL'] as MqttProtocol;
const CONFIG_MQTT_USERNAME = process.env['CONFIG_MQTT_USERNAME'];
const CONFIG_MQTT_PASSWORD = process.env['CONFIG_MQTT_PASSWORD'];
const CONFIG_MQTT_CLIENT_ID = process.env['CONFIG_MQTT_CLIENT_ID'];
const CONFIG_MQTT_KEEPALIVE = coerce<number>(process.env['CONFIG_MQTT_KEEPALIVE']);

const CONFIG_MQTT_CLIENT_CA = loadFile(process.env['CONFIG_MQTT_CLIENT_CA_PATH'], logger);
const CONFIG_MQTT_CLIENT_CLIENT_CERT = loadFile(
  process.env['CONFIG_MQTT_CLIENT_CLIENT_CERT_PATH'],
  logger
);
const CONFIG_MQTT_CLIENT_CLIENT_KEY = loadFile(
  process.env['CONFIG_MQTT_CLIENT_CLIENT_KEY_PATH'],
  logger
);
// #endregion

export const envBasedConfig: Config = {
  url: CONFIG_MQTT_URL,
  protocol: CONFIG_MQTT_PROTOCOL,
  username: CONFIG_MQTT_USERNAME,
  password: CONFIG_MQTT_PASSWORD,
  clientId: CONFIG_MQTT_CLIENT_ID,
  ca: CONFIG_MQTT_CLIENT_CA,
  cert: CONFIG_MQTT_CLIENT_CLIENT_CERT,
  key: CONFIG_MQTT_CLIENT_CLIENT_KEY,
  keepalive: CONFIG_MQTT_KEEPALIVE,
};
// #endregion

