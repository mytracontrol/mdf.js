/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash, Multi } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import fs from 'fs';
import { JsonlFileStoreManager } from '../Client';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  writeOptions: { encoding: 'utf-8', flag: 'a' },
  rotationOptions: {
    interval: 600000,
    openFilesFolderPath: './data/open',
    closedFilesFolderPath: './data/closed',
    retryOptions: { attempts: 3, timeout: 5000 },
  },
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

describe('#Port #jsonl-file-store', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
    jest.spyOn(fs, 'writeFileSync').mockReturnValue();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  describe('#Happy path', () => {
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(JsonlFileStoreManager);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'jsonl-file-store:status': [
          {
            componentId: checks['jsonl-file-store:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['jsonl-file-store:status'][0].time,
          },
        ],
      });
      provider.client.stopRotationTimer();
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'test',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          writeOptions: { encoding: 'ascii', flag: 'w+', mode: 0 },
          rotationOptions: {
            interval: 9000,
            openFilesFolderPath: './custom/open',
            closedFilesFolderPath: './custom/closed',
            retryOptions: { attempts: 1, timeout: 9000 },
          },
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
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['test:status'][0].time,
          },
        ],
      });
      provider.client.stopRotationTimer();
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeDefined();
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
      port.client.stopRotationTimer();
    }, 300);
    it('Should start/stop the client on request', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
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
          expect(port.state).toBeFalsy();
          port.client.stopRotationTimer();
          process.nextTick(done);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should emit unhealthy event if there is an error in a jsonl file storage operation', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const eventsEmitted: string[] = [];
      jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('append error');
      });
      expect(port).toBeDefined();
      port.on('unhealthy', error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Multi);
        expect(error.message).toEqual('Error in jsonl file store operation');
        const trace = error.trace();
        expect(trace[0]).toContain(`CrashError: Execution error in task`);
        expect(trace[2]).toEqual(`caused by CrashError: Error appending data to file`);
        expect(trace[3]).toEqual(`caused by Error: append error`);
        eventsEmitted.push('unhealthy');
      });
      port
        .start()
        .then(() => {
          return port.client.append('Hello');
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(eventsEmitted).toEqual(['unhealthy']);
          port.client.stopRotationTimer();
          done();
        });
    }, 300);
    it('Should emit healthy event if there is a recovery from previous error in a jsonl file storage operation', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const eventsEmitted: string[] = [];
      jest
        .spyOn(fs, 'appendFileSync')
        .mockImplementationOnce(() => {
          throw new Error('append error');
        })
        .mockImplementationOnce(() => {
          return;
        });
      expect(port).toBeDefined();
      port.on('unhealthy', error => {
        eventsEmitted.push('unhealthy');
      });
      port.on('healthy', () => {
        eventsEmitted.push('healthy');
      });
      port
        .start()
        .then(() => {
          return port.client.append('Hello, World!');
        })
        .catch(error => {
          return port.client.append('Bye, World!');
        })
        .finally(() => {
          expect(eventsEmitted).toEqual(['unhealthy', 'healthy']);
          port.client.stopRotationTimer();
          done();
        });
    }, 300);
  });
});
