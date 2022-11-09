/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, JobHandler } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Accessors, Checkers, Helpers } from '../../helpers';
import {
  CommandJobHandler,
  ConsumerAdapter,
  ConsumerOptions,
  Control,
  OnCommandHandler,
} from '../../types';
import { Component } from '../Component';
import { AdapterWrapper } from './core';

export declare interface Consumer {
  /** Emitted when a consumer's operation has some error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.API.Status) => void): this;
  /** Emitted when a incoming command is received */
  on(event: 'command', listener: (job: CommandJobHandler) => void): this;
}
export class Consumer extends Component<AdapterWrapper, ConsumerOptions> {
  /**
   * Regular OpenC2 consumer implementation.
   * @param adapter - transport adapter
   * @param options - configuration options
   */
  constructor(adapter: ConsumerAdapter, options: ConsumerOptions) {
    super(new AdapterWrapper(adapter, options.retryOptions), options);
    // Stryker disable next-line all
    this.logger.debug(`OpenC2 Consumer created - [${options.id}]`);
  }
  /** Consumer actuators */
  public get actuator(): string[] | undefined {
    return this.options.actuator;
  }
  public set actuator(value: string[] | undefined) {
    this.options.actuator = value;
  }
  /** Consumer profiles */
  public get profiles(): string[] | undefined {
    return this.options.profiles;
  }
  public set profiles(value: string[] | undefined) {
    this.options.profiles = value;
  }
  /** Consumer pairs */
  public get pairs(): Control.ActionTargetPairs {
    return this.options.actionTargetPairs;
  }
  public set pairs(value: Control.ActionTargetPairs) {
    this.options.actionTargetPairs = value;
  }
  /** Initialize the OpenC2 component */
  protected startup(): Promise<void> {
    return this.adapter.subscribe(this.onCommandHandler);
  }
  /** Shutdown the OpenC2 component */
  protected shutdown(): Promise<void> {
    return this.adapter.unsubscribe(this.onCommandHandler);
  }
  /**
   * Process incoming command message from the adapter
   * @param incomingMessage - incoming message
   */
  private readonly onCommandHandler: OnCommandHandler = (
    incomingMessage: Control.Message,
    done: (error?: Crash | Error, message?: Control.ResponseMessage) => void
  ): void => {
    this.processCommand(incomingMessage)
      .then(result => done(undefined, result))
      .catch(error => done(error, undefined));
  };
  /**
   * Process incoming message and return a response if the message is a command that should be
   * responded
   * @param incomingMessage - incoming message
   */
  private async processCommand(
    incomingMessage: Control.Message
  ): Promise<Control.ResponseMessage | undefined> {
    try {
      const message = Checkers.isValidCommandSync(incomingMessage, this.componentId);
      // Stryker disable next-line all
      this.logger.debug(`New message from ${message.from} - ${message.request_id}`);
      if (Checkers.isCommandToInstance(message, this.options.id)) {
        return this.classifyCommand(message);
      }
      // Stryker disable next-line all
      this.logger.debug(`${message.request_id} is not a command for this instance`);
      return;
    } catch (rawError) {
      const error = Crash.from(rawError);
      const crashError = new Crash(
        `Error processing incoming command message from control chanel: ${error.message}`,
        this.componentId,
        { cause: error }
      );
      this.onErrorHandler(crashError);
      throw crashError;
    }
  }
  /**
   * Process incoming command message and select a default response or emit a new job to execute
   * the command
   * @param command - command message to be processed
   */
  private async classifyCommand(
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | undefined> {
    const defaultResponse = Checkers.hasDefaultResponse(message, this.options);
    if (defaultResponse) {
      this.register.push(message);
      // Stryker disable next-line all
      this.logger.debug(`${message.request_id} has default response`);
      return defaultResponse;
    } else {
      return this.executeCommand(this.createJobFromCommand(message));
    }
  }
  /**
   * Execute a job and wait for the resolution
   * @param message - message to be processed as a job for upper layers
   */
  private async executeCommand(
    job: CommandJobHandler
  ): Promise<Control.ResponseMessage | undefined> {
    this.register.push(job);
    return new Promise(resolve => {
      const onCommandJobDone = (uuid: string) => {
        let response: Control.ResponseMessage | undefined;
        const commandJob = this.register.delete(uuid);
        if (!commandJob) {
          response = Helpers.internalError(
            job.data,
            this.options.id,
            `Job ${uuid} is not registered in the consumer. It can't be processed`
          );
        } else if (commandJob.hasErrors) {
          // Stryker disable next-line all
          this.logger.error(`Job ${commandJob.jobId} was finished with errors`);
          response = Helpers.internalError(
            commandJob.data,
            this.options.id,
            `${job.errors?.toString()}`
          );
        } else {
          // Stryker disable next-line all
          this.logger.info(`Job ${commandJob.jobId} was finished successfully`);
          response = Helpers.ok(commandJob.data, this.options.id);
        }
        resolve(response);
      };
      job.once('done', onCommandJobDone);
      this.emit('command', job);
    });
  }
  /**
   * Create a job from a command message
   * @param message - command message
   * @returns
   */
  private createJobFromCommand(message: Control.CommandMessage): CommandJobHandler {
    // Stryker disable next-line all
    this.logger.info(`Job - ${message.content.action}-${Object.keys(message.content.target)[0]}`);
    return new JobHandler(message, message.request_id, 'command', {
      headers: { duration: Accessors.getDelayFromCommandMessage(message) },
    });
  }
}
