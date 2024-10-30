/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Logger } from './logger';
const defaultLogger = new Logger();
export default defaultLogger;
export { ConsoleTransportConfig } from './console';
export { DebugLogger } from './debug';
export { FileTransportConfig } from './file';
export { FluentdTransportConfig } from './fluentd';
export { Logger, LoggerConfig } from './logger';
export { LOG_LEVELS, LoggerFunction, LoggerInstance, LogLevel } from './types';
export { SetContext, WrapperLogger } from './wrapper';
