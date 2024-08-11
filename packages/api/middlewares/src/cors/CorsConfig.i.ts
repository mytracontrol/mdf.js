/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface CorsConfig {
  enabled: boolean;
  whitelist?: string | Array<string | RegExp>;
  methods?: string[];
  allowHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: 200 | 204;
  allowAppClients?: boolean;
}
