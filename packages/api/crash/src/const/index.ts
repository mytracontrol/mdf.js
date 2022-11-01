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

import { HTTPCode } from '../types';

export const CONFIG_MAX_ERROR_MESSAGE_LENGTH = 240;
export const HTTP_CODES = new Map([
  [HTTPCode.CONTINUE, 'Continue'],
  [HTTPCode.SWITCHING_PROTOCOLS, 'Switching Protocols'],
  [HTTPCode.PROCESSING, 'Processing'],
  [HTTPCode.OK, 'OK'],
  [HTTPCode.CREATED, 'Created'],
  [HTTPCode.ACCEPTED, 'Accepted'],
  [HTTPCode.NON_AUTHORITATIVE_INFORMATION, 'Non-Authoritative Information'],
  [HTTPCode.NO_CONTENT, 'No Content'],
  [HTTPCode.RESET_CONTENT, 'Reset Content'],
  [HTTPCode.PARTIAL_CONTENT, 'Partial Content'],
  [HTTPCode.MULTI_STATUS, 'Multi-Status'],
  [HTTPCode.MULTIPLE_CHOICES, 'Multiple Choices'],
  [HTTPCode.MOVED_PERMANENTLY, 'Moved Permanently'],
  [HTTPCode.FOUND, 'Found'],
  [HTTPCode.SEE_OTHER, 'See Other'],
  [HTTPCode.NOT_MODIFIED, 'Not Modified'],
  [HTTPCode.USE_PROXY, 'Use Proxy'],
  [HTTPCode.TEMPORARY_REDIRECT, 'Temporary Redirect'],
  [HTTPCode.BAD_REQUEST, 'Bad Request'],
  [HTTPCode.UNAUTHORIZED, 'Unauthorized'],
  [HTTPCode.PAYMENT_REQUIRED, 'Payment Required'],
  [HTTPCode.FORBIDDEN, 'Forbidden'],
  [HTTPCode.NOT_FOUND, 'Not Found'],
  [HTTPCode.METHOD_NOT_ALLOWED, 'Method Not Allowed'],
  [HTTPCode.NOT_ACCEPTABLE, 'Not Acceptable'],
  [HTTPCode.PROXY_AUTHENTICATION_REQUIRED, 'Proxy Authentication Required'],
  [HTTPCode.REQUEST_TIMEOUT, 'Request Time-out'],
  [HTTPCode.CONFLICT, 'Conflict'],
  [HTTPCode.GONE, 'Gone'],
  [HTTPCode.LENGTH_REQUIRED, 'Length Required'],
  [HTTPCode.PRECONDITION_FAILED, 'Precondition Failed'],
  [HTTPCode.PAYLOAD_TOO_LARGE, 'Request Entity Too Large'],
  [HTTPCode.URI_TOO_LONG, 'Request-URI Too Large'],
  [HTTPCode.UNSUPPORTED_MEDIA_TYPE, 'Unsupported Media Type'],
  [HTTPCode.RANGE_NOT_SATISFIABLE, 'Requested Range Not Satisfiable'],
  [HTTPCode.EXPECTATION_FAILED, 'Expectation Failed'],
  [HTTPCode.I_AM_A_TEAPOT, "I'm a teapot"],
  [HTTPCode.UNPROCESSABLE_ENTITY, 'Unprocessable Entity'],
  [HTTPCode.LOCKED, 'Locked'],
  [HTTPCode.FAILED_DEPENDENCY, 'Failed Dependency'],
  [HTTPCode.TOO_EARLY, 'Too Early'],
  [HTTPCode.UPGRADE_REQUIRED, 'Upgrade Required'],
  [HTTPCode.PRECONDITION_REQUIRED, 'Precondition Required'],
  [HTTPCode.TOO_MANY_REQUESTS, 'Too Many Requests'],
  [HTTPCode.REQUEST_HEADER_FIELDS_TOO_LARGE, 'Request Header Fields Too Large'],
  [HTTPCode.UNAVAILABLE_FOR_LEGAL_REASONS, 'Unavailable For Legal Reasons'],
  [HTTPCode.INTERNAL_SERVER_ERROR, 'Internal Server Error'],
  [HTTPCode.NOT_IMPLEMENTED, 'Not Implemented'],
  [HTTPCode.BAD_GATEWAY, 'Bad Gateway'],
  [HTTPCode.SERVICE_UNAVAILABLE, 'Service Unavailable'],
  [HTTPCode.GATEWAY_TIMEOUT, 'Gateway Time-out'],
  [HTTPCode.HTTP_VERSION_NOT_SUPPORTED, 'HTTP Version Not Supported'],
  [HTTPCode.VARIANT_ALSO_NEGOTIATES, 'Variant Also Negotiates'],
  [HTTPCode.INSUFFICIENT_STORAGE, 'Insufficient Storage'],
  [HTTPCode.BANDWIDTH_LIMIT_EXCEEDED, 'Bandwidth Limit Exceeded'],
  [HTTPCode.NOT_EXTENDED, 'Not Extended'],
  [HTTPCode.NETWORK_AUTHENTICATION_REQUIRED, 'Network Authentication Required'],
]);
