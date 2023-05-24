/**
 * Copyright 2021 Netin Systems S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin Systems S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin Systems S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin Systems S.L.
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
