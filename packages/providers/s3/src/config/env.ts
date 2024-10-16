/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { NodeHttpHandler, NodeHttpHandlerOptions } from '@smithy/node-http-handler';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Config } from '../provider';
import { DEFAULT_CONFIG_S3_ACCESS_KEY_ID, DEFAULT_CONFIG_S3_SECRET_KEY } from './default';

// *************************************************************************************************
// #region Environment variables
/**
 *
 * S3 AWS region to which send requests
 * @defaultValue 'eu-central-1'
 */
const CONFIG_S3_REGION = process.env['CONFIG_S3_REGION'];
/**
 * S3 AWS connection access key identifier
 * @defaultValue 'MY_ACCESS_KEY_ID'
 */
const CONFIG_S3_ACCESS_KEY_ID = process.env['CONFIG_S3_ACCESS_KEY_ID'];
/**
 * S3 AWS connection secret access key
 * @defaultValue 'MY_SECRET_ACCESS_KEY'
 */
const CONFIG_S3_SECRET_ACCESS_KEY = process.env['CONFIG_S3_SECRET_ACCESS_KEY'];
/**
 * S3 unique service identifier
 * @defaultValue process.env['NODE_APP_INSTANCE'] || CONFIG_ARTIFACT_ID
 */
const CONFIG_S3_SERVICE_ID = process.env['CONFIG_S3_SERVICE_ID'];
/**
 * HTTP Proxy URI
 * @defaultValue undefined
 */
const CONFIG_S3_PROXY_HTTP = process.env['CONFIG_S3_PROXY_HTTP'];
/**
 * HTTPS Proxy URI
 * @defaultValue undefined
 */
const CONFIG_S3_PROXY_HTTPS = process.env['CONFIG_S3_PROXY_HTTPS'];

const requestHandlerConfig: NodeHttpHandlerOptions = {};
if (CONFIG_S3_PROXY_HTTP) {
  requestHandlerConfig.httpAgent = new HttpProxyAgent(CONFIG_S3_PROXY_HTTP);
}
if (CONFIG_S3_PROXY_HTTPS) {
  requestHandlerConfig.httpsAgent = new HttpsProxyAgent(CONFIG_S3_PROXY_HTTPS);
}
let requestHandler: NodeHttpHandler | undefined = undefined;
if (requestHandlerConfig.httpAgent || requestHandlerConfig.httpsAgent) {
  requestHandler = new NodeHttpHandler(requestHandlerConfig);
}

export const envBasedConfig: Config = {
  region: CONFIG_S3_REGION,
  credentials: {
    accessKeyId: CONFIG_S3_ACCESS_KEY_ID ?? DEFAULT_CONFIG_S3_ACCESS_KEY_ID,
    secretAccessKey: CONFIG_S3_SECRET_ACCESS_KEY ?? DEFAULT_CONFIG_S3_SECRET_KEY,
  },
  serviceId: CONFIG_S3_SERVICE_ID,
  requestHandler,
};
// #endregion
