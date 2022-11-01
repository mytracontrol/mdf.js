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
