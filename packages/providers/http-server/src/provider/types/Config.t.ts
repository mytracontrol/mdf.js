/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Express } from 'express';

/** Configuration for the HTTP server provider */
export interface Config {
  /** Port to listen on */
  port?: number;
  /** Host to listen on */
  host?: string;
  /** Express app to use */
  app?: Express;
}

