/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import fs from 'fs';
import { ConfigManager } from './ConfigManager';

describe('#ConfigManager', () => {
  describe('#Happy path', () => {
    it('Should read all the files, without error in the validation and as the preset1', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset1',
      });
      expect(manager.config).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: 'a',
        },
      });
      expect(manager.error).toBeUndefined();
      expect(manager.isErrored).toBeFalsy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.presets).toEqual({
        preset1: {
          config: {
            test: 2,
          },
          otherConfig: {
            otherTest: 'a',
          },
        },
        preset2: {
          config: {
            test: 4,
          },
          otherConfig: {
            otherTest: 'b',
          },
        },
      });
    }, 1000);
    it('Should read all the files, without error in the validation and as the default config', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
      });
      expect(manager.config).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeUndefined();
      expect(manager.isErrored).toBeFalsy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.presets).toEqual({
        preset1: {
          config: {
            test: 2,
          },
          otherConfig: {
            otherTest: 'a',
          },
        },
        preset2: {
          config: {
            test: 4,
          },
          otherConfig: {
            otherTest: 'b',
          },
        },
      });
    }, 1000);
    it('Should read all the files, with error (due to preset is not present) and return default config due to preset not exits', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset3',
      });
      expect(manager.config).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeDefined();
      expect(manager.isErrored).toBeTruthy();
      const trace = manager.error?.trace();
      expect(trace).toEqual(['CrashError: Preset preset3 not found']);
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.presets).toEqual({
        preset1: {
          config: {
            test: 2,
          },
          otherConfig: {
            otherTest: 'a',
          },
        },
        preset2: {
          config: {
            test: 4,
          },
          otherConfig: {
            otherTest: 'b',
          },
        },
      });
    }, 1000);
    it('Should read all the files, with error in the validation and return default config', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/badSchemas/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset',
      });
      expect(manager.config).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeDefined();
      expect(manager.isErrored).toBeTruthy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.presets).toEqual({
        preset1: {
          config: {
            test: 2,
          },
          otherConfig: {
            otherTest: 'a',
          },
        },
        preset2: {
          config: {
            test: 4,
          },
          otherConfig: {
            otherTest: 'b',
          },
        },
      });
    }, 1000);
    it('Should read all the files, without error in the config selection and return default config', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        preset: 'preset',
      });
      expect(manager.config).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeDefined();
      expect(manager.isErrored).toBeTruthy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.presets).toEqual({
        preset1: {
          config: {
            test: 2,
          },
          otherConfig: {
            otherTest: 'a',
          },
        },
        preset2: {
          config: {
            test: 4,
          },
          otherConfig: {
            otherTest: 'b',
          },
        },
      });
    }, 1000);
    it('Should read all the files, without error in the validation and as the preset1 modified by environment values', () => {
      process.env['CONFIG_TEST_CONFIG__TEST'] = '4';
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset1',
        envPrefix: 'CONFIG_TEST_',
      });
      expect(manager.config).toEqual({
        config: {
          test: 4,
        },
        otherConfig: {
          otherTest: 'a',
        },
      });
      expect(manager.error).toBeUndefined();
      expect(manager.isErrored).toBeFalsy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 2,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.presets).toEqual({
        preset1: {
          config: {
            test: 2,
          },
          otherConfig: {
            otherTest: 'a',
          },
        },
        preset2: {
          config: {
            test: 4,
          },
          otherConfig: {
            otherTest: 'b',
          },
        },
      });
    }, 1000);
  });
  describe('#Sad path', () => {
    it('Should start with errors if its not possible to parse a config file', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/wrong/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace();
      expect(trace).toEqual([
        'CrashError: Error parsing JSON in file src/Client/__mocks__/wrong/config.config.yaml',
        'caused by SyntaxError: Unexpected end of JSON input',
        'CrashError: Error parsing YAML in file src/Client/__mocks__/wrong/config.config.yaml',
        'caused by YAMLParseError: Flow map must end with a } at line 1, column 2:\n\n{\n ^\n',
        'CrashError: Error parsing JSON in file src/Client/__mocks__/wrong/preset1.preset.config.json',
        'caused by SyntaxError: Unexpected end of JSON input',
        'CrashError: Error parsing YAML in file src/Client/__mocks__/wrong/preset1.preset.config.json',
        'caused by YAMLParseError: Flow map must end with a } at line 2, column 1:\n\n{\r\n\n^\n',
      ]);
    }, 1000);
    it('Should start with errors if its not possible to process a schema', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/wrong/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace();
      expect(trace).toEqual([
        'CrashError: Error loading schemas: Error adding the schema: [config.schema] - error: [$schema must be a string]',
        'caused by CrashError: Error adding the schema: [config.schema] - error: [$schema must be a string]',
        'caused by Error: $schema must be a string',
      ]);
    }, 1000);
    it('Should start with errors if its not possible to parse a preset config file', () => {
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/wrong/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace();
      expect(trace).toEqual([
        'CrashError: Error parsing JSON in file src/Client/__mocks__/wrong/preset1.preset.config.json',
        'caused by SyntaxError: Unexpected end of JSON input',
        'CrashError: Error parsing YAML in file src/Client/__mocks__/wrong/preset1.preset.config.json',
        'caused by YAMLParseError: Flow map must end with a } at line 2, column 1:\n\n{\r\n\n^\n',
        'CrashError: Preset preset1 not found',
      ]);
    }, 1000);
    it('Should start with errors if there is a failure reading files', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('Error reading file');
      });
      const manager = new ConfigManager({
        name: 'test',
        configFiles: ['src/Client/__mocks__/*.config.*'],
        presetFiles: ['src/Client/__mocks__/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/*.schema.*'],
        schema: 'final.schema',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace();
      expect(trace).toEqual([
        'CrashError: Error loading files: Error reading file',
        'caused by Error: Error reading file',
        'CrashError: Error loading files: Error reading file',
        'caused by Error: Error reading file',
        'CrashError: Error loading files: Error reading file',
        'caused by Error: Error reading file',
        'CrashError: Preset preset1 not found',
        'CrashError: Configuration validation failed: final.schema is not registered in the collection.',
        'caused by ValidationError: final.schema is not registered in the collection.',
      ]);
    }, 1000);
  });
});
