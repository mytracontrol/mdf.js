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
/**
 * URL of the server
 * @defaultValue 'mqtt://localhost:1883'
 */
const CONFIG_MQTT_URL = process.env['CONFIG_MQTT_URL'];
/**
 * Protocol to use
 * @defaultValue 'mqtt'
 */
const CONFIG_MQTT_PROTOCOL = process.env['CONFIG_MQTT_PROTOCOL'] as MqttProtocol;
/**
 * Username
 * @defaultValue undefined
 */
const CONFIG_MQTT_USERNAME = process.env['CONFIG_MQTT_USERNAME'];
/**
 * Password
 * @defaultValue undefined
 */
const CONFIG_MQTT_PASSWORD = process.env['CONFIG_MQTT_PASSWORD'];
/**
 * Client ID
 * @defaultValue 'mqtt-client'
 */
const CONFIG_MQTT_CLIENT_ID = process.env['CONFIG_MQTT_CLIENT_ID'];
/**
 * Keepalive in seconds
 * @defaultValue 60
 */
const CONFIG_MQTT_KEEPALIVE = coerce<number>(process.env['CONFIG_MQTT_KEEPALIVE']);

/**
 * CA file path
 * @defaultValue undefined
 */
const CONFIG_MQTT_CLIENT_CA_PATH = process.env['CONFIG_MQTT_CLIENT_CA_PATH'];
const CONFIG_MQTT_CLIENT_CA = loadFile(CONFIG_MQTT_CLIENT_CA_PATH, logger);
/**
 * Client cert file path
 * @defaultValue undefined
 */
const CONFIG_MQTT_CLIENT_CLIENT_CERT_PATH = process.env['CONFIG_MQTT_CLIENT_CLIENT_CERT_PATH'];
const CONFIG_MQTT_CLIENT_CLIENT_CERT = loadFile(CONFIG_MQTT_CLIENT_CLIENT_CERT_PATH, logger);
/**
 * Client key file path
 * @defaultValue undefined
 */
const CONFIG_MQTT_CLIENT_CLIENT_KEY_PATH = process.env['CONFIG_MQTT_CLIENT_CLIENT_KEY_PATH'];
const CONFIG_MQTT_CLIENT_CLIENT_KEY = loadFile(CONFIG_MQTT_CLIENT_CLIENT_KEY_PATH, logger);
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
