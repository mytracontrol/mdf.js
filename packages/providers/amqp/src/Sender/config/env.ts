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

/**
 * Sender name for the AMQP connection
 * @defaultValue undefined
 */
const CONFIG_AMQP_SENDER_NAME = process.env['CONFIG_AMQP_SENDER_NAME'];
/**
 * Sender settle mode for the AMQP connection
 * @defaultValue `2`
 */
const CONFIG_AMQP_SENDER_SETTLE_MODE = coerce<0 | 1 | 2>(
  process.env['CONFIG_AMQP_SENDER_SETTLE_MODE']
);
/**
 * Sender auto settle for the AMQP connection
 * @defaultValue `true`
 */
const CONFIG_AMQP_SENDER_AUTO_SETTLE = coerce<boolean>(
  process.env['CONFIG_AMQP_SENDER_AUTO_SETTLE']
);

export const envBasedConfig: Config = {
  ...commonEnvBasedConfig,
  sender_options: {
    name: CONFIG_AMQP_SENDER_NAME,
    snd_settle_mode: CONFIG_AMQP_SENDER_SETTLE_MODE,
    autosettle: CONFIG_AMQP_SENDER_AUTO_SETTLE,
  },
};
// #endregion
