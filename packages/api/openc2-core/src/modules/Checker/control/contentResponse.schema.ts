/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

const targetsSchemaRef = 'control.message.response.targets.schema.json#';

export const responseContent = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'control.message.content.response.schema.json',
  title: 'Command and control response schema',
  type: 'object',
  properties: {
    status: { $ref: 'control.message.status.schema.json#' },
    status_text: {
      title: 'Status text',
      description: 'A free-form human-readable description of the Response status',
      type: ['string', 'null'],
    },
    results: {
      title: 'Results',
      description: 'Contain additional results based on the invoking Command',
      type: ['object', 'null'],
      properties: {
        versions: {
          title: 'List of OpenC2 language versions supported by this Actuator',
          type: 'array',
          items: {
            title: 'Command and control version',
            description: 'Supported version of command and control interface',
            type: 'string',
          },
        },
        profiles: {
          title: 'List of profiles',
          description: 'List of profiles supported by this Actuator',
          type: 'array',
          items: {
            title: 'Profile',
            description: 'Profile supported by this actuator',
            type: 'string',
            pattern: '^x-[A-Za-z0-9_]*$',
          },
        },
        pairs: {
          title: 'Pairs',
          description: 'List of targets applicable to each supported Action',
          type: 'object',
          patternProperties: {
            '^allow$': { $ref: targetsSchemaRef },
            '^scan$': { $ref: targetsSchemaRef },
            '^locate$': { $ref: targetsSchemaRef },
            '^query$': { $ref: targetsSchemaRef },
            '^deny$': { $ref: targetsSchemaRef },
            '^contain$': { $ref: targetsSchemaRef },
            '^start$': { $ref: targetsSchemaRef },
            '^stop$': { $ref: targetsSchemaRef },
            '^restart$': { $ref: targetsSchemaRef },
            '^cancel$': { $ref: targetsSchemaRef },
            '^set$': { $ref: targetsSchemaRef },
            '^update$': { $ref: targetsSchemaRef },
            '^redirect$': { $ref: targetsSchemaRef },
            '^create$': { $ref: targetsSchemaRef },
            '^delete$': { $ref: targetsSchemaRef },
            '^detonate$': { $ref: targetsSchemaRef },
            '^restore$': { $ref: targetsSchemaRef },
            '^copy$|': { $ref: targetsSchemaRef },
            '^investigate$|': { $ref: targetsSchemaRef },
            '^remediate$': { $ref: targetsSchemaRef },
          },
          additionalProperties: false,
        },
        rate_limit: {
          title: 'Maximum number of requests per minute supported by design or policy',
          type: 'number',
          minimum: 0,
        },
        patternProperties: {
          '^x-[A-Za-z0-9_]*$': {
            type: 'object',
          },
        },
        additionalProperties: false,
      },
    },
  },
  required: ['status'],
  additionalProperties: false,
};
