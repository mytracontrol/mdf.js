/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import fs from 'fs';
import { ConfigManager } from './ConfigManager';

describe('#ConfigManager', () => {
  describe('#Happy path', () => {
    it('Should read all the files, without error in the validation and as the preset1', () => {
      const manager = new ConfigManager<{
        feed: {
          test: number;
          other?: string;
        };
        config: {
          test: number;
        };
        otherConfig: {
          otherTest: string;
          last?: {
            butNotLeast?: number;
          };
        };
      }>('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset1',
        envPrefix: 'MY_PREFIX_A_',
        base: {
          feed: {
            test: 1,
          },
        },
        default: {
          feed: {
            test: 0,
            other: 'b',
          },
        },
      });
      expect(manager.config).toEqual({
        feed: {
          test: 1,
          other: 'b',
        },
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
          test: 0,
        },
        otherConfig: {
          otherTest: 3,
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
        preset3: {
          config: {
            test: 5,
          },
          otherConfig: {
            otherTest: 'j',
          },
        },
      });
      expect(manager.preset).toEqual('preset1');
      expect(manager.schema).toEqual('final');
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toBeUndefined();
      expect(manager.get('otherConfig.last.butNotLeast')).toBeUndefined();
    }, 1000);
    it('Should read all the files, without error in the validation and as the default config', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
      });
      expect(manager.config).toEqual({
        config: {
          test: 0,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeUndefined();
      expect(manager.isErrored).toBeFalsy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
    it('Should read all the files, with error (due to preset is not present) and return default config due to preset not exits', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset4',
      });
      expect(manager.config).toEqual({
        config: {
          test: 0,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeDefined();
      expect(manager.isErrored).toBeTruthy();
      const trace = manager.error?.trace();
      expect(trace).toEqual(['CrashError: Preset preset4 not found']);
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
    it('Should read all the files, with error in the validation and return default config', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/badSchemas/*.schema.*'],
        schema: 'final',
        preset: 'preset',
      });
      expect(manager.config).toEqual({
        config: {
          test: 0,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeDefined();
      expect(manager.isErrored).toBeTruthy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
    it('Should read all the files, without error in the config selection and return default config', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        preset: 'preset',
      });
      expect(manager.config).toEqual({
        config: {
          test: 0,
        },
        otherConfig: {
          otherTest: '-a',
        },
      });
      expect(manager.error).toBeDefined();
      expect(manager.isErrored).toBeTruthy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
    it('Should read all the files, without error in the validation and as the preset1 modified by environment values as a single string', () => {
      process.env['CONFIG_TEST_CONFIG__TEST'] = '4';
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
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
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
    it('Should read all the files, without error in the validation and as the preset1 modified by environment values as an array of strings', () => {
      process.env['A_CONFIG__TEST'] = '4';
      process.env['B_OTHER_CONFIG__OTHER_TEST'] = 'b';
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset1',
        envPrefix: ['A_', 'B_'],
      });
      expect(manager.config).toEqual({
        config: {
          test: 4,
        },
        otherConfig: {
          otherTest: 'b',
        },
      });
      expect(manager.error).toBeUndefined();
      expect(manager.isErrored).toBeFalsy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
    it('Should read all the files, without error in the validation and as the preset1 modified by environment values as an object of strings', () => {
      process.env['MY_A_TEST'] = '4';
      process.env['MY_B_OTHER_TEST'] = 'b';
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset1',
        envPrefix: { config: 'MY_A_', otherConfig: 'MY_B_' },
      });
      expect(manager.config).toEqual({
        config: {
          test: 4,
        },
        otherConfig: {
          otherTest: 'b',
        },
      });
      expect(manager.error).toBeUndefined();
      expect(manager.isErrored).toBeFalsy();
      expect(manager.defaultConfig).toEqual({
        config: {
          test: 0,
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
        preset3: {
          config: {
            test: 5,
          },
          otherConfig: {},
        },
      });
      expect(process.env['MY_CRAZY_STUFF']).toEqual('2');
      expect(process.env['MY_PREFIX_A_OTHER_CONFIG__OTHER_TEST']).toEqual('3');
    }, 1000);
  });
  describe('#Sad path', () => {
    it('Should start with errors if its not possible to parse a config file', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/wrong/*.config.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace() || [];
      expect(trace[0]).toEqual(
        'CrashError: Error parsing file config.config.yaml: Error parsing YAML'
      );
      expect(trace[1]).toEqual('caused by CrashError: Error parsing YAML');
      expect(trace[2].replace(/(\r\n|\n|\r)/gm, '')).toEqual(
        'caused by YAMLParseError: Flow map must end with a } at line 1, column 2:{ ^'
      );
      expect(trace[3]).toEqual(
        'CrashError: Error parsing file preset1.preset.config.json: Error parsing JSON'
      );
      expect(trace[4]).toEqual('caused by CrashError: Error parsing JSON');
      expect(trace[5]).toContain(
        `caused by SyntaxError: Expected property name or '}' in JSON at position`
      );
    }, 1000);
    it('Should start with errors if its not possible to process a schema', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/wrong/*.schema.*'],
        schema: 'final',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace() || [];
      expect(trace[0]).toEqual(
        'CrashError: Error loading schemas: Error adding the schema: [config.schema] - error: [$schema must be a string]'
      );
      expect(trace[1]).toEqual(
        'caused by CrashError: Error adding the schema: [config.schema] - error: [$schema must be a string]'
      );
      expect(trace[2]).toEqual('caused by Error: $schema must be a string');
    }, 1000);
    it('Should start with errors if its not possible to parse a preset config file', () => {
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/wrong/*.preset.*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace() || [];
      expect(trace[0]).toEqual(
        'CrashError: Error parsing file preset1.preset.config.json: Error parsing JSON'
      );
      expect(trace[1]).toEqual('caused by CrashError: Error parsing JSON');
      expect(trace[2]).toContain(
        `caused by SyntaxError: Expected property name or '}' in JSON at position`
      );
      expect(trace[3]).toEqual('CrashError: Preset preset1 not found');
    }, 1000);
    it('Should start with errors if there is a failure reading files', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('Error reading file');
      });
      const manager = new ConfigManager('test', {
        configFiles: ['src/Client/__mocks__/*.*'],
        presetFiles: ['src/Client/__mocks__/presets/*.*'],
        schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
        schema: 'final',
        preset: 'preset1',
      });
      expect(manager.isErrored).toBeTruthy();
      expect(manager.error).toBeDefined();
      expect(manager.error?.message).toEqual('Error in the service configuration');
      const trace = manager.error?.trace() || [];
      expect(trace).toEqual([
        'CrashError: Error loading files: Error reading file',
        'caused by Error: Error reading file',
        'CrashError: Error loading files: Error reading file',
        'caused by Error: Error reading file',
        'CrashError: Error loading files: Error reading file',
        'caused by Error: Error reading file',
        'CrashError: Preset preset1 not found',
        'CrashError: Configuration validation failed: final is not registered in the collection.',
        'caused by ValidationError: final is not registered in the collection.',
      ]);
    }, 1000);
  });
});
