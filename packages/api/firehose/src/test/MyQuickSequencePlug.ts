/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { v4, v5 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

const MDF_NAMESPACE_OID = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
export class MyQuickSequencePlug extends EventEmitter implements Plugs.Source.Sequence {
  counter = 0;
  name = 'MySequencePlug';
  componentId = v4();
  founded = true;
  asArray = true;
  rejected = 0;
  done = false;
  constructor(public shouldReject: number = 0) {
    super();
  }
  public get checks(): Health.Checks {
    return {};
  }
  public ingestData(size: number): Promise<Jobs.JobRequest | Jobs.JobRequest[]> {
    return new Promise((resolve, reject) => {
      const result = [];
      for (let i = 0; i < size; i++) {
        result.push({
          uuid: v4(),
          jobUserUUID: v5((this.counter + 1).toString(), MDF_NAMESPACE_OID),
          data: this.counter + 1,
          type: 'myType',
          jobUserId: (this.counter + 1).toString(),
        });
        this.counter += 1;
      }
      if (!this.done) {
        resolve(result);
      }
      this.done = true;
    });
  }
  public postConsume(jobId: string): Promise<string | undefined> {
    if (this.rejected !== this.shouldReject) {
      this.rejected += 1;
      return Promise.reject(new Crash('my reason to reject'));
    } else {
      return Promise.resolve(this.founded ? jobId : undefined);
    }
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
