/* istanbul ignore file */
/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import EventEmitter from 'events';
import { v4 } from 'uuid';

export class OurProvider extends EventEmitter implements Health.Component {
  actualStateDate: string;
  componentId: string = v4();
  _status: Health.Status;
  constructor(public name: string, status: Health.Status) {
    super();
    this._status = status;
    this.actualStateDate = new Date().toISOString();
  }
  get status(): Health.Status {
    return this._status;
  }
  get checks(): Health.Checks {
    return {
      [`${this.name}:${this._status}`]: [
        {
          componentId: this.componentId,
          componentType: 'component',
          observedValue: this._status,
          output: undefined,
          status: this._status,
          time: this.actualStateDate,
        },
      ],
    };
  }
}
