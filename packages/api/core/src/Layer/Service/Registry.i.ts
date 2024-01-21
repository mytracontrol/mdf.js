/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash, Links } from '@mdf.js/crash';
import { EventEmitter } from 'events';
import express from 'express';

/** Service definition */
export interface Registry extends EventEmitter {
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
