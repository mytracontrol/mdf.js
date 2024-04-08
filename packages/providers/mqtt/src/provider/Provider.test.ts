/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Client, DoneCallback } from 'mqtt';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  url: 'mqtt://localhost:1883',
  protocol: 'mqtt',
  resubscribe: true,
  clientId: 'mqtt',
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
describe('#Port #mqtt', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(Client);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'mqtt:status': [
          {
            componentId: checks['mqtt:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['mqtt:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mqtt',
        logger: new FakeLogger() as LoggerInstance,
        config: { url: 'mqtt://localhost:10' },
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(Client);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'mqtt:status': [
          {
            componentId: checks['mqtt:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['mqtt:status'][0].time,
          },
        ],
      });
    }, 300);
    it(`Should create a valid instance`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeInstanceOf(Client);
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it(`Should resolve the promise when the port is already started`, async () => {
      const logger = new FakeLogger();
      const port = new Port(DEFAULT_CONFIG, logger as LoggerInstance);
      //@ts-ignore - Test environment
      port.isConnected = true;
      await expect(port.start()).resolves.toBeUndefined();
      expect(logger.entry).toEqual(`Port already started`);
    }, 300);
    it(`Should resolve the promise when the port is already stopped`, async () => {
      const logger = new FakeLogger();
      const port = new Port(DEFAULT_CONFIG, logger as LoggerInstance);
      //@ts-ignore - Test environment
      port.isConnected = false;
      await expect(port.close()).resolves.toBeUndefined();
      expect(logger.entry).toEqual(`Port already stopped`);
    }, 300);
    it(`Should star/stop the port instance properly`, async () => {
      const logger = new FakeLogger();
      const port = new Port(
        { ...DEFAULT_CONFIG, url: 'mqtt://1.1.1.1:1883' },
        logger as LoggerInstance
      );
      expect(port.state).toBeFalsy();
      jest.spyOn(port.client, 'connect').mockImplementation(() => {
        setTimeout(() => {
          port.client.emit('connect', {
            cmd: 'connack',
            length: 2,
            sessionPresent: false,
            returnCode: 0,
          });
        }, 100);
        return port.client;
      });
      jest.spyOn(port.client, 'endAsync').mockImplementation(() => {
        port.client.emit('close');
        return Promise.resolve();
      });
      await port.start();
      expect(port.state).toBeFalsy();
      //@ts-ignore - Test environment
      port.client.pingResp = true;
      expect(port.state).toBeTruthy();
      await port.stop();
      //@ts-ignore - Test environment
      port.client.pingResp = false;
      expect(port.state).toBeFalsy();
      expect(port.client.endAsync).toHaveBeenCalledTimes(1);
    }, 300);
    it(`Should log events when is started and not when is stopped`, async () => {
      const logger = new FakeLogger();
      const port = new Port(
        { ...DEFAULT_CONFIG, url: 'mqtt://1.1.1.1:1883', clientId: undefined },
        logger as LoggerInstance
      );
      expect(port.state).toBeFalsy();
      jest.spyOn(port.client, 'connect').mockImplementation(() => {
        port.client.emit('connect', {
          cmd: 'connack',
          length: 2,
          sessionPresent: false,
          returnCode: 0,
        });
        return port.client;
      });
      jest.spyOn(port.client, 'endAsync').mockImplementation(() => {
        port.client.emit('close');
        return Promise.resolve();
      });
      port.on('error', error => {
        expect(error).toEqual(new Error('error'));
      });
      expect(logger.entry).toEqual(`New instance of MQTT port created: ${port.uuid}`);
      port.client.emit('disconnect', { cmd: 'disconnect' });
      expect(logger.entry).toEqual(`New instance of MQTT port created: ${port.uuid}`);
      port.client.emit('reconnect');
      expect(logger.entry).toEqual(`New instance of MQTT port created: ${port.uuid}`);
      await port.start();
      expect(port.state).toBeFalsy();
      //@ts-ignore - Test environment
      port.client.pingResp = true;
      expect(port.state).toBeTruthy();
      port.client.emit('disconnect', { cmd: 'disconnect' });
      expect(logger.entry).toEqual(
        `Port disconnection request from broker: ${JSON.stringify({ cmd: 'disconnect' }, null, 2)}`
      );
      port.client.emit('reconnect');
      expect(logger.entry).toEqual(`Port reconnecting`);
      port.client.emit('error', new Error('error'));
      expect(logger.entry).toEqual(`error`);
      await port.stop();
      //@ts-ignore - Test environment
      port.client.pingResp = false;
      expect(port.state).toBeFalsy();
      expect(port.client.endAsync).toHaveBeenCalledTimes(1);
    }, 300);
    it(`Should emit healthy and unhealthy events when the port is connected and disconnected`, async () => {
      jest.useFakeTimers();
      const logger = new FakeLogger();
      const port = new Port(
        { ...DEFAULT_CONFIG, url: 'mqtt://1.1.1.1:1883', keepalive: 100 },
        logger as LoggerInstance
      );
      let healthy = false;
      let unhealthy = false;
      port.on('healthy', () => {
        healthy = true;
      });
      port.on('unhealthy', error => {
        expect(error).toBeDefined();
        unhealthy = true;
      });
      expect(port.state).toBeFalsy();
      jest.spyOn(port.client, 'connect').mockImplementation(() => {
        port.client.emit('connect', {
          cmd: 'connack',
          length: 2,
          sessionPresent: false,
          returnCode: 0,
        });
        return port.client;
      });
      jest.spyOn(port.client, 'endAsync').mockImplementation(() => {
        port.client.emit('close');
        return Promise.resolve();
      });
      await port.start();
      jest.advanceTimersByTime(100);
      //@ts-ignore - Test environment
      port.client.pingResp = true;
      jest.advanceTimersByTime(100);
      expect(healthy).toBeTruthy();
      expect(unhealthy).toBeTruthy();
      await port.stop();
    }, 300);
  });
  describe('#Sad path', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it(`Should reject the promise if an error is received when try to connect `, async () => {
      const logger = new FakeLogger();
      const port = new Port(DEFAULT_CONFIG, logger as LoggerInstance);
      port.on('error', error => {
        expect(error).toEqual(new Error('error'));
      });
      expect(port.state).toBeFalsy();
      jest
        .spyOn(port.client, 'end')
        //@ts-ignore - Test environment
        .mockImplementation((force: boolean | boolean, cb: DoneCallback) => {
          cb();
        });
      //@ts-ignore - Test environment
      jest.spyOn(port.client, 'connect').mockImplementation(() => {
        port.client.emit('error', new Error('error'));
        return port.client;
      });
      try {
        await port.start();
      } catch (error) {
        expect(error).toEqual(new Error('error'));
      }
    }, 300);
  });
});
