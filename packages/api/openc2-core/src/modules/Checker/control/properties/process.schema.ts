/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
export const process = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'control.message.command.target.process.schema.json',
  title: 'Process',
  type: 'object',
  properties: {
    pid: {
      title: 'PID',
      description: 'Process ID of the process',
      type: 'integer',
      minimum: 0,
    },
    name: {
      title: 'Name',
      description: 'Name of the process',
      type: 'string',
    },
    cwd: {
      title: 'CWD',
      description: 'Current working directory of the process',
      type: 'string',
    },
    executable: {
      title: 'Executable',
      description: 'Executable that was executed to start the process',
      $ref: 'control.message.command.target.file.schema.json#',
    },
    parent: {
      title: 'Parent',
      description: 'Process that spawned this one',
      $ref: 'control.message.command.target.process.schema.json#',
    },
    command_line: {
      title: 'Command line',
      description:
        'The full command line invocation used to start this process, including all arguments',
      type: 'string',
    },
  },
  minProperties: 1,
  additionalProperties: false,
};
