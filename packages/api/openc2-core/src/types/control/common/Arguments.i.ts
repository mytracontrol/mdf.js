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
import { ResponseType } from './ResponseType.t';
/**
 * `start_time`, `stop_time`, `duration`:
 *    - If none are specified, then start_time is now, stop_time is never, and duration is infinity.
 *    - Only two of the three are allowed on any given Command and the third is derived from the
 *      equation stop_time = start_time + duration.
 *    - If only start_time is specified then stop_time is never and duration is infinity.
 *    - If only stop_time is specified then start_time is now and duration is derived.
 *    - If only duration is specified then start_time is now and stop_time is derived.
 *
 * `response_requested`:
 *    - If response_requested is specified as none then the Consumer SHOULD NOT send a Response.
 *    - If response_requested is specified as ack then the Consumer SHOULD send a Response
 *      acknowledging receipt of the Command: {"status": 102}.
 *    - If response_requested is specified as status then the Consumer SHOULD send a Response
 *      containing the current status of Command execution.
 *    - If response_requested is specified as complete then the Consumer SHOULD send a Response
 *      containing the status or results upon completion of Command execution.
 *    - If response_requested is not explicitly specified then the Consumer SHOULD respond as if
 *      complete was specified.
 */
export interface Arguments {
  /** The specific date/time to initiate the Command */
  start_time?: number;
  /** The specific date/time to terminate the Command */
  stop_time?: number;
  /** The length of time for an Command to be in effect */
  duration?: number;
  /** The type of Response required for the Command: none, ack, status, complete */
  response_requested?: ResponseType;
}
