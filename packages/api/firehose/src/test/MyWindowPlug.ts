/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Jobs } from '@mdf.js/core';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

export class MyWindowPlug extends EventEmitter implements Plugs.Source.Sequence {
  timeInterval?: NodeJS.Timeout;
  counter = 0;
  name = 'MyWindowPlug';
  componentId = v4();
  founded = true;
  shouldReject = false;
  constructor(public max = -1) {
    super();
  }
  public get checks(): Health.Checks {
    return {};
  }
  public ingestData(size: number): Promise<Jobs.JobRequest> {
    let count = 0;
    return new Promise((resolve, reject) => {
      if (this.shouldReject) {
        reject(new Error('Error'));
      } else if (this.max !== -1 && this.counter >= this.max) {
        return;
      } else {
        while (count < size) {
          count++;
          this.counter++;
          if (count < size) {
            this.emit('data', {
              data: this.counter,
              type: 'myType',
              jobUserId: this.counter.toString(),
              headers: {
                'x-my-header': 'my-header-value',
              },
            });
          } else {
            resolve({
              data: this.counter,
              type: 'myType',
              jobUserId: this.counter.toString(),
              options: {
                headers: {
                  'x-my-header': 'my-header-value',
                },
              },
            });
          }
        }
      }
    });
  }
  public postConsume(jobId: string): Promise<string | undefined> {
    return Promise.resolve(this.founded ? jobId : undefined);
  }
  public start(): Promise<void> {
    return Promise.resolve();
  }
  public stop(): Promise<void> {
    return Promise.resolve();
  }
}
