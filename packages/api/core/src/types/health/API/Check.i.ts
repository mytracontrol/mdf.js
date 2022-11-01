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

import { Status } from './Status.t';

export interface Check<T = any> {
  /**
   * Unique identifier of an instance of a specific sub-component/dependency of a service.
   * Multiple objects with the same componentID MAY appear in the details, if they are from
   * different nodes.
   */
  componentId: string;
  /** SHOULD be present if componentName is present. Type of the component. Could be one of:
   *    - Pre-defined value from this spec. Pre-defined values include:
   *         - component
   *         - datastore
   *         - system
   *     - A common and standard term from a well-known source such as schema.org, IANA or
   *     microformats.
   *     - A URI that indicates extra semantics and processing rules that MAY be provided by a
   *     resource at the other end of the URI. URIs do not have to be dereferenceable, however.
   *     They are just a namespace, and the meaning of a namespace CAN be provided by any
   *     convenient means (e.g. publishing an RFC, Swagger document or a nicely printed book). */
  componentType?: string;
  /** Could be any valid JSON value, such as: string, number, object, array or literal */
  observedValue?: T;
  /** SHOULD be present if metricValue is present. Could be one of:
   *    - A common and standard term from a well-known source such as schema.org, IANA or
   *    microformats.
   *    - A URI that indicates extra semantics and processing rules that MAY be provided by a
   *    resource at the other end of the URI. URIs do not have to be dereferenceable, however.
   *    They are just a namespace, and the meaning of a namespace CAN be provided by any
   *    convenient means (e.g. publishing an RFC, Swagger document or a nicely printed book). */
  observedUnit?: string;
  /* Indicates whether the service status is acceptable or not */
  status: Status;
  /**
   * A JSON array containing URI Templates as defined by [RFC6570]. This field SHOULD be omitted if
   * the "status" field is present and has value equal to "pass". A typical API has many URI
   * endpoints.  Most of the time we are interested in the overall health of the API, without diving
   * into details. That said, sometimes operational and resilience middleware needs to know more
   * details about the health of the API (which is why "checks" property provides details).
   * In such cases, we often need to indicate which particular endpoints are affected by a
   * particular check's troubles vs. other endpoints that may be fine.
   */
  affectedEndpoints?: string[];
  /** The date-time, in ISO8601 format, at which the reading of the metricValue was recorded. This
   *  assumes that the value can be cached and the reading typically doesn’t happen in real time,
   *  for performance and scalability purposes. */
  time?: string;
  /** Raw error output, in case of “fail” or “warn” states. This field SHOULD be omitted for
   *  “pass” state.*/
  output?: string | string[];
  /** An array of objects containing link relations and URIs [RFC3986] for external links that MAY
   *  contain more information about the health of the endpoint. Per web-linking standards
   *  [RFC5988] a link relationship SHOULD either be a common/registered one or be indicated as a
   *  URI, to avoid name clashes. If a “self” link is provided, it MAY be used by clients to check
   *  health via HTTP response code, as mentioned above. */
  links?: {
    self?: string;
    related?: string;
    about?: string;
  };
  /** Any other desired property */
  [x: string]: any;
}
