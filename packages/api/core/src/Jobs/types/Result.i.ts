/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { MultiObject } from '@mdf.js/crash';
import { Status } from './Status.t';

/** Job result interface */
export interface Result<Type extends string = string> {
  /** Unique job processing identification */
  uuid: string;
  /** Job type */
  type: Type;
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
  /** User job request identifier, defined by the user */
  jobUserId: string;
  /** Unique user job request identification, based on jobUserId */
  jobUserUUID: string;
  /** Job status */
  status: Status;
}
