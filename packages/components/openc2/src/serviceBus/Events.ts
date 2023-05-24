/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import {
  OC2_TOPIC_COMMAND_PREFIX,
  OC2_TOPIC_PREFIX,
  OC2_TOPIC_RESPONSE_PREFIX,
  OC2_TOPIC_SEPARATOR,
} from '../types';

export class Events {
  /**
   * Check if the event is the general command event
   * @param event - event to be checked
   * @param separator - event separator
   * @returns
   */
  public static isGeneralCommandEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): boolean {
    return event === `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_COMMAND_PREFIX}${separator}all`;
  }
  /**
   * Check if the event is the general response event
   * @param event - event to be checked
   * @param separator - event separator
   * @returns
   */
  public static isGeneralResponseEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): boolean {
    return event === `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_RESPONSE_PREFIX}`;
  }
  /**
   * Check if the event is for an actuator profile command event
   * @param event - event to be checked
   * @param separator - event separator
   * @returns
   */
  public static isActuatorCommandEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): boolean {
    return event.startsWith(
      `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_COMMAND_PREFIX}${separator}ap${separator}`
    );
  }
  /**
   * Return the event for an concrete actuator profile
   * @param event - event to be processed
   * @param separator - event separator
   * @returns
   */
  public static getActuatorFromCommandEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): string {
    return event.replace(
      `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_COMMAND_PREFIX}${separator}ap${separator}`,
      ''
    );
  }
  /**
   * Check if the event is for a concrete device
   * @param event - event to be checked
   * @param separator - event separator
   * @returns
   */
  public static isDeviceCommandEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): boolean {
    return event.startsWith(
      `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_COMMAND_PREFIX}${separator}device${separator}`
    );
  }
  /**
   * Return the event for a concrete device
   * @param event - event to be processed
   * @param separator - event separator
   * @returns
   */
  public static getDeviceFromCommandEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): string {
    return event.replace(
      `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_COMMAND_PREFIX}${separator}device${separator}`,
      ''
    );
  }
  /**
   * Check if the event is for a concrete producer
   * @param event - event to be checked
   * @param separator - event separator
   * @returns
   */
  public static isProducerResponseEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): boolean {
    return event.startsWith(
      `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_RESPONSE_PREFIX}${separator}`
    );
  }
  /**
   * Return the event for a concrete producer
   * @param event - event to be processed
   * @param separator - event separator
   * @returns
   */
  public static getProducerFromResponseEvent(
    event: string,
    separator: string = OC2_TOPIC_SEPARATOR
  ): string {
    return event.replace(
      `${OC2_TOPIC_PREFIX}${separator}${OC2_TOPIC_RESPONSE_PREFIX}${separator}`,
      ''
    );
  }
}
