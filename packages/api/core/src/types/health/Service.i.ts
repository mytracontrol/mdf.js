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
import { Crash, Links } from '@mdf/crash';
import { EventEmitter } from 'events';
import express from 'express';

/** Service definition */
export interface Service extends EventEmitter {
  /** Emitted when the component throw an error*/
  on(event: 'error', listener: (error: Crash | Error) => void): this;
  /** Service name */
  name: string;
  /** Express router */
  router?: express.Router;
  /** Service base path */
  links?: Links;
  /** Service start function */
  start?: () => Promise<void>;
  /** Service stop function */
  stop?: () => Promise<void>;
}
