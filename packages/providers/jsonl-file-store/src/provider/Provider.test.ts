/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import fs from 'fs';
import { PassThrough } from 'stream';
import { JsonlFileStoreManager } from '..';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  openFilesFolderPath: './data/open',
  closedFilesFolderPath: './data/closed',
  fileEncoding: 'utf-8',
  createFolders: true,
  rotationInterval: 600000,
  failOnStartSetup: true,
  appendRetryOptions: {
    timeout: 5000,
    attempts: 3,
  },
  rotationRetryOptions: {
    timeout: 5000,
    attempts: 3,
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
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'test',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          openFilesFolderPath: './custom/open',
          closedFilesFolderPath: './custom/closed',
          fileEncoding: 'ascii',
          createFolders: false,
          rotationInterval: 9000,
          failOnStartSetup: false,
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
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeDefined();
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it('Should start/stop the client on request', done => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
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
          process.nextTick(done);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should emit unhealthy event if there is an error in a jsonl file storage operation', done => {
      const port = new Port(
        { ...DEFAULT_CONFIG, appendRetryOptions: { attempts: 1 } },
        new FakeLogger() as LoggerInstance
      );
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      jest.spyOn(fs, 'createWriteStream').mockImplementation(() => {
        throw new Error('append error');
      });
      const unhealthyHandler = jest.fn(error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toEqual('Error in jsonl file store operation');
        const trace = error.trace();
        expect(trace[0]).toContain(`CrashError: Error in jsonl file store operation`);
        expect(trace[1]).toEqual(`caused by CrashError: Error appending data to file`);
      });
      expect(port).toBeDefined();

      port.on('unhealthy', unhealthyHandler);
      port
        .start()
        .then(() => {
          return port.client.append('Hello', 'file1');
        })
        .then(() => {
          throw new Error('Should not be here');
        })
        .catch(error => {
          expect(unhealthyHandler).toHaveBeenCalledTimes(1);
          port.stop();
          done();
        });
    }, 300);
    it('Should emit healthy event if there is a recovery from previous error in a jsonl file storage operation', done => {
      const port = new Port(
        { ...DEFAULT_CONFIG, appendRetryOptions: { attempts: 1 } },
        new FakeLogger() as LoggerInstance
      );
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const mockWriteStream = new PassThrough();
      jest
        .spyOn(fs, 'createWriteStream')
        .mockImplementationOnce(() => {
          throw new Error('append error');
        })
        .mockImplementationOnce(() => {
          return mockWriteStream as any;
        });
      const unhealthyHandler = jest.fn();
      const healthyHandler = jest.fn();
      expect(port).toBeDefined();
      port.on('unhealthy', unhealthyHandler);
      port.on('healthy', healthyHandler);
      port
        .start()
        .then(() => {
          return port.client.append('Hello, World!', 'file1');
        })
        .then(() => {
          return port.client.append('Bye, World!', 'file1');
        })
        .finally(() => {
          expect(unhealthyHandler).toHaveBeenCalledTimes(1);
          expect(healthyHandler).toHaveBeenCalledTimes(1);
          expect(port['lastHealthState']).toEqual('healthy');
          port.stop();
          done();
        });
    }, 300);
  });
});
