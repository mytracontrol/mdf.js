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
import { Jobs } from '@mdf/core';

export class MyStrategy implements Jobs.Strategy {
  constructor(public readonly name: string, public readonly count: number | string) {}
  public do(process: Jobs.Object): Jobs.Object {
    if (typeof this.count === 'number') {
      process.data = process.data + this.count;
    } else if (typeof this.count === 'string') {
      process.data = null;
    } else {
      throw new Error('Invalid count');
    }
    return process;
  }
}
