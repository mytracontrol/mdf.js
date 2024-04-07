/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { coerce } from '@mdf.js/utils';
import { envBasedConfig as commonEnvBasedConfig } from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Environment variables

const CONFIG_AMQP_RECEIVER_NAME = process.env['CONFIG_AMQP_RECEIVER_NAME'];
const CONFIG_AMQP_RECEIVER_SETTLE_MODE = coerce<0 | 1>(
  process.env['CONFIG_AMQP_RECEIVER_SETTLE_MODE']
);
const CONFIG_AMQP_RECEIVER_CREDIT_WINDOW = coerce<number>(
  process.env['CONFIG_AMQP_RECEIVER_CREDIT_WINDOW']
);
const CONFIG_AMQP_RECEIVER_AUTO_ACCEPT = coerce<boolean>(
  process.env['CONFIG_AMQP_RECEIVER_AUTO_ACCEPT']
);
const CONFIG_AMQP_RECEIVER_AUTO_SETTLE = coerce<boolean>(
  process.env['CONFIG_AMQP_RECEIVER_AUTO_SETTLE']
);

export const envBasedConfig: Config = {
  ...commonEnvBasedConfig,
  receiver_options: {
    name: CONFIG_AMQP_RECEIVER_NAME,
    rcv_settle_mode: CONFIG_AMQP_RECEIVER_SETTLE_MODE,
    credit_window: CONFIG_AMQP_RECEIVER_CREDIT_WINDOW,
    autoaccept: CONFIG_AMQP_RECEIVER_AUTO_ACCEPT,
    autosettle: CONFIG_AMQP_RECEIVER_AUTO_SETTLE,
  },
};
// #endregion
