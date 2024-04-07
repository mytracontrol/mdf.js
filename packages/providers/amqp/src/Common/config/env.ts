/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { coerce, loadFile } from '@mdf.js/utils';
import { logger } from '../../Common';
import { Config } from '../types';
// *************************************************************************************************
// #region Environment variables

const CONFIG_AMQP_USER_NAME = process.env['CONFIG_AMQP_USER_NAME'];
const CONFIG_AMQP_PASSWORD = process.env['CONFIG_AMQP_PASSWORD'];
const CONFIG_AMQP_HOST = process.env['CONFIG_AMQP_HOST'];
const CONFIG_AMQP_HOSTNAME = process.env['CONFIG_AMQP_HOSTNAME'];
const CONFIG_AMQP_PORT = coerce<number>(process.env['CONFIG_AMQP_PORT']);
const CONFIG_AMQP_TRANSPORT = process.env['CONFIG_AMQP_TRANSPORT'];
const CONFIG_AMQP_CONTAINER_ID = process.env['CONFIG_AMQP_CONTAINER_ID'];
const CONFIG_AMQP_ID = process.env['CONFIG_AMQP_ID'];
const CONFIG_AMQP_RECONNECT = coerce<number>(process.env['CONFIG_AMQP_RECONNECT']);
const CONFIG_AMQP_RECONNECT_LIMIT = coerce<number>(process.env['CONFIG_AMQP_RECONNECT_LIMIT']);
const CONFIG_AMQP_INITIAL_RECONNECT_DELAY = coerce<number>(
  process.env['CONFIG_AMQP_INITIAL_RECONNECT_DELAY']
);
const CONFIG_AMQP_MAX_RECONNECT_DELAY = coerce<number>(
  process.env['CONFIG_AMQP_MAX_RECONNECT_DELAY']
);
const CONFIG_AMQP_MAX_FRAME_SIZE = coerce<number>(process.env['CONFIG_AMQP_MAX_FRAME_SIZE']);
const CONFIG_AMQP_NON_FATAL_ERRORS = process.env['CONFIG_AMQP_NON_FATAL_ERRORS']
  ? process.env['CONFIG_AMQP_NON_FATAL_ERRORS'].split(',')
  : undefined;
const CONFIG_AMQP_CA_PATH = process.env['CONFIG_AMQP_CA_PATH'];
const CA_CERT = loadFile(CONFIG_AMQP_CA_PATH, logger);
const CONFIG_AMQP_CLIENT_CERT_PATH = process.env['CONFIG_AMQP_CLIENT_CERT_PATH'];
const CLIENT_CERT = loadFile(CONFIG_AMQP_CLIENT_CERT_PATH, logger);
const CONFIG_AMQP_CLIENT_KEY_PATH = process.env['CONFIG_AMQP_CLIENT_KEY_PATH'];
const CLIENT_KEY = loadFile(CONFIG_AMQP_CLIENT_KEY_PATH, logger);
const CONFIG_AMQP_REQUEST_CERT = coerce<boolean>(process.env['CONFIG_AMQP_REQUEST_CERT']);
const CONFIG_AMQP_REJECT_UNAUTHORIZED = coerce<boolean>(
  process.env['CONFIG_AMQP_REJECT_UNAUTHORIZED']
);

export const envBasedConfig: Config = {
  username: CONFIG_AMQP_USER_NAME,
  password: CONFIG_AMQP_PASSWORD,
  host: CONFIG_AMQP_HOST,
  hostname: CONFIG_AMQP_HOSTNAME,
  port: CONFIG_AMQP_PORT,
  //@ts-ignore - the configuration options has been changed in the latest version of rhea
  transport: CONFIG_AMQP_TRANSPORT,
  container_id: CONFIG_AMQP_CONTAINER_ID,
  id: CONFIG_AMQP_ID,
  reconnect: CONFIG_AMQP_RECONNECT,
  reconnect_limit: CONFIG_AMQP_RECONNECT_LIMIT,
  initial_reconnect_delay: CONFIG_AMQP_INITIAL_RECONNECT_DELAY,
  max_reconnect_delay: CONFIG_AMQP_MAX_RECONNECT_DELAY,
  max_frame_size: CONFIG_AMQP_MAX_FRAME_SIZE,
  non_fatal_errors: CONFIG_AMQP_NON_FATAL_ERRORS,
  key: CLIENT_KEY?.toString(),
  cert: CLIENT_CERT?.toString(),
  ca: CA_CERT?.toString(),
  requestCert: CONFIG_AMQP_REQUEST_CERT,
  rejectUnauthorized: CONFIG_AMQP_REJECT_UNAUTHORIZED,
};
// #endregion
