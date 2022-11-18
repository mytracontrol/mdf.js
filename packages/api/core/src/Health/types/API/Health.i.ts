/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Checks } from './Checks.t';
import { Status } from './Status.t';

export interface Health {
  /** Indicates whether the service status is acceptable or not */
  status: Status;
  /** Public version of the service */
  version?: string;
  /**
   * In well-designed APIs, backwards-compatible changes in the service should not update a version
   * number. APIs usually change their version number as infrequently as possible, to preserve
   * stable interface. However implementation of an API may change much more frequently, which leads
   * to the importance of having separate “release number” or “releaseID” that is different from the
   * public version of the API.
   */
  releaseId?: string;
  /** Array of notes relevant to current state of health */
  notes?: string[];
  /** Raw error output, in case of “fail” or “warn” states. This field SHOULD be omitted for
   *  “pass” state.*/
  output?: string;
  /**
   * The “checks” object MAY have a number of unique keys, one for each logical sub-components.
   * Since each sub-component may be backed by several nodes with varying health statuses, the key
   * points to an array of objects. In case of a single-node sub-component (or if presence of nodes
   * is not relevant), a single-element array should be used as the value, for consistency.
   * The key identifying an element in the object should be a unique string within the details
   * section. It MAY have two parts: `{componentName}:{metricName}`, in which case the meaning of
   * the parts SHOULD be as follows:
   *  - componentName: Human-readable name for the component. MUST not contain a colon, in the name,
   *    since colon is used as a separator
   *  - metricName: Name of the metrics that the status is reported for. MUST not contain a colon,
   *    in the name, since colon is used as a separator and can be one of:
   *      - Pre-defined value from this spec. Pre-defined values include:
   *         - utilization
   *         - responseTime
   *         - connections
   *         - uptime
   *      - A common and standard term from a well-known source such as schema.org, IANA or
   *        microformats.
   *      - A URI that indicates extra semantics and processing rules that MAY be provided by a
   *        resource at the other end of the URI. URIs do not have to be dereferenceable, however.
   *        They are just a namespace, and the meaning of a namespace CAN be provided by any
   *        convenient means (e.g. publishing an RFC, Swagger document or a nicely printed book).
   */
  checks?: Checks;
  /** Unique identifier of the service, in the application scope */
  serviceId?: string;
  /** Human-friendly description of the service */
  description?: string;
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
}
