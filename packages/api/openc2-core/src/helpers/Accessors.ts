/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Health } from '@mdf.js/core';
import { get } from 'lodash';
import { Control } from '../types';
import { Constants } from './Constants';

export class Accessors {
  /**
   * Return the target of the actual message
   * @param command - message to be processed
   * @returns target
   */
  public static getTargetFromCommandMessage(command: Control.CommandMessage): string {
    return Object.keys(command.content.target)[0];
  }
  /**
   * Return the target of the actual command
   * @param command - command to be processed
   * @returns target
   */
  public static getTargetFromCommand(command: Control.Command): string {
    return Object.keys(command.target)[0];
  }
  /**
   * Return the action of the actual message
   * @param command - message to be processed
   * @returns action
   */
  public static getActionFromCommandMessage(command: Control.CommandMessage): Control.Action {
    return command.content.action;
  }
  /**
   * Return the action of the actual command
   * @param command - command to be processed
   * @returns action
   */
  public static getActionFromCommand(command: Control.Command): Control.Action {
    return command.action;
  }
  /**
   * Return the actuators in the command message
   * @param command - message to be processed
   * @returns actuators
   */
  public static getActuatorsFromCommandMessage(command: Control.CommandMessage): string[] {
    return this.getActuatorsFromCommand(command.content);
  }
  /**
   * Return the actuators in the command
   * @param command - command to be processed
   * @returns actuators
   */
  public static getActuatorsFromCommand(command: Control.Command): string[] {
    const actuators = get(command, 'actuator', {});
    return Object.keys(actuators);
  }
  /**
   * Return the a property from actuators in the command
   * @param command - command to be processed
   * @param profile - actuator profile to find
   * @returns property value
   */
  public static getActuatorAssetId(command: Control.Command, profile: string): any {
    return get(command, ['actuator', profile, 'asset_id'], undefined);
  }
  /**
   * Return the delay allowed from command message
   * @param command - message to be processed
   * @returns delay in milliseconds
   */
  public static getDelayFromCommandMessage(command: Control.CommandMessage): number {
    return this.getDelayFromCommand(command.content);
  }
  /**
   * Return the delay allowed from command
   * @param command - message to be processed
   * @returns delay in milliseconds
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
      delay = duration ?? Constants.DEFAULT_MAX_RESPONSE_COMMAND_DELAY;
    }
    return delay > 0 ? delay : Constants.DEFAULT_MAX_RESPONSE_COMMAND_DELAY;
  }
  /**
   * Convert consumer status to Subcomponent status
   * @param response - response message to be processed
   * @returns Subcomponent status
   */
  public static getStatusFromResponseMessage(response: Control.ResponseMessage): Health.Status {
    if (response.status >= 500) {
      return 'fail';
    } else if (response.status >= 200) {
      return 'pass';
    } else {
      return 'warn';
    }
  }
}
