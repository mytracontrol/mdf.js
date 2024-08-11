/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';

/** Auxiliary type to define the open strategy */
export type OpenStrategy = Jobs.Strategy<any, any, any, any>;
/** Auxiliary type to define the open job handler */
export type OpenJobHandler = Jobs.JobHandler<any, any, any, any>;
/** Auxiliary type to define the open job request */
export type OpenJobRequest = Jobs.JobRequest<any, any, any, any>;
/** Auxiliary type to define the open job object */
export type OpenJobObject = Jobs.JobObject<any, any, any, any>;
