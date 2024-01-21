/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export type AuditCategory = 'create' | 'modify' | 'execute' | 'access' | 'delete';
/** Audit options */
export interface AuditConfig {
  /** Access area */
  area: string;
  /** Access mode */
  category: AuditCategory;
  /** Access details */
  details: string;
  /** Include body */
  includeBody?: boolean;
  /** Include params */
  includeParams?: boolean;
  /** Include query */
  includeQuery?: boolean;
}
