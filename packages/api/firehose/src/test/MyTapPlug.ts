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
import { Crash } from '@mdf/crash';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import {} from '../Engine';
import { Plugs } from '../types';

export class MyTapPlug extends EventEmitter implements Plugs.Sink.Tap {
  name = 'MyTapPlug';
  componentId = v4();
  shouldReject = 0;
  irresolvable = false;
  constructor() {
    super();
  }
  public get checks(): Health.API.Checks {
    return {};
  }
  public single(job: Plugs.Sink.JobObject): Promise<void> {
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
            resolve();
          }
        });
      }
    });
  }
}
