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

export class MySlowTapPlug extends EventEmitter implements Plugs.Sink.Tap {
  name = 'MyTapPlug';
  componentId = v4();
  shouldReject = false;
  constructor() {
    super();
  }
  public get checks(): Health.API.Checks {
    return {};
  }
  public single(job: Plugs.Sink.JobObject): Promise<void> {
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
}
