/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Post-processing strategies for errored files */
export enum PostProcessingStrategy {
  /** Archive the file */
  ARCHIVE = 'archive',
  /** Delete the file */
  DELETE = 'delete',
  /** Zip the file */
  ZIP = 'zip',
}

/** List of post-processing strategies */
export const POST_PROCESSING_STRATEGIES: PostProcessingStrategy[] = [
  PostProcessingStrategy.ARCHIVE,
  PostProcessingStrategy.DELETE,
  PostProcessingStrategy.ZIP,
];
