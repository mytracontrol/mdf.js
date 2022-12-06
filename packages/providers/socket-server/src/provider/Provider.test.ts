/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { undoMocks } from '@mdf.js/utils';
import { Server } from 'socket.io';
import { CONFIG_PROVIDER_BASE_NAME } from '../config';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  port: 38181,
  host: 'localhost',
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

describe('#Port #Socket.io server', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
    });
    it('Should create provider using the factory instance with default configuration and an app', () => {
      const provider = Factory.create({ config: DEFAULT_CONFIG });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(Server);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      //@ts-ignore - Test environment
      expect(provider.port.config.transports).toEqual(['polling', 'websocket']);
      const checks = provider.checks;
      expect(checks).toEqual({
        [`${CONFIG_PROVIDER_BASE_NAME}:status`]: [
          {
            componentId: checks[`${CONFIG_PROVIDER_BASE_NAME}:status`][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks[`${CONFIG_PROVIDER_BASE_NAME}:status`][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: CONFIG_PROVIDER_BASE_NAME,
        logger: new FakeLogger() as LoggerInstance,
        config: DEFAULT_CONFIG,
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(Server);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        [`${CONFIG_PROVIDER_BASE_NAME}:status`]: [
          {
            componentId: checks[`${CONFIG_PROVIDER_BASE_NAME}:status`][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks[`${CONFIG_PROVIDER_BASE_NAME}:status`][0].time,
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
    it('Should start/stop the server on request', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      // This is one because there is a TLS connection listener
      expect(port.client.listenerCount('connection')).toEqual(0);
      port.on('error', error => {
        throw error;
      });
      port
        .start()
        .then(() => {
          // This is to test that can not wrap method twice
          port.start().then();
          expect(port.client.listenerCount('connection')).toEqual(1);
          port.close().then();
          expect(port.client.listenerCount('connection')).toEqual(0);
          port.close().then();
          expect(port.client.listenerCount('connection')).toEqual(0);
          done();
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should reject if there is a problem starting and emit an error', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.httpServer.client, 'listen').mockReturnValue(port.httpServer.client);
      let errorEmitted = false;
      let startRejected = false;
      port.on('error', error => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Server address is already in used: localhost:38181');
        errorEmitted = true;
        if (errorEmitted && startRejected) {
          done();
        }
      });
      port
        .start()
        .then()
        .catch(error => {
          expect(error).toBeDefined();
          startRejected = true;
          if (errorEmitted && startRejected) {
            done();
          }
        });
      const error: NodeJS.ErrnoException = new Error('Test error');
      error.code = 'EADDRINUSE';
      //@ts-ignore - Test environment
      process.nextTick(() => port.httpServer.client.emit('error', error));
    }, 300);
  });
});
