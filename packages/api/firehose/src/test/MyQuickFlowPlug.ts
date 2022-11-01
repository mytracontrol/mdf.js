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
import { Health } from '@mdf/core';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

export class MyQuickFlowPlug extends EventEmitter implements Plugs.Source.Flow {
  paused = true;
  counter = 0;
  name = 'MyFlowPlug';
  componentId = v4();
  founded = true;
  constructor(public max: number = -1) {
    super();
  }
  public init(): void {
    this.paused = false;
    while (!this.paused && (this.max === -1 || this.counter < this.max)) {
      this.emit('data', {
        data: this.counter + 1,
        type: 'myType',
        jobId: (this.counter + 1).toString(),
        headers: {
          'x-my-header': 'my-header-value',
        },
      });
      this.counter = this.counter + 1;
    }
  }
  public pause(): void {
    this.paused = true;
  }
  public postConsume(jobId: string): Promise<string | undefined> {
    return Promise.resolve(this.founded ? jobId : undefined);
  }
  public get checks(): Health.API.Checks {
    return {};
  }
}
