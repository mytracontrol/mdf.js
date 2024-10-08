/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { ConfigManager } from '../Client';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  configFiles: ['src/Client/__mocks__/*.*'],
  presetFiles: ['src/Client/__mocks__/presets/*.*'],
  schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
  schema: 'final',
  preset: 'preset1',
};
class FakeLogger {
  public entry?: string;
  public debug(value: string): void {
    this.entry = value;
  }
  public info(value: string): void {
    this.entry = value;
  }
  public error(value: string): void {
    this.entry = value;
  }
  public crash(error: Crash): void {
    this.entry = error.message;
  }
  public warn(value: string): void {
    this.entry = value;
  }
  public silly(value: string): void {
    this.entry = value;
  }
}

describe('#Port #ServiceConfig', () => {
  describe('#Happy path', () => {
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(ConfigManager);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'config:status': [
          {
            componentId: checks['config:status'][0].componentId,
            componentType: 'setup service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['config:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'test',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          configFiles: ['src/Client/__mocks__/*.*'],
          presetFiles: ['src/Client/__mocks__/presets/*.*'],
          schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
          schema: 'final',
          preset: 'preset1',
        },
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeDefined();
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'test:status': [
          {
            componentId: checks['test:status'][0].componentId,
            componentType: 'setup service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['test:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeDefined();
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it('Should start/stop the client on request', done => {
      const port = new Port({}, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      port.on('error', error => {
        throw error;
      });
      port.on('unhealthy', () => {
        throw new Error('Should not be unhealthy');
      });
      port
        .start()
        .then(() => port.start())
        .then(() => port.close())
        .then(() => port.close())
        .then(() => {
          process.nextTick(done);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should emit unhealthy events if there configuration is wrong', done => {
      const port = new Port(
        {
          configFiles: ['src/Client/__mocks__/*.*'],
          presetFiles: ['src/Client/__mocks__/wrong/*.preset.*.*'],
          schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
          schema: 'final.schema',
          preset: 'preset1',
        },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      port.on('unhealthy', error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Multi);
        expect(error.message).toEqual('Error in the service configuration');
        const trace = error.trace();
        expect(trace[0]).toEqual(
          `CrashError: Error parsing file preset1.preset.config.json: Error parsing JSON`
        );
        expect(trace[1]).toEqual(`caused by CrashError: Error parsing JSON`);
        expect(trace[2]).toContain(`caused by SyntaxError: Expected property name or '}' in JSON`);
        expect(trace[3]).toEqual(`CrashError: Preset preset1 not found`);
        expect(trace[4]).toEqual(
          `CrashError: Configuration validation failed: final.schema is not registered in the collection.`
        );
        expect(trace[5]).toEqual(
          `caused by ValidationError: final.schema is not registered in the collection.`
        );
        done();
      });
      port.start().catch(error => {
        throw error;
      });
    }, 300);
  });
});
