/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { get, set } from 'lodash';
import { Checker } from '../modules';
import { ConsumerOptions, Control } from '../types';
import { Accessors } from './Accessors';
import { Helpers } from './Helpers';

const responseRequested = 'content.args.response_requested';
export class Checkers {
  /**
   * Check if the message is a valid message.
   * @param message - message to be check
   * @param uuid - traceability identifier
   * @returns Validated message.
   * @throws In case of invalid message, throw a validation error.
   */
  public static isValidMessageSync(message: Control.Message, uuid: string): Control.Message {
    return Checker.attempt('Control.Message', message, uuid);
  }
  /**
   * Check if the message is a valid message.
   * @param message - message to be check
   * @param uuid - traceability identifier
   * @returns Promise with the validated message.
   */
  public static isValidMessage(message: Control.Message, uuid: string): Promise<Control.Message> {
    return Checker.validate('Control.Message', message, uuid);
  }
  /**
   * Check if the command is a valid command message.
   * @param command - command to be check
   * @param uuid - traceability identifier
   * @returns Validated command message.
   * @throws In case of invalid command, throw a validation error.
   */
  public static isValidCommandSync(command: Control.Message, uuid: string): Control.CommandMessage {
    return Checker.attempt('Control.Message.Command', command, uuid);
  }
  /**
   * Check if the command is a valid command message.
   * @param command - command to be check
   * @param uuid - traceability identifier
   * @returns Promise with the validated command message.
   */
  public static isValidCommand(
    command: Control.Message,
    uuid: string
  ): Promise<Control.CommandMessage> {
    return Checker.validate('Control.Message.Command', command, uuid);
  }
  /**
   * Check if the response is a valid response message
   * @param response - response to be checked
   * @param uuid - traceability identifier
   * @returns Validated response message.
   * @throws In case of invalid response, throw a validation error.
   */
  public static isValidResponseSync(
    response: Control.Message,
    uuid: string
  ): Control.ResponseMessage {
    return Checker.attempt('Control.Message.Response', response, uuid);
  }
  /**
   * Check if the response is a valid response message
   * @param response - response to be checked
   * @param uuid - traceability identifier
   * @returns Promise with the validated response message.
   */
  public static isValidResponse(
    response: Control.Message,
    uuid: string
  ): Promise<Control.ResponseMessage> {
    return Checker.validate('Control.Message.Response', response, uuid);
  }
  /**
   * Checks if the command should be response with a default response
   * @param command - message to be checked
   * @param options - Consumer options
   * @returns Default response for the command or undefined if the command has no default response
   */
  public static hasDefaultResponse(
    command: Control.CommandMessage,
    options: ConsumerOptions
  ): Control.ResponseMessage | undefined {
    if (!this.isOnTime(command)) {
      return Helpers.badRequest(command, options.id, 'Command is out of time');
    } else if (this.isQueryFeaturesRequest(command)) {
      if (this.isValidQueryFeaturesRequest(command)) {
        return Helpers.respondFeatures(
          command,
          options.id,
          options.actionTargetPairs,
          options.profiles
        );
      } else {
        set(command, responseRequested, Control.ResponseType.Complete);
        return Helpers.badRequest(command, options.id, 'Invalid Query Features');
      }
    } else if (!this.isSupportedAction(command, options.actionTargetPairs)) {
      return Helpers.notImplemented(command, options.id, 'Command not supported');
    } else if (this.isAckOnlyRequested(command)) {
      return Helpers.processing(command, options.id, undefined, 'Command accepted');
    } else {
      return undefined;
    }
  }
  /**
   * Check if the message is a command the instance indicated or for all the instances
   * @param message - message to be checked
   * @param id - instance identification
   * @returns true if the message is for this instance or for all the instances
   */
  public static isCommandToInstance(message: Control.Message, id: string): boolean {
    return (
      message.msg_type === Control.MessageType.Command &&
      (message.to.includes(id) || message.to.includes('*')) &&
      message.from !== id
    );
  }
  /**
   * Check if the message is a response for our command
   * @param message - message to be checked
   * @param from - from field of the original command
   * @param requestId - request_id field of the original command
   * @returns
   */
  public static isResponseToInstance(
    message: Control.Message,
    from: string,
    requestId: string
  ): boolean {
    return (
      message.msg_type === Control.MessageType.Response &&
      (message.to.includes(from) || message.to.includes('*')) &&
      message.request_id === requestId
    );
  }
  /**
   * Check if the command has arguments based on execution time and if we are on time
   * @param command - message to be checked
   * @returns
   */
  public static isOnTime(command: Control.CommandMessage): boolean {
    const startTime = get(command, 'content.args.start_time', undefined);
    const stopTime = get(command, 'content.args.stop_time', undefined);
    const duration = get(command, 'content.args.duration', undefined);
    const wrongConfiguration =
      startTime !== undefined && stopTime !== undefined && duration !== undefined;
    const startTimeHasPassedBasedOnStartTime =
      startTime !== undefined && duration !== undefined && startTime + duration < Date.now();
    const startTimeHasPassedBasedOnStopTime =
      startTime === undefined &&
      stopTime !== undefined &&
      duration !== undefined &&
      stopTime < Date.now();
    return (
      !wrongConfiguration &&
      !startTimeHasPassedBasedOnStartTime &&
      !startTimeHasPassedBasedOnStopTime
    );
  }
  /**
   * Check if the command is supported
   * @param command - message to be checked
   * @param pairs - action-target pairs supported by the consumer
   * @returns
   */
  public static isSupportedAction(
    command: Control.CommandMessage,
    pairs: Control.ActionTargetPairs
  ): boolean {
    const action = command.content.action;
    const targetType = new RegExp(`^${Accessors.getTargetFromCommandMessage(command)}$`);
    const supportedActions = get(pairs, action);
    return supportedActions?.some(target => targetType.test(target)) ?? false;
  }
  /**
   * Check if the command only request an ack as response
   * @param command - message to be checked
   * @returns
   */
  public static isAckOnlyRequested(command: Control.CommandMessage): boolean {
    return get(command, responseRequested) === Control.ResponseType.ACK;
  }
  /**
   * Check if the command is a featured request
   * @param command - message to be checked
   * @returns
   */
  public static isQueryFeaturesRequest(command: Control.CommandMessage): boolean {
    const action = command.content.action;
    const targetType = Accessors.getTargetFromCommandMessage(command);
    return action === Control.Action.Query && targetType === 'features';
  }
  /**
   * Check if the command is a valid featured request
   * @param command - message to be checked
   * @returns
   */
  public static isValidQueryFeaturesRequest(command: Control.CommandMessage): boolean {
    return get(command, responseRequested) === Control.ResponseType.Complete;
  }
  /**
   * Return the delay allowed from command
   * @param command - message to be processed
   */
  public static isDelayDefinedOnCommand(command: Control.Command): boolean {
    const startTimeIsDefined = Boolean(get(command, 'args.start_time', undefined));
    const stopTimeIsDefined = Boolean(get(command, 'args.stop_time', undefined));
    const durationIsDefined = Boolean(get(command, 'args.duration', undefined));
    const basedInDuration = startTimeIsDefined && durationIsDefined;
    const basedInStopTime = stopTimeIsDefined;
    return basedInStopTime !== basedInDuration;
  }
}
