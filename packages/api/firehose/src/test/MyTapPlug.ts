/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { Counter, Registry } from 'prom-client';
import { v4 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

export class MyTapPlug extends EventEmitter implements Plugs.Sink.Tap {
  name = 'MyTapPlug';
  componentId = v4();
  shouldReject = 0;
  irresolvable = false;
  myMetrics: Registry = new Registry();
  counter = new Counter({
    name: 'my_counter',
    help: 'my counter help',
    labelNames: ['plug'],
    registers: [this.myMetrics],
  });
  constructor() {
    super();
    this.myMetrics.resetMetrics();
  }
  public get checks(): Health.Checks {
    return {};
  }
  public single(job: Jobs.JobObject): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!job) {
        reject(new Crash('Job is required'));
      } else {
        process.nextTick(() => {
          if (this.shouldReject > 0) {
            this.shouldReject--;
            if (this.irresolvable) {
              reject(new Crash('Was rejected by my own', v4(), { name: 'IrresolvableError' }));
            } else {
              reject(new Error('Was rejected by my own'));
            }
          } else {
            this.counter.inc({ plug: this.name });
            resolve();
          }
        });
      }
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
  public get metrics(): Registry {
    return this.myMetrics;
  }
}
