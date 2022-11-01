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

/** A "Device" Target MUST contain at least one property */
export interface Device {
  /** An identifier that refers to this device within an inventory or management system */
  device_id?: string;
  /** A hostname that can be used to connect to this device over a network */
  hostname?: string;
  /** An internationalized hostname that can be used to connect to this device over a network */
  idn_hostname?: string;
}
