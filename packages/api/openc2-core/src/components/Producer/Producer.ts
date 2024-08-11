/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { cloneDeep } from 'lodash';
import { Accessors, Checkers, Helpers } from '../../helpers';
import { Control, ProducerAdapter, ProducerOptions } from '../../types';
import { Component } from '../Component';
import { ConsumerMap } from './ConsumerMap';
import { AdapterWrapper } from './core';

const DEFAULT_AGING_CHECK_INTERVAL = 1000 * 60; // 1 minute
const DEFAULT_MAX_AGE = DEFAULT_AGING_CHECK_INTERVAL * 3; // 3 minutes

export declare interface Producer {
  /**
   * Add a listener for the `error` event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Add a listener for the `error` event, emitted when the component detects an error.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  addListener(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Add a listener for the `error` event, emitted when the component detects an error. This is a
   * one-time event, the listener will be removed after the first emission.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  once(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Removes the specified listener from the listener array for the `error` event.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  off(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Removes the specified listener from the listener array for the `error` event.
   * @param event - `error` event
   * @param listener - Error event listener
   * @event
   */
  removeListener(event: 'error', listener: (error: Crash | Error) => void): this;
  /**
   * Removes all listeners, or those of the specified event.
   * @param event - `error` event
   */
  removeAllListeners(event?: 'error'): this;
  /**
   * Add a listener for the `status` event, emitted when the component changes its status.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  on(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Add a listener for the `status` event, emitted when the component changes its status.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  addListener(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Add a listener for the `status` event, emitted when the component changes its status. This is a
   * one-time event, the listener will be removed after the first emission.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  once(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Removes the specified listener from the listener array for the `status` event.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  off(event: 'status', listener: (status: Health.Status) => void): this;
  /**
   * Removes the specified listener from the listener array for the `status` event.
   * @param event - `status` event
   * @param listener - Status event listener
   * @event
   */
  removeListener(event: 'status', listener: (status: Health.Status) => void): this;
}

export class Producer extends Component<AdapterWrapper, ProducerOptions> {
  /** Lookup timer */
  private lookupTimer?: NodeJS.Timeout;
  /** Consumer Map*/
  public readonly consumerMap: ConsumerMap;
  /**
   * Regular OpenC2 producer implementation.
   * @param adapter - transport adapter
   * @param options - configuration options
   */
  constructor(adapter: ProducerAdapter, options: ProducerOptions) {
    super(new AdapterWrapper(adapter, options.retryOptions), options);
    this.consumerMap = new ConsumerMap(
      this.name,
      this.options.agingInterval || DEFAULT_AGING_CHECK_INTERVAL,
      this.options.maxAge || DEFAULT_MAX_AGE
    );
    this._router.on('command', this.onCommandHandler);
    this.health.add(this.consumerMap);
    // Stryker disable next-line all
    this.logger.debug(`OpenC2 Producer created - [${options.id}]`);
  }
  /** Initialize the OpenC2 component */
  protected startup(): Promise<void> {
    if (!this.lookupTimer && this.options.lookupInterval && this.options.lookupTimeout) {
      this.lookupTimer = setInterval(this.lookup, this.options.lookupInterval);
    }
    return Promise.resolve();
  }
  /** Shutdown the OpenC2 component */
  protected shutdown(): Promise<void> {
    if (this.lookupTimer) {
      clearInterval(this.lookupTimer);
      this.lookupTimer = undefined;
    }
    return Promise.resolve();
  }
  /**
   * Issue a new command to the requested consumers. If '*' is indicated as a consumer, the command
   * will be broadcasted. If an `actuator` is indicated in the command the command will not be
   * broadcasted even if it include the '*' symbol.
   * @param command - Command to be issued
   * @returns
   */
  public async command(command: Control.CommandMessage): Promise<Control.ResponseMessage[]>;
  /**
   * Issue a new command to the requested consumers. If '*' is indicated as a consumer, the command
   * will be broadcasted. If an `actuator` is indicated in the command the command will not be
   * broadcasted even if it include the '*' symbol.
   * @param to - Consumer objetive of this command
   * @param content - Command to be issued
   * @param id - producer identification
   * @returns
   */
  public async command(to: string[], content: Control.Command): Promise<Control.ResponseMessage[]>;
  /**
   * Issue a new command to the requested consumers. If '*' is indicated as a consumer, the command
   * will be broadcasted.
   * @param to - Consumer objetive of this command
   * @param action - command action
   * @param target - command target
   * @returns
   */
  public async command(
    to: string[],
    action: Control.Action,
    target: Control.Target
  ): Promise<Control.ResponseMessage[]>;
  public async command(
    to: string[] | Control.CommandMessage,
    content?: Control.Command | Control.Action,
    target?: Control.Target
  ): Promise<Control.ResponseMessage[]> {
    try {
      const command = this.getCommand(to, content, target);
      // Stryker disable all
      this.logger.debug(`Request for command: ${command.request_id}`);
      this.logger.silly(`Direction: ${command.from} - ${command.to}`);
      this.logger.silly(
        `Command: ${command.content.action} - ${JSON.stringify(command.content.target, null, 2)}`
      );
      // Stryker enable all
      if (command.content.args?.response_requested !== Control.ResponseType.None) {
        return this.waitForResponse(command);
      } else {
        // Stryker disable next-line all
        this.logger.debug(`Response not requested for command: ${command.request_id}`);
        await this.adapter.publish(command);
        return [];
      }
    } catch (error) {
      this.onErrorHandler(error);
      throw error;
    }
  }
  /**
   * Process incoming command message from the router
   * @param incomingMessage - incoming message
   * @param done - callback to return the response
   */
  private readonly onCommandHandler = (
    incomingMessage: Control.CommandMessage,
    done: (error?: Crash, response?: Control.ResponseMessage[]) => void
  ) => {
    this.command(incomingMessage)
      .then(result => done(undefined, result))
      .catch(error => done(error, undefined));
  };
  /** Perform the lookup of OpenC2 consumers */
  private readonly lookup: () => void = () => {
    const command = Helpers.queryFeatures(this.options.lookupTimeout || 30000);
    // Stryker disable next-line all
    this.logger.debug(`New lookup command will be emitted`);
    this.command(['*'], command)
      .then(responses => {
        this.consumerMap.update(responses);
      })
      .catch(rawError => {
        const error = Crash.from(rawError);
        this.onErrorHandler(
          new Crash(`Error performing a new lookup: ${error.message}`, this.componentId, {
            cause: rawError,
          })
        );
      });
  };
  /**
   * Get and validate the command message to be published
   * @param destinationsOrCommand - destination of command defined in content or command itself
   * @param contentOrAction - Command to be issued
   * @param id - producer identification
   * @returns
   */
  private getCommand(
    destinationsOrCommand: string[] | Control.CommandMessage,
    contentOrAction?: Control.Command | Control.Action,
    target?: Control.Target
  ): Control.CommandMessage {
    let message: Control.CommandMessage;
    if (
      !Array.isArray(destinationsOrCommand) &&
      contentOrAction === undefined &&
      destinationsOrCommand
    ) {
      message = destinationsOrCommand;
    } else if (
      Array.isArray(destinationsOrCommand) &&
      typeof contentOrAction === 'object' &&
      target === undefined
    ) {
      message = Helpers.createCommand(destinationsOrCommand, contentOrAction, this.options.id);
    } else if (
      Array.isArray(destinationsOrCommand) &&
      typeof contentOrAction === 'string' &&
      typeof target === 'object'
    ) {
      message = Helpers.createCommandByAction(
        destinationsOrCommand,
        contentOrAction,
        target,
        this.options.id
      );
    } else {
      throw new Crash(`Invalid type of parameters in command creation`, this.componentId);
    }
    return Checkers.isValidCommandSync(message, this.adapter.componentId);
  }
  /**
   * Wait for the response to an issued command
   * @param command - issued command
   */
  private waitForResponse(command: Control.CommandMessage): Promise<Control.ResponseMessage[]> {
    if (
      command.to.includes('*') ||
      command.to.length > 1 ||
      Accessors.getActuatorsFromCommandMessage(command).length > 0
    ) {
      return this.waitForBroadCastResponses(command);
    } else {
      return Promise.all(
        command.to.map(consumer => {
          const singleConsumerCommand = cloneDeep(command);
          singleConsumerCommand.to = [consumer];
          return this.waitForConsumerResponse(singleConsumerCommand);
        })
      );
    }
  }
  /**
   * Wait for the response of several consumers during the defined duration in the command
   * @param command - issued command
   * @returns
   */
  private waitForBroadCastResponses(
    command: Control.CommandMessage
  ): Promise<Control.ResponseMessage[]> {
    return new Promise((resolve, reject) => {
      const requestId = command.request_id;
      const responses: Control.ResponseMessage[] = [];
      const timeout = Accessors.getDelayFromCommandMessage(command);
      // Stryker disable next-line all
      this.logger.debug(`Timeout for responses to command ${requestId}: ${timeout} ms`);
      // *******************************************************************************************
      // #region Incoming response handler
      const broadcastResponseHandler = this.getBroadcastResponseHandler(command, responses);
      // #endregion
      // *******************************************************************************************
      // #region On timeout event handler
      const onTimeout: () => void = () => {
        // Stryker disable next-line all
        this.logger.debug(
          `Timeout complete for command: ${requestId}, all the responses will be resolved`
        );
        this.adapter.off(requestId, broadcastResponseHandler);
        resolve(responses);
      };
      // #endregion
      // *******************************************************************************************
      // #region On directly responses to publish method
      const onDirectResponse = (
        result: void | Control.ResponseMessage | Control.ResponseMessage[]
      ) => {
        if (result) {
          const directResponses = Array.isArray(result) ? result : [result];
          for (const response of directResponses) {
            broadcastResponseHandler(response);
          }
          this.adapter.off(requestId, broadcastResponseHandler);
          clearTimeout(timeoutTimer);
          resolve(directResponses);
        }
      };
      // #endregion
      // *******************************************************************************************
      // #region On error on publish method
      const onPublishError = (rawError: unknown) => {
        clearTimeout(timeoutTimer);
        this.adapter.off(requestId, broadcastResponseHandler);
        const error = Crash.from(rawError);
        const publishingError = new Crash(
          `Error publishing command to control channel: ${error.message}`,
          this.componentId,
          { cause: error }
        );
        this.onErrorHandler(publishingError);
        reject(publishingError);
      };
      // #endregion
      // *******************************************************************************************
      // #region Subscription to responses
      this.adapter.on(requestId, broadcastResponseHandler);
      const timeoutTimer = setTimeout(onTimeout, timeout);
      this.adapter.publish(command).then(onDirectResponse).catch(onPublishError);
    });
  }
  /**
   * Wait for the response of several consumers during the defined duration in the command
   * @param command - issued command
   * @param responses - responses array
   */
  private getBroadcastResponseHandler(
    command: Control.CommandMessage,
    responses: Control.ResponseMessage[]
  ): (incomingMessage: Control.Message) => void {
    const requestId = command.request_id;
    return (incomingMessage: Control.Message) => {
      try {
        const message = Checkers.isValidResponseSync(incomingMessage, this.componentId);
        // Stryker disable next-line all
        this.logger.debug(`New message from ${message.from} - ${message.request_id}`);
        if (!Checkers.isResponseToInstance(message, command.from, requestId)) {
          // Stryker disable next-line all
          this.logger.debug(`${message.request_id} is not a response for this instance`);
          return;
        } else if (message.request_id === requestId) {
          this.register.push(message);
          if (message.status >= 200) {
            // Stryker disable next-line all
            this.logger.debug(`Response from: [${message.from}] received`);
            responses.push(message);
          } else {
            // Stryker disable next-line all
            this.logger.debug(`ACK from: [${message.from}] received`);
            if (command.content.args?.response_requested === Control.ResponseType.ACK) {
              responses.push(message);
            }
          }
        }
      } catch (rawError) {
        this.onProcessingMessageError(rawError);
      }
    };
  }
  /**
   * Wait for the response to an issued command from one consumer
   * @param command - issued command
   */
  private waitForConsumerResponse(
    command: Control.CommandMessage
  ): Promise<Control.ResponseMessage> {
    return new Promise((resolve, reject) => {
      const requestId = command.request_id;
      const timeout = Accessors.getDelayFromCommandMessage(command);
      // Stryker disable next-line all
      this.logger.debug(`Timeout for responses to command ${requestId}: ${timeout} ms`);
      // *******************************************************************************************
      // #region Incoming response handler
      const consumerResponseHandler = (incomingMessage: Control.Message): void => {
        try {
          const message = Checkers.isValidResponseSync(incomingMessage, this.componentId);
          // Stryker disable next-line all
          this.logger.debug(`New message from ${message.from} - ${message.request_id}`);
          if (!Checkers.isResponseToInstance(message, command.from, requestId)) {
            // Stryker disable next-line all
            this.logger.debug(`${message.request_id} is not a response for this instance`);
          } else if (message.request_id === requestId) {
            try {
              const result = this.handlerMessage(message, command);
              if (result) {
                clearTimeout(timeoutTimer);
                this.adapter.off(requestId, consumerResponseHandler);
                resolve(result);
              }
            } catch (rawError) {
              clearTimeout(timeoutTimer);
              this.adapter.off(requestId, consumerResponseHandler);
              reject(rawError);
            }
          }
        } catch (rawError) {
          this.onProcessingMessageError(rawError);
        }
      };
      // #endregion
      // *******************************************************************************************
      // #region On timeout event handler
      const onTimeout: () => void = () => {
        const timeOutError = new Crash(
          `Response timeout for the command ${requestId} [${command.content.action}]`,
          requestId
        );
        this.logger.debug(timeOutError.message);
        this.adapter.off(requestId, consumerResponseHandler);
        reject(timeOutError);
      };
      // #endregion
      // *******************************************************************************************
      // #region On directly responses to publish method
      const onDirectResponse = (
        result: void | Control.ResponseMessage | Control.ResponseMessage[]
      ) => {
        if (Array.isArray(result)) {
          clearTimeout(timeoutTimer);
          this.adapter.off(requestId, consumerResponseHandler);
          reject(
            new Crash(
              `Command to a single destination was resolved with multiple responses: ${result.length}`,
              requestId,
              { info: result }
            )
          );
        } else if (result) {
          consumerResponseHandler(result);
        }
      };
      // #endregion
      // *******************************************************************************************
      // #region On error on publish method
      const onPublishError = (rawError: unknown) => {
        clearTimeout(timeoutTimer);
        this.adapter.off(requestId, consumerResponseHandler);
        const error = Crash.from(rawError);
        const publishingError = new Crash(
          `Error publishing command to control channel: ${error.message}`,
          this.componentId,
          { cause: error }
        );
        this.onErrorHandler(publishingError);
        reject(publishingError);
      };
      // #endregion
      this.adapter.on(requestId, consumerResponseHandler);
      const timeoutTimer = setTimeout(onTimeout, timeout);
      this.adapter.publish(command).then(onDirectResponse).catch(onPublishError);
    });
  }
  private handlerMessage(
    message: Control.ResponseMessage,
    command: Control.CommandMessage
  ): Control.ResponseMessage | undefined {
    this.register.push(message);
    if (message.status >= 200 && message.status < 300) {
      // Stryker disable next-line all
      this.logger.debug(`Response from: [${message.from}] received - Fulfilled`);
      return message;
    } else if (message.status >= 300) {
      // Stryker disable next-line all
      this.logger.warn(`Response from: [${message.from}] received - Not fulfilled`);
      throw new Crash(`Command was not fulfilled: [status ${message.status}]`, message.request_id);
    } else {
      // Stryker disable next-line all
      this.logger.debug(`ACK from: [${message.from}] received`);
      if (command.content.args?.response_requested === Control.ResponseType.ACK) {
        return message;
      }
      return undefined;
    }
  }
  /**
   * Handle errors processing incoming messages
   * @param rawError - raw error
   */
  private readonly onProcessingMessageError = (rawError: unknown) => {
    const error = Crash.from(rawError);
    const processingError = new Crash(
      `Error processing incoming response message from control chanel: ${error.message}`,
      this.componentId,
      { cause: error }
    );
    this.onErrorHandler(processingError);
  };
}
