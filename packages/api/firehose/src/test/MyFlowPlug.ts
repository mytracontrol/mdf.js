/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health } from '@mdf.js/core';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

export class MyFlowPlug extends EventEmitter implements Plugs.Source.Flow {
  timeInterval?: NodeJS.Timeout;
  counter = 0;
  name = 'MyFlowPlug';
  componentId = v4();
  founded = true;
  constructor(public max: number = -1) {
    super();
  }
  public init(): void {
    if (!this.timeInterval) {
      this.timeInterval = setInterval(() => {
        if (this.max === -1 || this.counter < this.max) {
          this.emit('data', {
            data: this.counter + 1,
            type: 'myType',
            jobUserId: (this.counter + 1).toString(),
            options: {
              headers: {
                'x-my-header': 'my-header-value',
              },
            },
          });
          this.counter = this.counter + 1;
        }
      }, 20);
    }
  }
  public pause(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = undefined;
    }
  }
  public postConsume(jobId: string): Promise<string | undefined> {
    return Promise.resolve(this.founded ? jobId : undefined);
  }
  public get checks(): Health.Checks {
    return {};
  }
  public start(): Promise<void> {
    return Promise.resolve();
  }
  public stop(): Promise<void> {
    clearInterval(this.timeInterval);
    return Promise.resolve();
  }
}
