/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Jobs } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { Accessors, Checkers, Helpers } from '../../helpers';
import {
  CommandJobHandler,
  CommandJobRequest,
  ConsumerAdapter,
  ConsumerOptions,
  Control,
  OnCommandHandler,
  Resolver,
  ResolverEntry,
} from '../../types';
import { Component } from '../Component';
import { AdapterWrapper } from './core';

export declare interface Consumer {
  /** Emitted when a consumer's operation has some error */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Emitted on every state change */
  on(event: 'status', listener: (status: Health.Status) => void): this;
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
    this._router.on('command', this.onCommandHandler);
    // Stryker disable next-line all
    this.logger.debug(`OpenC2 Consumer created - [${options.id}]`);
    this.validateResolver(options);
  }
  /**
   * Validate the resolver map if exists
   * @param options - configuration options
   * @returns
   */
  private validateResolver(options: ConsumerOptions): void {
    if (!options.resolver) {
      return;
    }
    for (const entry of Object.keys(options.resolver)) {
      const { actionType, namespace, target } = this.validateResolverEntry(entry as ResolverEntry);
      if (!this.options.actionTargetPairs[actionType]) {
        throw new Crash(`Invalid resolver entry, action type not supported: ${entry}`, {
          name: 'ValidationError',
        });
      } else if (!this.options.actionTargetPairs[actionType]?.includes(`${namespace}:${target}`)) {
        throw new Crash(`Invalid resolver entry, target not supported: ${entry}`, {
          name: 'ValidationError',
        });
      } else {
        return;
      }
    }
  }
  /**
   * Validate a resolver entry format
   * @param entry - resolver entry to validate
   */
  private validateResolverEntry(entry: ResolverEntry): {
    actionType: Control.ActionType;
    namespace: Control.Namespace;
    target: string;
  } {
    const { 0: actionType, 1: namespace, 2: target } = entry.split(':');
    if (!actionType || !namespace || !target) {
      throw new Crash(`Invalid resolver entry, invalid format: ${entry}`, {
        name: 'ValidationError',
      });
    } else if (!Control.ACTION_TYPES.includes(actionType as Control.ActionType)) {
      throw new Crash(`Invalid resolver entry, unknown action type: ${actionType}`, {
        name: 'ValidationError',
      });
    } else {
      return {
        actionType: actionType as Control.ActionType,
        namespace: namespace as Control.Namespace,
        target,
      };
    }
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
   * @param done - callback to return the response
   */
  private readonly onCommandHandler: OnCommandHandler = (
    incomingMessage: Control.CommandMessage,
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
  private readonly processCommand = async (
    incomingMessage: Control.CommandMessage
  ): Promise<Control.ResponseMessage | undefined> => {
    try {
      const message = Checkers.isValidCommandSync(incomingMessage, this.componentId);
      // Stryker disable next-line all
      this.logger.debug(`New message from ${message.from} - ${message.request_id}`);
      if (Checkers.isCommandToInstance(message, this.options.id)) {
        return this.classifyCommand(message);
      }
      // Stryker disable next-line all
      this.logger.debug(`${message.request_id} is not a command for this instance`);
      return undefined;
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
  };
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
      const resolver = this.getResolver(message);
      if (resolver) {
        return this.resolveCommand(resolver, message);
      } else {
        return this.emitCommandJob(this.createJobFromCommand(message));
      }
    }
  }
  /**
   * Resolve a command message using a resolver
   * @param resolver - resolver function to be executed
   * @param message - message to be processed
   * @returns
   */
  private async resolveCommand(
    resolver: Resolver,
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | undefined> {
    try {
      const target = Accessors.getTargetFromCommand(message.content) as keyof Control.Target;
      const response = await resolver(message.content.target[target]);
      this.logger.info(`Command was resolved successfully`);
      const result =
        response !== undefined && response !== null ? { [target]: response } : undefined;
      return Helpers.ok(message, this.options.id, result);
    } catch (rawError) {
      const cause = Crash.from(rawError);
      // Stryker disable next-line all
      this.logger.error(`Command was resolved with errors: ${cause.message}`);
      return Helpers.internalError(message, this.options.id, cause.trace().join(','));
    }
  }
  /**
   * Execute a job and wait for the resolution
   * @param message - message to be processed as a job for upper layers
   */
  private async emitCommandJob(
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
          this.logger.error(`Job ${commandJob.jobUserId} was finished with errors`);
          response = Helpers.internalError(
            commandJob.data,
            this.options.id,
            `${job.errors?.toString()}`
          );
        } else {
          // Stryker disable next-line all
          this.logger.info(`Job ${commandJob.jobUserId} was finished successfully`);
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
    const jobRequest: CommandJobRequest = {
      jobUserId: message.request_id,
      data: message,
      type: 'command',
      options: {
        headers: { duration: Accessors.getDelayFromCommandMessage(message) },
      },
    };
    return new Jobs.JobHandler(jobRequest);
  }
  /**
   * Check if there is a resolver function for the command in the resolver map
   * @param message - message to be processed
   */
  private getResolver(message: Control.CommandMessage): Resolver | undefined {
    const target = Accessors.getTargetFromCommand(message.content);
    const entry = `${message.content.action}:${target}` as ResolverEntry;
    if (this.options.resolver && this.options.resolver[entry]) {
      return this.options.resolver[entry];
    }
    return undefined;
  }
}
