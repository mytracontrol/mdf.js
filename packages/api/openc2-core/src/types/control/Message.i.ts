/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Command as CommandContent } from './Command.i';
import { StatusCode } from './common';
import { Response as ResponseContent } from './Response.i';

export enum MessageType {
  /** The Message content is an Command */
  Command = 'command',
  /** The Message content is an Response */
  Response = 'response',
}

interface BaseMessage {
  /**
   * Media Type that identifies the format of the content, including major version. Incompatible
   * content formats must have different content_types. Content_type application/openc2 identifies
   * content defined by OpenC2 language specification versions 1.x, i.e., all versions that are
   * compatible with version 1.0.
   */
  content_type: string;
  /**
   * A unique identifier created by the Producer and copied by Consumer into all Responses, in order
   * to support reference to a particular Command, transaction, or event chain
   */
  request_id: string;
  /** Creation date/time of the content */
  created: number;
  /** Authenticated identifier of the creator of or authority for execution of a message */
  from: string;
  /** Authenticated identifier(s) of the authorized recipient(s) of a message */
  to: string[];
}

export interface ResponseMessage extends BaseMessage {
  /** The type of command and control Message */
  msg_type: MessageType.Response;
  /** Populated with a numeric status code in Response */
  status: StatusCode;
  /** Message body as specified by content_type and msg_type */
  content: ResponseContent;
}

export interface CommandMessage extends BaseMessage {
  /** The type of command and control Message */
  msg_type: MessageType.Command;
  /** Message body as specified by content_type and msg_type */
  content: CommandContent;
}

export type Message = CommandMessage | ResponseMessage;
