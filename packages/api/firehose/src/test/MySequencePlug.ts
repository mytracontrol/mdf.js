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
}
