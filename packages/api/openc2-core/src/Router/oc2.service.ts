/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { Accessors } from '../helpers';
import { Control } from '../types';
import { Model } from './oc2.model';

export type CommandResponse = Control.ResponseMessage | Control.ResponseMessage[];
export type CommandResponseHandler = (error?: Crash | Error, message?: CommandResponse) => void;
export declare interface Service {
  /** Event emitted when a command is received */
  on(
    event: 'command',
    listener: (message: Control.CommandMessage, done: CommandResponseHandler) => void
  ): this;
}
/** Service class */
export class Service extends EventEmitter {
  /**
   * Create an instance of service
   * @param model - model instance
   */
  constructor(private readonly model: Model) {
    super();
  }
  /** Return array of messages used as fifo registry */
  public async messages(): Promise<Control.Message[]> {
    return this.model.messages();
  }
  /** Return array of jobs used as fifo registry */
  public async jobs(): Promise<Jobs.Result<'command'>[]> {
    return this.model.jobs();
  }
  /** Return array of pendingJobs used as fifo registry */
  public async pendingJobs(): Promise<Jobs.Result<'command'>[]> {
    return this.model.pendingJobs();
  }
  /**
   * Execute a command over the producer or consumer
   * @param message - message to be processed
   * @returns - response message
   */
  public async command(message: Control.CommandMessage): Promise<CommandResponse | undefined> {
    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined = undefined;
      const onTimeout = () => {
        reject(new Crash('Command timeout'));
      };
      const done: CommandResponseHandler = (error?: Crash | Error, response?: CommandResponse) => {
        if (timeout) {
          clearTimeout(timer);
          timer = undefined;
        }
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      };
      const timeout = Accessors.getDelayFromCommandMessage(message);
      timer = setTimeout(onTimeout, timeout);
      this.emit('command', message, done);
    });
  }
}
