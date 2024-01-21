/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

export class MyQuickJetPlug extends EventEmitter implements Plugs.Sink.Jet {
  name = 'MyQuickJetPlug';
  componentId = v4();
  shouldReject = 0;
  irresolvable = false;
  constructor() {
    super();
  }
  public get checks(): Health.Checks {
    return {};
  }
  public single(job: Jobs.JobObject): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.shouldReject > 0) {
        this.shouldReject--;
        if (this.irresolvable) {
          reject(new Crash('Was rejected by my own', v4(), { name: 'IrresolvableError' }));
        } else {
          reject(new Error('Was rejected by my own'));
        }
      } else {
        resolve();
      }
    });
  }
  public multi(jobs: Jobs.JobObject[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.shouldReject > 0) {
        this.shouldReject--;
        if (this.irresolvable) {
          reject(new Crash('Was rejected by my own', v4(), { name: 'IrresolvableError' }));
        } else {
          reject(new Error('Was rejected by my own'));
        }
      } else {
        resolve();
      }
    });
  }
  public start(): Promise<void> {
    return Promise.resolve();
  }
  public stop(): Promise<void> {
    return Promise.resolve();
  }
}
