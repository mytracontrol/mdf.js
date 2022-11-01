/* istanbul ignore file */
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

import { Health } from '@mdf.js/core';
import EventEmitter from 'events';
import { v4 } from 'uuid';

export class OurProvider extends EventEmitter implements Health.Component {
  actualStateDate: string;
  componentId: string = v4();
  _status: Health.API.Status;
  constructor(public name: string, status: Health.API.Status) {
    super();
    this._status = status;
    this.actualStateDate = new Date().toISOString();
  }
  get status(): Health.API.Status {
    return this._status;
  }
  get checks(): Health.API.Checks {
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
  get health(): Health.API.Health {
    return {
      status: this.status,
      checks: this.checks,
    };
  }
}
