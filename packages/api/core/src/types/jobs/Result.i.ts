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

import { MultiObject } from '@mdf/crash';
import { Status } from './Status.t';

/** Job result interface */
export interface Result<Type extends string = string> {
  /** Job type */
  type: Type;
  /** Publication process job identification */
  id: string;
  /** Timestamp, in ISO format, of the job creation date */
  createdAt: string;
  /** Timestamp, in ISO format, of the job resolve date */
  resolvedAt: string;
  /** Number of entities processed with success in this job */
  quantity: number;
  /** Flag that indicate that the publication process has some errors */
  hasErrors: boolean;
  /** Array of errors */
  errors?: MultiObject;
  /** Job entry identification */
  jobId: string;
  /** Job status */
  status: Status;
}
