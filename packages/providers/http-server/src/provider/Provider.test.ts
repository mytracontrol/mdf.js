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
import { Crash } from '@mdf/crash';
import { LoggerInstance, Provider } from '@mdf/provider';
import { undoMocks } from '@mdf/utils';
import express from 'express';
import { Server } from 'http';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  port: 38181,
  host: 'localhost',
  app: express(),
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

describe('#Port #HTTP-Server', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
    });
    it('Should create provider using the factory instance with default configuration and an app', () => {
      const provider = Factory.create({ config: DEFAULT_CONFIG });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.client).toBeInstanceOf(Server);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'http-server:status': [
          {
            componentId: checks['http-server:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['http-server:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'http-server',
        logger: new FakeLogger() as LoggerInstance,
        config: DEFAULT_CONFIG,
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.client).toBeInstanceOf(Server);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'http-server:status': [
          {
            componentId: checks['http-server:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['http-server:status'][0].time,
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
      // This is one because there is a TLS connection listener and another one from terminator
      expect(port.client.listenerCount('connection')).toEqual(2);
      port.on('error', error => {
        throw error;
      });
      port
        .start()
        .then(() => port.start().then())
        .then(() => {
          // This is to test that can not wrap method twice
          expect(port.client.listenerCount('connection')).toEqual(3);
        })
        .then(() => port.close().then())
        .then(() => {
          expect(port.client.listenerCount('connection')).toEqual(2);
        })
        .then(() => port.close().then())
        .then(() => {
          expect(port.client.listenerCount('connection')).toEqual(2);
        })
        .then(done)
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should create provider using a default app is not app is included', () => {
      const provider = Factory.create();
      //@ts-ignore - Test environment
      expect(provider.config).toEqual({
        //@ts-ignore - Test environment
        app: provider.config.app,
        host: 'localhost',
        port: 8080,
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.client).toBeInstanceOf(Server);
      expect(provider.state).toEqual('stopped');
      const checks = provider.checks;
      expect(checks).toEqual({
        'http-server:status': [
          {
            componentId: checks['http-server:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['http-server:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should reject if there is a problem starting and emit an error - EADDRINUSE', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'listen').mockReturnValue(port.client);
      port.on('error', error => {
        throw error;
      });
      port
        .start()
        .then()
        .catch(error => {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Server address is already in used: localhost:38181');
          done();
        });
      const error: NodeJS.ErrnoException = new Error('Test error');
      error.code = 'EADDRINUSE';
      port.client.emit('error', error);
    }, 300);
    it('Should reject if there is a problem starting and emit an error - ERR_SERVER_ALREADY_LISTEN', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'listen').mockReturnValue(port.client);
      port.on('error', error => {
        throw error;
      });
      port
        .start()
        .then()
        .catch(error => {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Server is already listening on: localhost:38181');
          done();
        });
      const error: NodeJS.ErrnoException = new Error('Test error');
      error.code = 'ERR_SERVER_ALREADY_LISTEN';
      port.client.emit('error', error);
    }, 300);
    it('Should reject if there is a problem stopping', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'listening', 'get').mockReturnValue(true);
      //@ts-ignore - Test environment
      jest.spyOn(port.terminator, 'terminate').mockRejectedValue(new Error('myError'));
      port
        .start()
        .then(() => port.close())
        .then()
        .catch(error => {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error closing HTTP server: myError');
          done();
        });
    }, 300);
    it('Should capture error events one is started', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      port.on('error', error => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('myError');
        port.close().then(done);
      });
      port.start().then(() => {
        port.client.emit('error', new Error('myError'));
      });
    }, 300);
  });
});
