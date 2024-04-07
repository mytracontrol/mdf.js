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

export class MySlowTapPlug extends EventEmitter implements Plugs.Sink.Tap {
  name = 'MyTapPlug';
  componentId = v4();
  shouldReject = false;
  constructor() {
    super();
  }
  public get checks(): Health.Checks {
    return {};
  }
  public single(job: Jobs.JobObject): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (this.shouldReject) {
          reject(new Error('MyError'));
        } else {
          resolve();
        }
      }, 1000);
    });
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
