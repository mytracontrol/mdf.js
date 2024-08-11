/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Check } from './Check.i';

/** String alias type for a component name */
export type ComponentName = string;
/** String alias type for a measurement name */
export type MeasurementName = string;
/** A check entry is a string that represents a unique key in the checks object */
export type CheckEntry = `${ComponentName}:${MeasurementName}`;
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
export type Checks<T = any> = {
  [entry in CheckEntry]: Check<T>[];
};
