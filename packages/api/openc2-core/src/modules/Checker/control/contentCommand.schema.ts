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

export const commandContent = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'control.message.content.command.schema.json',
  title: 'Command and control command schema',
  type: 'object',
  properties: {
    action: {
      title: 'Action',
      description: 'The task or activity to be performed',
      type: 'string',
      enum: [
        'scan',
        'locate',
        'query',
        'deny',
        'contain',
        'allow',
        'start',
        'stop',
        'restart',
        'cancel',
        'set',
        'update',
        'redirect',
        'create',
        'delete',
        'detonate',
        'restore',
        'copy',
        'investigate',
        'remediate',
      ],
    },
    target: { $ref: 'control.message.command.target.schema.json#' },
    args: {
      title: 'OpenC2 Args',
      type: 'object',
      properties: {
        start_time: {
          title: 'The specific date/time to initiate the Action (milliseconds since the epoch)',
          type: 'integer',
          minimum: 0,
        },
        stop_time: {
          title: 'The specific date/time to terminate the Action (milliseconds since the epoch)',
          type: 'integer',
          minimum: 0,
        },
        duration: {
          title: 'The length of time for an Action to be in effect (milliseconds)',
          type: 'integer',
          minimum: 0,
        },
        response_requested: {
          title: 'The type of Response required for the Action',
          $comment:
            'Could use oneOf with const instead of enum to have titles on each item (see example)',
          type: 'string',
          enum: ['none', 'ack', 'status', 'complete'],
        },
      },
      patternProperties: {
        '^x-[A-Za-z0-9_]*$': {
          type: 'object',
        },
      },
      minProperties: 1,
      additionalProperties: false,
    },
    actuator: {
      title: 'Actuator',
      type: 'object',
      patternProperties: {
        '^x-[A-Za-z0-9_]*$': {
          type: 'object',
        },
      },
      minProperties: 1,
      additionalProperties: false,
    },
    command_id: {
      title: 'Command Identifier',
      type: 'string',
    },
  },
  required: ['action', 'target'],
  additionalProperties: false,
};
