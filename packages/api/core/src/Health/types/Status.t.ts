/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Indicates whether the service status is acceptable or not. API publishers SHOULD use following
 * values for the field.
 * The value of the status field is tightly related with the HTTP response code returned by the
 * health endpoint. For “pass” and “warn” statuses HTTP response code in the 2xx-3xx range MUST be
 * used. For “fail” status HTTP response code in the 4xx-5xx range MUST be used. In case of the
 * “warn” status, endpoint SHOULD return HTTP status in the 2xx-3xx range and additional information
 * SHOULD be provided, utilizing optional fields of the response.
 * A health endpoint is only meaningful in the context of the component it indicates the health of.
 * It has no other meaning or purpose. As such, its health is a conduit to the health of the
 * component. Clients SHOULD assume that the HTTP response code returned by the health endpoint is
 * applicable to the entire component (e.g. a larger API or a microservice). This is compatible with
 * the behavior that current infrastructural tooling expects: load-balancers, service discoveries
 * and others, utilizing health-checks.
 */
export const STATUS = ['pass', 'fail', 'warn'] as const;
export type Status = (typeof STATUS)[number];
