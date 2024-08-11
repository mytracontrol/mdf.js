/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { get } from 'lodash';
import { v4 } from 'uuid';
import { Control } from '../types';
import { Checkers } from './Checkers';
import { Constants } from './Constants';

export class Helpers {
  /**
   * Return a "Processing" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param result - Command result
   * @param statusText - Status text
   */
  public static processing(
    command: Control.CommandMessage,
    id: string,
    result?: Control.Results,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 102, result, statusText);
  }
  /**
   * Return a "OK" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param result - Command result
   * @param statusText - Status text
   */
  public static ok(
    command: Control.CommandMessage,
    id: string,
    result?: Control.Results,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 200, result, statusText);
  }
  /**
   * Return a "Bad Request" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static badRequest(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 400, undefined, statusText);
  }
  /**
   * Return a "Unauthorized " response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static unauthorized(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 401, undefined, statusText);
  }
  /**
   * Return a "Forbidden" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static forbidden(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 403, undefined, statusText);
  }
  /**
   * Return a "Not Found" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static notFound(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 404, undefined, statusText);
  }
  /**
   * Return a "Internal Error" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static internalError(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 500, undefined, statusText);
  }
  /**
   * Return a "Not implemented" response message for concrete command or undefined if the response
   * its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static notImplemented(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 501, undefined, statusText);
  }
  /**
   * Return a "Service Unavailable" response message for concrete command or undefined if the
   * response its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param statusText - Status text
   */
  public static serviceUnavailable(
    command: Control.CommandMessage,
    id: string,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    return this.baseResponse(command, id, 503, undefined, statusText);
  }
  /**
   * Return response with the indicated code message for concrete command or undefined if the
   * response its not needed
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param code - Status code
   * @param results - response results to be included
   * @param statusText - Status text
   */
  protected static baseResponse(
    command: Control.CommandMessage,
    id: string,
    status: number,
    results?: Control.Results,
    statusText?: string
  ): Control.ResponseMessage | undefined {
    const responseRequested = get(
      command,
      'content.args.response_requested',
      Control.ResponseType.Complete
    );
    if (responseRequested === Control.ResponseType.None) {
      return undefined;
    } else {
      return {
        content_type: Constants.DEFAULT_CONTENT_TYPE,
        msg_type: Control.MessageType.Response,
        request_id: command.request_id,
        status,
        created: Date.now(),
        from: id,
        to: [command.from],
        content: {
          status,
          status_text: statusText,
          results,
        },
      };
    }
  }
  /**
   * Create a command message
   * @param to - expected receiver of this command
   * @param content - command content
   * @param id - producer identification
   * @returns
   */
  public static createCommand(
    to: string[],
    content: Control.Command,
    id: string
  ): Control.CommandMessage {
    const args: Control.Arguments | undefined = Checkers.isDelayDefinedOnCommand(content)
      ? content.args
      : {
          start_time: Date.now(),
          duration: Constants.DEFAULT_MAX_RESPONSE_COMMAND_DELAY,
        };
    return {
      content_type: Constants.DEFAULT_CONTENT_TYPE,
      msg_type: Control.MessageType.Command,
      request_id: v4(),
      created: Date.now(),
      from: id,
      to,
      content: {
        action: content.action,
        target: content.target,
        actuator: content.actuator,
        args,
        command_id: content.command_id,
      },
    };
  }
  /**
   * Create a command message
   * @param to - expected receiver of this command
   * @param action - command action
   * @param target - command target
   * @param id - producer identification
   * @returns
   */
  public static createCommandByAction(
    to: string[],
    action: Control.Action,
    target: Control.Target,
    id: string
  ): Control.CommandMessage {
    return this.createCommand(to, { action, target }, id);
  }
  /**
   * Return the "query features" request with the requested duration
   * @returns
   */
  public static queryFeatures(duration: number): Control.Command {
    return {
      action: Control.Action.Query,
      target: {
        features: [
          Control.Features.Pairs,
          Control.Features.Profiles,
          Control.Features.RateLimit,
          Control.Features.Versions,
        ],
      },
      args: {
        start_time: Date.now(),
        duration,
        response_requested: Control.ResponseType.Complete,
      },
    };
  }
  /**
   * Return a "Query Features" response based in the request received
   * @param command - Command to be response
   * @param id - Consumer identification
   * @param pairs - Action-Target pairs supported by the consumer
   * @param profiles - Profiles supported by the consumer
   * @returns
   */
  public static respondFeatures(
    command: Control.CommandMessage,
    id: string,
    pairs: Control.ActionTargetPairs,
    profiles?: string[]
  ): Control.ResponseMessage {
    const features: string[] = get(command, 'content.target.features', []) as string[];
    const results: Control.Results = {};
    results['pairs'] = features.includes('pairs') ? pairs : undefined;
    results['rate_limit'] = features.includes('rate_limit')
      ? Constants.DEFAULT_RATE_LIMIT
      : undefined;
    results['profiles'] = features.includes('profiles') ? profiles : undefined;
    results['versions'] = features.includes('versions') ? Constants.SUPPORTED_VERSIONS : undefined;
    return this.ok(command, id, results) as Control.ResponseMessage;
  }
}
