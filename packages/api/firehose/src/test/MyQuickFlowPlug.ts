/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health } from '@mdf.js/core';
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
        jobUserId: (this.counter + 1).toString(),
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
  public get checks(): Health.Checks {
    return {};
  }
  public start(): Promise<void> {
    return Promise.resolve();
  }
  public stop(): Promise<void> {
    return Promise.resolve();
  }
  public get status(): Health.Status {
    return Health.STATUS.PASS;
  }
  public close(): Promise<void> {
    return this.stop();
  }
}
