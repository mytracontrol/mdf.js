/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
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
