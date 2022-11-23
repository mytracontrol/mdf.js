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

export class MySequencePlug extends EventEmitter implements Plugs.Source.Sequence {
  counter = 0;
  name = 'MySequencePlug';
  componentId = v4();
  founded = true;
  asArray = true;
  constructor() {
    super();
  }
  public get checks(): Health.API.Checks {
    return {};
  }
  public ingestData(size: number): Promise<Plugs.Source.JobObject | Plugs.Source.JobObject[]> {
    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        if (this.asArray) {
          const result = [];
          for (let i = 0; i < size; i++) {
            result.push({
              data: this.counter + 1,
              type: 'myType',
              jobId: (this.counter + 1).toString(),
              headers: {
                'x-my-header': 'my-header-value',
              },
            });
            this.counter += 1;
          }
          resolve(result);
        } else {
          resolve({ data: this.counter + 1, type: 'myType', jobId: (this.counter + 1).toString() });
          this.counter += 1;
        }
      });
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
