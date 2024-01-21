/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { undoMocks } from '@mdf.js/utils';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {};
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

describe('#Port #HTTP-Client', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeDefined();
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'http-client:status': [
          {
            componentId: checks['http-client:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['http-client:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'http-client',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          requestConfig: { baseURL: 'http://localhost:3000' },
          httpAgentOptions: { keepAlive: false },
          httpsAgentOptions: { keepAlive: false },
        },
      });
      //@ts-ignore - Test environment
      expect(provider.client.defaults.httpAgent.options.keepAlive).toBeFalsy();
      //@ts-ignore - Test environment
      expect(provider.client.defaults.httpsAgent.options.keepAlive).toBeFalsy();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeDefined();
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'http-client:status': [
          {
            componentId: checks['http-client:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['http-client:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeDefined();
      expect(port.state).toBeTruthy();
      expect(port.checks).toEqual({});
    }, 300);
    it('Should start/stop the server on request', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      port.on('error', error => {
        throw error;
      });
      port
        .start()
        .then(() => port.close())
        .then(() => done())
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
