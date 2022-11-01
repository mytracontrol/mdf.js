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
import { get } from 'lodash';
import { Control } from '../types';
import { Constants } from './Constants';

export class Accessors {
  /**
   * Return the target of the actual message
   * @param command - message to be processed
   */
  public static getTargetFromCommandMessage(command: Control.CommandMessage): string {
    return Object.keys(command.content.target)[0];
  }
  /**
   * Return the target of the actual command
   * @param command - command to be processed
   */
  public static getTargetFromCommand(command: Control.Command): string {
    return Object.keys(command.target)[0];
  }
  /**
   * Return the action of the actual message
   * @param command - message to be processed
   */
  public static getActionFromCommandMessage(command: Control.CommandMessage): Control.Action {
    return command.content.action;
  }
  /**
   * Return the action of the actual command
   * @param command - command to be processed
   */
  public static getActionFromCommand(command: Control.Command): Control.Action {
    return command.action;
  }
  /**
   * Return the actuators in the command message
   * @param command - message to be processed
   */
  public static getActuatorsFromCommandMessage(command: Control.CommandMessage): string[] {
    return this.getActuatorsFromCommand(command.content);
  }
  /**
   * Return the actuators in the command
   * @param command - command to be processed
   */
  public static getActuatorsFromCommand(command: Control.Command): string[] {
    const actuators = get(command, 'actuator', {});
    return Object.keys(actuators);
  }
  /**
   * Return the a property from actuators in the command
   * @param command - command to be processed
   * @param profile - actuator profile to find
   * @param property - property to find
   */
  public static getActuatorAssetId(command: Control.Command, profile: string): any {
    return get(command, ['actuator', profile, 'asset_id'], undefined);
  }
  /**
   * Return the delay allowed from command message
   * @param command - message to be processed
   */
  public static getDelayFromCommandMessage(command: Control.CommandMessage): number {
    return this.getDelayFromCommand(command.content);
  }
  /**
   * Return the delay allowed from command
   * @param command - message to be processed
   */
  public static getDelayFromCommand(command: Control.Command): number {
    const startTime = get(command, 'args.start_time', undefined);
    const stopTime = get(command, 'args.stop_time', undefined);
    const duration = get(command, 'args.duration', undefined);
    let delay: number;
    if (stopTime !== undefined) {
      delay = stopTime - Date.now();
    } else if (startTime !== undefined && duration !== undefined) {
      delay = startTime + duration - Date.now();
    } else {
      delay = duration || Constants.DEFAULT_MAX_RESPONSE_COMMAND_DELAY;
    }
    return delay > 0 ? delay : Constants.DEFAULT_MAX_RESPONSE_COMMAND_DELAY;
  }
  /**
   * Convert consumer status to Subcomponent status
   * @param status - consumer status
   * @returns
   */
  public static getStatusFromResponseMessage(response: Control.ResponseMessage): Health.API.Status {
    if (response.status >= 500) {
      return 'fail';
    } else if (response.status >= 200) {
      return 'pass';
    } else {
      return 'warn';
    }
  }
}
