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
