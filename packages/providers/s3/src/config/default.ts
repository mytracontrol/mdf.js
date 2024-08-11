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
/** Default S3 AWS region to which send requests */
const DEFAULT_CONFIG_S3_REGION = 'eu-central-1';
/** Default S3 AWS connection access key identifier */
export const DEFAULT_CONFIG_S3_ACCESS_KEY_ID = 'MY_ACCESS_KEY_ID';
/** Default S3 AWS connection secret access key */
export const DEFAUTLT_CONFIG_S3_SECRET_ACCESS_KEY = 'MY_SECRET_ACCESS_KEY';
/** Default S3 unique service identifier */
const CONFIG_S3_SERVICE_ID = process.env['NODE_APP_INSTANCE'] || CONFIG_ARTIFACT_ID;

export const defaultConfig: Config = {
  region: DEFAULT_CONFIG_S3_REGION,
  credentials: {
    accessKeyId: DEFAULT_CONFIG_S3_ACCESS_KEY_ID,
    secretAccessKey: DEFAUTLT_CONFIG_S3_SECRET_ACCESS_KEY,
  },
  serviceId: CONFIG_S3_SERVICE_ID,
};
// #endregion
