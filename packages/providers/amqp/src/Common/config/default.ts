/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { CONFIG_ARTIFACT_ID } from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Default values
const AMQP_USER_NAME = 'mdf-amqp';
const AMQP_HOST = '127.0.0.1';
const AMQP_PORT = 5672;
const AMQP_TRANSPORT = 'tcp';
const AMQP_CONTAINER_ID = `${CONFIG_ARTIFACT_ID}`;
const AMQP_RECONNECT = 5000;
const AMQP_INITIAL_RECONNECT_DELAY = 30000;
const AMQP_MAX_RECONNECT_DELAY = 10000;
const AMQP_NON_FATAL_ERRORS = ['amqp:connection:forced'];

export const defaultConfig: Config = {
  username: AMQP_USER_NAME,
  host: AMQP_HOST,
  port: AMQP_PORT,
  transport: AMQP_TRANSPORT,
  container_id: AMQP_CONTAINER_ID,
  reconnect: AMQP_RECONNECT,
  initial_reconnect_delay: AMQP_INITIAL_RECONNECT_DELAY,
  max_reconnect_delay: AMQP_MAX_RECONNECT_DELAY,
  non_fatal_errors: AMQP_NON_FATAL_ERRORS,
};
// #endregion
