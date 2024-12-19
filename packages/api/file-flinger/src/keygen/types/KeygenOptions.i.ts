/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface KeygenOptions {
  /** File pattern to match the files to process */
  filePattern?: string | undefined;
  /**
   * Key pattern used to generate the key for the file in the pusher.
   * The key pattern can contain placeholders that will be replaced by the actual values.
   * The placeholders are enclosed in curly braces and the following are supported:
   * - {_filename}: The name of the file
   * - {_extension}: The extension of the file
   * - {_timestamp}: The timestamp when the file was created or modified in milliseconds
   * - {_date}: The date when the file was created or modified in the format YYYY-MM-DD
   * - {_time}: The time when the file was created or modified in the format HH-mm-ss
   * - {_datetime}: The date and time when the file was created or modified in the format
   *   YYYY-MM-DD_HH-mm-ss
   * - {_year}: The year when the file was created or modified
   * - {_month}: The month when the file was created or modified
   * - {_day}: The day when the file was created or modified
   * - {_hour}: The hour when the file was created or modified
   * - {_minute}: The minute when the file was created or modified
   * - {_second}: The second when the file was created or modified
   */
  keyPattern?: string;
  /** The default values for the keys */
  defaultValues?: Record<string, string>;
}

/** Internal key generator options */
export type InternalKeygenOptions = Required<Omit<KeygenOptions, 'filePattern'>> & {
  filePattern: string | undefined;
};
