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

import { BoomOptions } from '../types';
import { HTTPCode } from '../types/HTTPCode.t';
import { Boom } from './BoomError';

function regularError(message: string, uuid: string, code: number, options?: BoomOptions): Boom {
  return new Boom(message, uuid, code, options);
}
// *************************************************************************************************
// #region HTTP 4xx Errors
/** The HyperText Transfer Protocol (HTTP) 400 Bad Request response status code indicates that the
 * server cannot or will not process the request due to something that is perceived to be a client
 * error (e.g., malformed request syntax, invalid request message framing, or deceptive request
 * routing).
 * The client should not repeat this request without modification.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const badRequest = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.BAD_REQUEST, options);
};
/**
 * The HTTP 401 Unauthorized client error status response code indicates that the request has not
 * been applied because it lacks valid authentication credentials for the target resource.
 * This status is sent with a WWW-Authenticate header that contains information on how to authorize
 * correctly.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const unauthorized = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.UNAUTHORIZED, options);
};
/**
 * The HTTP 402 Payment Required is a nonstandard client error status response code that is reserved
 * for future use.
 * Sometimes, this code indicates that the request can not be processed until the client makes a
 * payment. Originally it was created to enable digital cash or (micro) payment systems and would
 * indicate that the requested content is not available until the client makes a payment. However,
 * no standard use convention exists and different entities use it in different contexts.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const paymentRequired = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.PAYMENT_REQUIRED, options);
};
/**
 * The HTTP 403 Forbidden client error status response code indicates that the server understood the
 * request but refuses to authorize it.
 * This status is similar to 401, but in this case, re-authenticating will make no difference. The
 * access is permanently forbidden and tied to the application logic, such as insufficient rights to
 * a resource.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const forbidden = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.FORBIDDEN, options);
};
/**
 * The HTTP 404 Not Found client error response code indicates that the server can't find the
 * requested resource. Links which lead to a 404 page are often called broken or dead links, and can
 * be subject to link rot.
 * A 404 status code does not indicate whether the resource is temporarily or permanently missing.
 * But if a resource is permanently removed, a 410 (Gone) should be used instead of a 404 status.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const notFound = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.NOT_FOUND, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 405 Method Not Allowed response status code indicates that
 * the request method is known by the server but is not supported by the target resource. The server
 * MUST generate an Allow header field in a 405 response containing a list of the target resource's
 * currently supported methods.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const methodNotAllowed = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.METHOD_NOT_ALLOWED, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 406 Not Acceptable client error response code indicates
 * that the server cannot produce a response matching the list of acceptable values defined in the
 * request's proactive content negotiation headers, and that the server is unwilling to supply a
 * default representation.
 * In practice, this error is very rarely used. Instead of responding using this error code, which
 * would be cryptic for the end user and difficult to fix, servers ignore the relevant header and
 * serve an actual page to the user. It is assumed that even if the user won't be completely happy,
 * they will prefer this to an error code.
 * If a server returns such an error status, the body of the message should contain the list of the
 * available representations of the resources, allowing the user to choose among them.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const notAcceptable = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.NOT_ACCEPTABLE, options);
};
/**
 * The HTTP 407 Proxy Authentication Required client error status response code indicates that the
 * request has not been applied because it lacks valid authentication credentials for a proxy server
 * that is between the browser and the server that can access the requested resource.
 * This status is sent with a Proxy-Authenticate header that contains information on how to
 * authorize correctly.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const proxyAuthRequired = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.PROXY_AUTHENTICATION_REQUIRED, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 408 Request Timeout response status code means that the
 * server would like to shut down this unused connection. It is sent on an idle connection by some
 * servers, even without any previous request by the client.
 * A server should send the "close" Connection header field in the response, since 408 implies that
 * the server has decided to close the connection rather than continue waiting.
 * This response is used much more since some browsers, like Chrome, Firefox 27+, and IE9, use HTTP
 * pre-connection mechanisms to speed up surfing.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const requestTimeout = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.REQUEST_TIMEOUT, options);
};
/**
 * The HTTP 409 Conflict response status code indicates a request conflict with current state of the
 * server.
 * Conflicts are most likely to occur in response to a PUT request. For example, you may get a 409
 * response when uploading a file which is older than the one already on the server resulting in a
 * version control conflict.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const conflict = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.CONFLICT, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 410 Gone client error response code indicates that access
 * to the target resource is no longer available at the origin server and that this condition is
 * likely to be permanent.
 * If you don't know whether this condition is temporary or permanent, a 404 status code should be
 * used instead.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const gone = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.GONE, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 411 Length Required client error response code indicates
 * that the server refuses to accept the request without a defined Content-Length header.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const lengthRequired = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.LENGTH_REQUIRED, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 412 Precondition Failed client error response code
 * indicates that access to the target resource has been denied. This happens with conditional
 * requests on methods other than GET or HEAD when the condition defined by the If-Unmodified-Since
 * or If-None-Match headers is not fulfilled. In that case, the request, usually an upload or a
 * modification of a resource, cannot be made and this error response is sent back.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const preconditionFailed = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.PRECONDITION_FAILED, options);
};
/**
 * The HTTP 413 Payload Too Large response status code indicates that the request entity is larger
 * than limits defined by server; the server might close the connection or return a Retry-After
 * header field.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const payloadTooLarge = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.PAYLOAD_TOO_LARGE, options);
};
/**
 * The HTTP 414 URI Too Long response status code indicates that the URI requested by the client is
 * longer than the server is willing to interpret.
 * There are a few rare conditions when this might occur:
 *   - when a client has improperly converted a POST request to a GET request with long query
 *     information,
 *   - when the client has descended into a loop of redirection (for example, a redirected URI
 *     prefix that points to a suffix of itself),
 *   - or when the server is under attack by a client attempting to exploit potential security holes
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const uriTooLong = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.URI_TOO_LONG, options);
};
/**
 * The HTTP 415 Unsupported Media Type client error response code indicates that the server refuses
 * to accept the request because the payload format is in an unsupported format.
 * The format problem might be due to the request's indicated Content-Type or Content-Encoding, or
 * as a result of inspecting the data directly.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const unsupportedMediaType = (
  message: string,
  uuid: string,
  options?: BoomOptions
): Boom => {
  return regularError(message, uuid, HTTPCode.UNSUPPORTED_MEDIA_TYPE, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 416 Range Not Satisfiable error response code indicates
 * that a server cannot serve the requested ranges. The most likely reason is that the document
 * doesn't contain such ranges, or that the Range header value, though syntactically correct,
 * doesn't make sense.
 * The 416 response message contains a Content-Range indicating an unsatisfied range (that is a '*')
 * followed by a '/' and the current length of the resource. E.g. Content-Range: bytes /12777
 * Faced with this error, browsers usually either abort the operation (for example, a download will
 * be considered as non-resumable) or ask for the whole document again.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const rangeNotSatisfiable = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.RANGE_NOT_SATISFIABLE, options);
};
/**
 * The HTTP 417 Expectation Failed client error response code indicates that the expectation given
 * in the request's Expect header could not be met.
 * See the Expect header for more details.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const expectationFailed = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.EXPECTATION_FAILED, options);
};
/**
 * The HTTP 418 I'm a teapot client error response code indicates that the server refuses to brew
 * coffee because it is, permanently, a teapot. A combined coffee/tea pot that is temporarily out of
 * coffee should instead return 503. This error is a reference to Hyper Text Coffee Pot Control
 * Protocol defined in April Fools' jokes in 1998 and 2014.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const teapot = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.I_AM_A_TEAPOT, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 422 Unprocessable Entity response status code indicates
 * that the server understands the content type of the request entity, and the syntax of the request
 * entity is correct, but it was unable to process the contained instructions.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const unprocessableEntity = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.UNPROCESSABLE_ENTITY, options);
};
/**
 * The 423 (Locked) status code means the source or destination resource of a method is locked.
 * This response SHOULD contain an appropriate precondition or postcondition code, such as
 * 'lock-token-submitted' or 'no-conflicting-lock'.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const locked = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.LOCKED, options);
};
/**
 * The 424 (Failed Dependency) status code means that the method could not be performed on the
 * resource because the requested action depended on another action and that action failed. For
 * example, if a command in a PROPPATCH method fails, then, at minimum, the rest of the commands
 * will also fail with 424 (Failed Dependency).
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const failedDependency = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.FAILED_DEPENDENCY, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 425 Too Early response status code indicates that the
 * server is unwilling to risk processing a request that might be replayed, which creates the
 * potential for a replay attack.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const tooEarly = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.TOO_EARLY, options);
};
/**
 * The HTTP 426 Upgrade Required client error response code indicates that the server refuses to
 * perform the request using the current protocol but might be willing to do so after the client
 * upgrades to a different protocol.
 * The server sends an Upgrade header with this response to indicate the required protocol(s).
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const upgradeRequired = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.UPGRADE_REQUIRED, options);
};
/**
 * The HTTP 428 Precondition Required response status code indicates that the server requires the
 * request to be conditional.
 * Typically, this means that a required precondition header, such as If-Match, is missing.
 * When a precondition header is not matching the server side state, the response should be 412
 * Precondition Failed.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const preconditionRequired = (
  message: string,
  uuid: string,
  options?: BoomOptions
): Boom => {
  return regularError(message, uuid, HTTPCode.PRECONDITION_REQUIRED, options);
};
/**
 * The HTTP 429 Too Many Requests response status code indicates the user has sent too many requests
 * in a given amount of time ("rate limiting").
 * A Retry-After header might be included to this response indicating how long to wait before making
 * a new request
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const tooManyRequests = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.TOO_MANY_REQUESTS, options);
};
/**
 * The HTTP 431 Request Header Fields Too Large response status code indicates that the server
 * refuses to process the request because the request’s HTTP headers are too long. The request may
 * be resubmitted after reducing the size of the request headers.
 * 431 can be used when the total size of request headers is too large, or when a single header
 * field is too large. To help those running into this error, indicate which of the two is the
 * problem in the response body — ideally, also include which headers are too large. This lets users
 * attempt to fix the problem, such as by clearing their cookies.
 * Servers will often produce this status if:
 *   - The Referer URL is too long
 *   - There are too many Cookies sent in the request
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const headerFieldsTooLarge = (
  message: string,
  uuid: string,
  options?: BoomOptions
): Boom => {
  return regularError(message, uuid, HTTPCode.REQUEST_HEADER_FIELDS_TOO_LARGE, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 451 Unavailable For Legal Reasons client error response
 * code indicates that the user requested a resource that is not available due to legal reasons,
 * such as a web page for which a legal action has been issued.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const illegal = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.UNAVAILABLE_FOR_LEGAL_REASONS, options);
};
// #endregion
// *************************************************************************************************
// #region HTTP 5xx Errors
/**
 * The HyperText Transfer Protocol (HTTP) 500 Internal Server Error server error response code
 * indicates that the server encountered an unexpected condition that prevented it from fulfilling
 * the request.
 * This error response is a generic "catch-all" response. Usually, this indicates the server cannot
 * find a better 5xx error code to response. Sometimes, server administrators log error responses
 * like the 500 status code with more details about the request to prevent the error from happening
 * again in the future.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const internalServerError = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.INTERNAL_SERVER_ERROR, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 501 Not Implemented server error response code means that
 * the server does not support the functionality required to fulfill the request.
 * This status can also send a Retry-After header, telling the requester when to check back to see
 * if the functionality is supported by then.
 * 501 is the appropriate response when the server does not recognize the request method and is
 * incapable of supporting it for any resource. The only methods that servers are required to
 * support (and therefore that must not return 501) are GET and HEAD.
 * If the server does recognize the method, but intentionally does not support it, the appropriate
 * response is 405 Method Not Allowed.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const notImplemented = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.NOT_IMPLEMENTED, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 502 Bad Gateway server error response code indicates that
 * the server, while acting as a gateway or proxy, received an invalid response from the upstream
 * server.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const badGateway = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.BAD_GATEWAY, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 503 Service Unavailable server error response code
 * indicates that the server is not ready to handle the request.
 * Common causes are a server that is down for maintenance or that is overloaded. This response
 * should be used for temporary conditions and the Retry-After HTTP header should, if possible,
 * contain the estimated time for the recovery of the service.
 * Caching-related headers that are sent along with this response should be taken care of, as a 503
 * status is often a temporary condition and responses shouldn't usually be cached.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const serverUnavailable = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.SERVICE_UNAVAILABLE, options);
};
/**
 * The HyperText Transfer Protocol (HTTP) 504 Gateway Timeout server error response code indicates
 * that the server, while acting as a gateway or proxy, did not get a response in time from the
 * upstream server that it needed in order to complete the request.
 * @param uuid - UUID V4, unique identifier for this particular occurrence of the problem
 * @param message - Human-readable explanation specific to this occurrence of the problem
 * @param options - Specific options for enhanced error management
 * @public
 */
export const gatewayTimeout = (message: string, uuid: string, options?: BoomOptions): Boom => {
  return regularError(message, uuid, HTTPCode.GATEWAY_TIMEOUT, options);
};
// #endregion
