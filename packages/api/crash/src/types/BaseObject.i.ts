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

export interface BaseObject {
  /** Name of the error */
  name: string;
  /** Human friendly error message */
  message: string;
  /** Identification of the process, request or transaction where the error appears */
  uuid: string;
  /** Timestamp of the error */
  timestamp: string;
  /** Error subject */
  subject: string;
  /** Extra error information */
  info?: Record<string, unknown>;
}
