/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Status code enumeration */
export enum StatusCode {
  /**
   * An interim Response used to inform the Producer that the Consumer has accepted the Command but
   * has not yet completed it
   */
  Processing = 102,
  /** The Command has succeeded */
  OK = 200,
  /**
   * The Consumer cannot process the Command due to something that is perceived to be a Producer
   * error (e.g., malformed Command syntax)
   */
  BadRequest = 400,
  /**
   * The Command Message lacks valid authentication credentials for the target resource or
   * authorization has been refused for the submitted credentials
   */
  Unauthorized = 401,
  /** The Consumer understood the Command but refuses to authorize it */
  Forbidden = 403,
  /** The Consumer has not found anything matching the Command */
  NotFound = 404,
  /**
   * The Consumer encountered an unexpected condition that prevented it from performing the
   * Command
   */
  InternalError = 500,
  /** The Consumer does not support the functionality required to perform the Command */
  NotImplemented = 501,
  /**
   * The Consumer is currently unable to perform the Command due to a temporary overloading or
   * maintenance of the Consumer
   */
  ServiceUnavailable = 503,
}
