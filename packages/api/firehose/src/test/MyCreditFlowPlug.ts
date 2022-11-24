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

export class MyCreditsFlowPlug extends EventEmitter implements Plugs.Source.CreditsFlow {
  timeInterval?: NodeJS.Timeout;
  counter = 0;
  credits = 0;
  name = 'MyCreditsFlowPlug';
  componentId = v4();
  founded = true;
  constructor() {
    super();
  }
  public addCredits(credits: number): void {
    if (!this.timeInterval) {
      this.credits = credits;
      this.timeInterval = setInterval(() => {
        if (credits) {
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
          this.credits = this.credits - 1;
        }
      }, 20);
    }
  }
  public postConsume(jobId: string): Promise<string | undefined> {
    return Promise.resolve(this.founded ? jobId : undefined);
  }
  public get checks(): Health.API.Checks {
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
