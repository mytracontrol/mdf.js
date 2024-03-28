/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { CONFIG_ARTIFACT_ID, defaultConfig as commonDefaultConfig } from '../../Common';
import { Config } from '../types';

// *************************************************************************************************
// #region Default values
const AMQP_SENDER_SETTLE_MODE = 2;
const AMQP_SENDER_AUTO_SETTLE = true;
const AMQP_SENDER_TARGET = {};

export const defaultConfig: Config = {
  ...commonDefaultConfig,
  sender_options: {
    name: CONFIG_ARTIFACT_ID,
    snd_settle_mode: AMQP_SENDER_SETTLE_MODE,
    autosettle: AMQP_SENDER_AUTO_SETTLE,
    target: AMQP_SENDER_TARGET,
  },
};
// #endregion
