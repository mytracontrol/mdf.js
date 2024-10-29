/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { PostProcessingStrategy } from './PostProcessingStrategy.t';

/** File task identifiers */
export enum FileTaskIdentifiers {
  ERRORED = 'errored',
  PUSH = 'push',
  DELETE = PostProcessingStrategy.DELETE,
  ARCHIVE = PostProcessingStrategy.ARCHIVE,
  ZIP = PostProcessingStrategy.ZIP,
}
