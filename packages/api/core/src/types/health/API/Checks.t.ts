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

type ComponentName = string;
type MeasurementName = string;
import { Check } from './Check.i';

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
