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
import { FileSystemManager } from '../Client';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  readOptions: { encoding: 'utf-8', flag: 'r' },
  writeOptions: { encoding: 'utf-8', flag: 'a' },
  copyOptions: { mode: 1 },
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

describe('#Port #FileSystem', () => {
  describe('#Happy path', () => {
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(FileSystemManager);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'file-system:status': [
          {
            componentId: checks['file-system:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['file-system:status'][0].time,
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
          readOptions: { encoding: 'ascii', flag: 'r+' },
          writeOptions: { encoding: 'ascii', flag: 'w+', mode: 0 },
          copyOptions: { mode: 0 },
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
    it('Should emit unhealthy event if there is an error in a file system operation', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const eventsEmitted: string[] = [];
      jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('append error');
      });
      expect(port).toBeDefined();
      port.on('unhealthy', error => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Multi);
        expect(error.message).toEqual('Error in file system operation');
        const trace = error.trace();
        expect(trace[0]).toEqual(`CrashError: Error appending data to file`);
        expect(trace[1]).toEqual(`caused by Error: append error`);
        eventsEmitted.push('unhealthy');
      });
      port
        .start()
        .then(() => {
          port.client.appendFile('test.txt', 'Hello, World!', 'utf-8');
        })
        .catch(error => {
          expect(eventsEmitted).toEqual(['unhealthy']);
          done();
        });
    }, 300);
    it('Should emit healthy event if there is a recovery from previous error in a file system operation', done => {
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
          port.client.appendFile('test.txt', 'Hello, World!', 'utf-8');
        })
        .catch(error => {
          port.client.appendFile('test.txt', 'Bye, World!', 'utf-8');
        })
        .finally(() => {
          expect(eventsEmitted).toEqual(['unhealthy', 'healthy']);
          done();
        });
    }, 300);
  });
});
