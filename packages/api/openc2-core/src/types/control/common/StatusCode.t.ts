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
