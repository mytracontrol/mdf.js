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

const commonProperties = {
  content_type: { $ref: 'control.message.contentType.schema.json#' },
  status: { $ref: 'control.message.status.schema.json#' },
  request_id: { $ref: 'control.message.requestId.schema.json#' },
  created: { $ref: 'control.message.created.schema.json#' },
  from: { $ref: 'control.message.from.schema.json#' },
  to: { $ref: 'control.message.to.schema.json#' },
};
const schema = 'http://json-schema.org/draft-07/schema#';

export const message = {
  $schema: schema,
  $id: 'control.message.schema.json',
  title: 'Command and control message schema',
  type: 'object',
  discriminator: { propertyName: 'msg_type' },
  oneOf: [
    {
      properties: {
        ...commonProperties,
        content: { $ref: 'control.message.content.command.schema.json#' },
        msg_type: { const: 'command' },
      },
      required: ['content_type', 'msg_type', 'created', 'content'],
      additionalProperties: false,
    },
    {
      properties: {
        ...commonProperties,
        content: { $ref: 'control.message.content.response.schema.json#' },
        msg_type: { const: 'response' },
      },
      required: ['content_type', 'msg_type', 'created', 'content'],
      additionalProperties: false,
    },
  ],
};

export const responseMessage = {
  $schema: schema,
  $id: 'control.response_message.schema.json',
  title: 'Response message schema',
  type: 'object',
  properties: {
    ...commonProperties,
    content: { $ref: 'control.message.content.response.schema.json#' },
    msg_type: { const: 'response' },
  },
  required: ['content_type', 'msg_type', 'created', 'content'],
  additionalProperties: false,
};

export const commandMessage = {
  $schema: schema,
  $id: 'control.command_message.schema.json',
  title: 'Command message schema',
  type: 'object',
  properties: {
    ...commonProperties,
    content: { $ref: 'control.message.content.command.schema.json#' },
    msg_type: { const: 'command' },
  },
  required: ['content_type', 'msg_type', 'created', 'content'],
  additionalProperties: false,
};
