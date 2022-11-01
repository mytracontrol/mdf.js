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
