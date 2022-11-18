/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DoorKeeper } from '@mdf.js/doorkeeper';
import { Control } from '../../types';
import * as Schemas from './control';

// *************************************************************************************************
// #region Command and control JSON Schemas hierarchy
// *************************************************************************************************
// #region Common Schemas
const common = [
  Schemas.Properties.to,
  Schemas.Properties.from,
  Schemas.Properties.contentType,
  Schemas.Properties.status,
  Schemas.Properties.requestId,
  Schemas.Properties.created,
  Schemas.Properties.port,
  Schemas.Properties.l4protocol,
  Schemas.Properties.ipv4net,
  Schemas.Properties.ipv6net,
  Schemas.Properties.ipv4connection,
  Schemas.Properties.ipv6connection,
  Schemas.Properties.hashes,
  Schemas.Properties.payload,
  Schemas.Properties.artifact,
  Schemas.Properties.device,
  Schemas.Properties.file,
  Schemas.Properties.process,
  Schemas.Properties.target,
  Schemas.Properties.targets,
  Schemas.commandContent,
  Schemas.responseContent,
];
// #endregion
// *************************************************************************************************
// #region Command and control message schema
const schemas = {
  'Control.Message.Command': Schemas.commandMessage,
  'Control.Message.Response': Schemas.responseMessage,
  'Control.Message': Schemas.message,
};
// #endregion

interface ControlSchemas {
  'Control.Message.Command': Control.CommandMessage;
  'Control.Message.Response': Control.ResponseMessage;
  'Control.Message': Control.Message;
}

export const Checker = new DoorKeeper<ControlSchemas>({ $data: true, strict: false })
  .register(common)
  .register(schemas);
