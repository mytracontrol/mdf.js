/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/**
 * Object with the key information of the requested resource in the REST API context
 * @category Boom
 * @public
 */
export interface APISource {
  /** Pointer to the associated resource in the request [e.g."data/job/title"] */
  pointer: string;
  /** A string indicating which URI query parameter caused the error */
  parameter: {
    [x: string]: any;
  };
}
