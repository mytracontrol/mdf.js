/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export class Constants {
  /** Supported OpenC2 versions */
  public static readonly SUPPORTED_VERSIONS = ['1.0'];
  /** Number of concurrent commands */
  public static readonly DEFAULT_RATE_LIMIT = 5;
  /** Maximum delay allowed for a command response */
  public static readonly DEFAULT_MAX_RESPONSE_COMMAND_DELAY = 30000;
  /** Maximum delay allowed for a command execution */
  public static readonly DEFAULT_MAX_INACTIVITY_TIME = 5;
  /** Minimum delay allowed for a command execution */
  public static readonly DEFAULT_MIN_INACTIVITY_TIME = 1;
  /** Maximum number of messages registered */
  public static readonly DEFAULT_MESSAGES_REGISTERS_LIMIT = 100;
  /** Maximum aging time for backed entries */
  public static readonly DEFAULT_MAX_AGING_TIME_FOR_BACKED_ENTRIES = 10 * 60 * 1000;
  /** Default check interval time for not executed commands */
  public static readonly DEFAULT_AGING_CHECK_INTERVAL = 60 * 1000;
  /** Default content type for messages */
  public static readonly DEFAULT_CONTENT_TYPE = 'application/openc2+json;version=1.0';
}
