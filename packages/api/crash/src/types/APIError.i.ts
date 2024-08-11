/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { APISource } from './APISource.i';
import { Links } from './Links.t';
/**
 * Standardized response interface in REST API services for errors
 * @category Boom
 * @public
 */
export interface APIError {
  /** UUID V4, unique identifier for this particular occurrence of the problem */
  uuid: string;
  /**
   * Links that leads to further details about this particular occurrence of the problem.
   * A link MUST be represented as either:
   *  - self: a string containing the link’s URL
   *  - related: an object (“link object”) which can contain the following members:
   *    - href: a string containing the link’s URL.
   *    - meta: a meta object containing non-standard meta-information about the link.
   */
  links?: Links;
  /** HTTP Status code */
  status: number;
  /** REST API specific error code */
  code: string;
  /** Human-readable summary of problem that SHOULD NOT change from occurrence to occurrence */
  title: string;
  /** Human-readable explanation specific to this occurrence of the problem */
  detail?: string;
  /** An object containing references to the source of the error */
  source?: APISource;
  /** A meta object containing non-standard meta-information about the error */
  meta?: {
    [x: string]: any;
  };
}
