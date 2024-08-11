/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { CreateAxiosDefaults as RequestDefaults } from 'axios';
import { AgentOptions as HTTPAgentOptions } from 'http';
import { AgentOptions as HTTPSAgentOptions } from 'https';

export interface Config {
  requestConfig?: RequestDefaults;
  httpAgentOptions?: HTTPAgentOptions;
  httpsAgentOptions?: HTTPSAgentOptions;
}
