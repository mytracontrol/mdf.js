/* istanbul ignore file */
/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { v4 } from 'uuid';

export class OurComponent extends EventEmitter implements Layer.App.Component {
  componentId: string = v4();
  constructor(
    public name: string,
    public error?: Crash | Error
  ) {
    super();
  }
  public emitError(error: Crash | Error): void {
    this.emit('error', error);
  }
}
