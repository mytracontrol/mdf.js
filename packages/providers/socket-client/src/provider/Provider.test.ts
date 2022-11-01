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
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { SocketIOServer } from '@mdf.js/socket-server-provider';
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

describe('#Port #Socket.IO #Client', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.client).toBeDefined();
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'socket.io-client:status': [
          {
            componentId: checks['socket.io-client:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['socket.io-client:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'socket.io-client',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          port: 8080,
          host: 'http://localhost',
          path: '/socket.io',
        },
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.client).toBeDefined();
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'socket.io-client:status': [
          {
            componentId: checks['socket.io-client:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['socket.io-client:status'][0].time,
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
      const myServer = SocketIOServer.Factory.create({ config: { port: 9999, host: 'localhost' } });
      const port = new Port({ url: 'http://localhost:9999' }, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      port.on('error', error => {
        throw error;
      });
      myServer
        .start()
        .then(() => port.start())
        .then(() => port.start())
        .then(() => port.close())
        .then(() => port.close())
        .then(() => myServer.stop())
        .then(() => {
          process.nextTick(done);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should reject with an error if try to connect and fails too much times', () => {
      const port = new Port(
        { url: 'http://localhost:9999', reconnectionAttempts: 1, reconnectionDelay: 100 },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      return port.start().catch(error => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Socket.IO Client connection error');
      });
    }, 300);
    it('Should reject with an error if try to connect and fails without retries', () => {
      const port = new Port(
        { url: 'http://localhost:9999', reconnection: false },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      return port.start().catch(error => {
        expect(error).toBeDefined();
        expect(error.message).toEqual(
          'Connection error: xhr poll error, no reconnect is configured'
        );
      });
    }, 300);
    it('Should emit unhealthy/healthy events if there is a disconnection/reconnection', done => {
      const myServer = SocketIOServer.Factory.create({ config: { port: 9999, host: 'localhost' } });
      const myRedundantServer = SocketIOServer.Factory.create({
        config: { port: 9999, host: 'localhost' },
      });
      const port = new Port(
        { url: 'http://localhost:9999', reconnectionDelay: 10 },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      port.on('error', error => {
        throw error;
      });
      let healthy = 0;
      let unhealthy = 0;
      port.on('unhealthy', () => {
        unhealthy++;
        myRedundantServer.start().then();
      });
      port.on('healthy', () => {
        healthy++;
        if (unhealthy === 1) {
          port
            .stop()
            .then(() => myRedundantServer.stop())
            .then(() => {
              process.nextTick(done);
            });
        }
      });
      myServer
        .start()
        .then(() => port.start())
        .then(() => myServer.stop())
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
