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

import { format } from 'winston';
const NULL_UUID = '00000000-0000-0000-0000-000000000000';
const PID_PADDING = 8;
const LEVEL_PADDING = 7;
const LABEL_PADDING = 12;
const UUID_PADDING = 36;
const CONTEXT_PADDING = 12;

const NULL_UUID_STR = NULL_UUID.padEnd(UUID_PADDING);
const UNKNOWN_CONTEXT_STR = 'unknown'.padEnd(CONTEXT_PADDING);
// *************************************************************************************************
// #region Formateo de cadena de caracteres sin color
const customFormat = format.printf(info => {
  let str = `${info['timestamp']} | `;
  str += `${info['pid'].padEnd(PID_PADDING)} | `;
  str += `${info['label'].padEnd(LABEL_PADDING)} | `;
  str += `${info.level.padEnd(LEVEL_PADDING)} | `;
  str += `${info['uuid'] || NULL_UUID_STR} | `;
  str += `${
    info['context']
      ? info['context'].padEnd(CONTEXT_PADDING).substring(0, CONTEXT_PADDING)
      : UNKNOWN_CONTEXT_STR
  } | `;
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
