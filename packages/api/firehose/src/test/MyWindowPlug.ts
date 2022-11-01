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
  public get checks(): Health.API.Checks {
    return {};
  }
  public ingestData(size: number): Promise<Plugs.Source.JobObject> {
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
              jobId: this.counter.toString(),
              headers: {
                'x-my-header': 'my-header-value',
              },
            });
          } else {
            resolve({
              data: this.counter,
              type: 'myType',
              jobId: this.counter.toString(),
              headers: {
                'x-my-header': 'my-header-value',
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
}
