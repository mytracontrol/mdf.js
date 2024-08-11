/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { CONFIG_ARTIFACT_ID } from './utils';

// *************************************************************************************************
// #region Default values
const CONFIG_MQTT_URL = 'mqtt://localhost:1883';
const CONFIG_MQTT_PROTOCOL = 'mqtt';
const CONFIG_MQTT_RESUBSCRIBE = true;
const CONFIG_MQTT_CLIENT_ID = process.env['NODE_APP_INSTANCE'] || CONFIG_ARTIFACT_ID;
const CONFIG_MQTT_KEEPALIVE = 60;

export const defaultConfig: Config = {
  url: CONFIG_MQTT_URL,
  protocol: CONFIG_MQTT_PROTOCOL,
  resubscribe: CONFIG_MQTT_RESUBSCRIBE,
  clientId: CONFIG_MQTT_CLIENT_ID,
  keepalive: CONFIG_MQTT_KEEPALIVE,
};
// #endregion
