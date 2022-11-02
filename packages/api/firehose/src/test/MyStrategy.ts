/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Jobs } from '@mdf.js/core';

export class MyStrategy implements Jobs.Strategy {
  constructor(public readonly name: string, public readonly count: number | string) {}
  public do(process: Jobs.JobObject): Jobs.JobObject {
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
