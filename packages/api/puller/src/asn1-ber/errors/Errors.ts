/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export class InvalidAsn1Error extends Error {
  /**
   * Creates an instance of InvalidAsn1Error.
   * @param msg - Error message
   */
  constructor(msg?: string) {
    super(msg);
    this.name = 'InvalidAsn1Error';
  }
}
