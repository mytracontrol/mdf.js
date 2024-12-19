/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { format } from 'winston';
const NULL_UUID = '00000000-0000-0000-0000-000000000000';
const PID_PADDING = 8;
const LEVEL_PADDING = 7;
const LABEL_PADDING = 12;
const UUID_PADDING = 36;
const CONTEXT_PADDING = 12;

const NULL_UUID_STR = NULL_UUID.padEnd(UUID_PADDING);
const UNKNOWN_CONTEXT_STR = 'unknown'.padEnd(CONTEXT_PADDING);

/**
 * Check if a value is a string.
 * @param value - The value to check.
 * @param defaultValue - The default value to return if the value is not a string.
 * @returns The value as a string or the default value.
 */
function asString(value: unknown, defaultValue: string | number, padEnd: number): string {
  const result = typeof value === 'string' ? value : `${defaultValue}`;
  return result.padEnd(padEnd).substring(0, padEnd);
}
// *************************************************************************************************
// #region Formateo de cadena de caracteres sin color
const customFormat = format.printf(info => {
  const pid = asString(info['pid'], process.pid, PID_PADDING);
  const label = asString(info['label'], 'unknown', LABEL_PADDING);
  const uuid = asString(info['uuid'], NULL_UUID, UUID_PADDING);
  const context = asString(info['context'], UNKNOWN_CONTEXT_STR, CONTEXT_PADDING);

  let str = `${info['timestamp']} | `;
  str += `${pid} | `;
  str += `${label} | `;
  str += `${info.level.padEnd(LEVEL_PADDING)} | `;
  str += `${uuid} | `;
  str += `${context} | `;
  str += info.message;
  return str;
});
// #endregion
// *************************************************************************************************
// #region Formatos de registro
export function jsonFormat(label: string) {
  return format.combine(format.label({ label }), format.splat(), format.json());
}
export function stringFormat(label: string) {
  return format.combine(format.label({ label }), format.splat(), format.simple(), customFormat);
}
