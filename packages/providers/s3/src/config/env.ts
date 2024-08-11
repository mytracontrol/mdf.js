/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Config } from '../provider';
import { DEFAULT_CONFIG_S3_ACCESS_KEY_ID, DEFAUTLT_CONFIG_S3_SECRET_ACCESS_KEY } from './default';

// *************************************************************************************************
// #region Environment variables
/**
 * S3 AWS region to which send requests */
const CONFIG_S3_REGION = process.env['CONFIG_S3_REGION'];
/** S3 AWS connection access key identifier */
const CONFIG_S3_ACCESS_KEY_ID = process.env['CONFIG_S3_ACCESS_KEY_ID'];
/** S3 AWS connection secret access key */
const CONFIG_S3_SECRET_ACCESS_KEY = process.env['CONFIG_S3_SECRET_ACCESS_KEY'];
/** S3 unique service identifier */
const CONFIG_S3_SERVICE_ID = process.env['CONFIG_S3_SERVICE_ID'];

export const envBasedConfig: Config = {
  region: CONFIG_S3_REGION,
  credentials: {
    accessKeyId: CONFIG_S3_ACCESS_KEY_ID ?? DEFAULT_CONFIG_S3_ACCESS_KEY_ID,
    secretAccessKey: CONFIG_S3_SECRET_ACCESS_KEY ?? DEFAUTLT_CONFIG_S3_SECRET_ACCESS_KEY,
  },
  serviceId: CONFIG_S3_SERVICE_ID,
};
// #endregion
