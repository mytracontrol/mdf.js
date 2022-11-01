/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import * as BoomHelpers from './BoomHelpers';
export { Boom } from './BoomError';
/**
 * Helpers for easy generation of Boom kind errors
 * - Client error (`400`-`499`)
 *   - [[badRequest | `400 Bad Request`]]
 *   - [[unauthorized | `401 Unauthorized`]]
 *   - [[paymentRequired | `402 Payment Required`]]
 *   - [[forbidden | `403 Forbidden`]]
 *   - [[notFound | `404 Not Found`]]
 *   - [[methodNotAllowed | `405 Method Not Allowed`]]
 *   - [[notAcceptable | `406 Not Acceptable`]]
 *   - [[proxyAuthRequired | `407 Proxy Authentication Required`]]
 *   - [[requestTimeout | `408 Request Timeout`]]
 *   - [[conflict | `409 Conflict`]]
 *   - [[gone | `410 Gone`]]
 *   - [[lengthRequired | `411 Length Required`]]
 *   - [[preconditionFailed | `412 Precondition Failed`]]
 *   - [[payloadTooLarge | `413 Payload Too Large`]]
 *   - [[uriTooLong | `414 URI Too Long`]]
 *   - [[unsupportedMediaType | `415 Unsupported Media Type`]]
 *   - [[rangeNotSatisfiable | `416 Range Not Satisfiable`]]
 *   - [[expectationFailed | `417 Expectation Failed`]]
 *   - [[teapot | `418 I'm a teapot`]]
 *   - [[unprocessableEntity | `422 Unprocessable Entity`]]
 *   - [[locked | `423 Locked`]]
 *   - [[failedDependency | `424 Failed Dependency`]]
 *   - [[tooEarly | `425 Too Early`]]
 *   - [[upgradeRequired | `426 Upgrade Required`]]
 *   - [[preconditionRequired | `428 Precondition Required`]]
 *   - [[tooManyRequests | `429 Too Many Requests`]]
 *   - [[headerFieldsTooLarge | `431 Request Header Fields Too Large`]]
 *   - [[illegal | `451 Unavailable For Legal Reasons`]]
 * - Server error (`500`-`599`)
 *   - [[internalServerError | `500 Internal Server Error`]]
 *   - [[notImplemented | `501 Not Implemented`]]
 *   - [[badGateway | `502 Bad Gateway`]]
 *   - [[serverUnavailable | `503 Service Unavailable`]]
 *   - [[gatewayTimeout | `504 Gateway Timeout`]]
 * @category Boom
 * @public
 */
export { BoomHelpers };
