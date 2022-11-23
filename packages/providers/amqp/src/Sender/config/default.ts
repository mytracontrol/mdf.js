/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { CONFIG_ARTIFACT_ID } from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Default values
const CONFIG_AMQP_USER_NAME = 'producer';
const CONFIG_AMQP_HOST = '127.0.0.1';
const CONFIG_AMQP_PORT = 5672;
const CONFIG_AMQP_TRANSPORT = 'tcp';
const CONFIG_AMQP_CONTAINER_ID = `${CONFIG_ARTIFACT_ID}`;
const CONFIG_AMQP_RECONNECT = 5000;
const CONFIG_AMQP_INITIAL_RECONNECT_DELAY = 30000;
const CONFIG_AMQP_MAX_RECONNECT_DELAY = 10000;
const CONFIG_AMQP_NON_FATAL_ERRORS = ['amqp:connection:forced'];
const CONFIG_AMQP_REQUEST_CERT = false;
const CONFIG_AMQP_REJECT_UNAUTHORIZED = false;
const CONFIG_AMQP_SENDER_SETTLE_MODE = 2;
const CONFIG_AMQP_SENDER_AUTO_SETTLE = true;

export const defaultConfig: Config = {
  username: CONFIG_AMQP_USER_NAME,
  host: CONFIG_AMQP_HOST,
  port: CONFIG_AMQP_PORT,
  transport: CONFIG_AMQP_TRANSPORT,
  container_id: CONFIG_AMQP_CONTAINER_ID,
  reconnect: CONFIG_AMQP_RECONNECT,
  initial_reconnect_delay: CONFIG_AMQP_INITIAL_RECONNECT_DELAY,
  max_reconnect_delay: CONFIG_AMQP_MAX_RECONNECT_DELAY,
  non_fatal_errors: CONFIG_AMQP_NON_FATAL_ERRORS,
  requestCert: CONFIG_AMQP_REQUEST_CERT,
  rejectUnauthorized: CONFIG_AMQP_REJECT_UNAUTHORIZED,
  sender_options: {
    name: CONFIG_ARTIFACT_ID,
    snd_settle_mode: CONFIG_AMQP_SENDER_SETTLE_MODE,
    autosettle: CONFIG_AMQP_SENDER_AUTO_SETTLE,
  },
};
// #endregion
