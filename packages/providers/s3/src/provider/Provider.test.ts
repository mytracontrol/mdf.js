/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { S3Client } from '@aws-sdk/client-s3';
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  region: 'region',
  credentials: {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
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

describe('#Port #Redis', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(S3Client);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        's3:status': [
          {
            componentId: checks['s3:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['s3:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 's3-provider',
        logger: new FakeLogger() as LoggerInstance,
        config: {},
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(S3Client);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        's3-provider:status': [
          {
            componentId: checks['s3-provider:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['s3-provider:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeInstanceOf(S3Client);
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it('Should resolve if try to connect when the instance is not connected yet', async () => {
      try {
        const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
        expect(port).toBeDefined();
        await port.start();
        expect(port.state).toBe(true);
      } catch (error) {
        console.log(error);
        throw new Error('Should not be here');
      }
    }, 300);
    it('Should resolve if try to connect when the instance is already connected', async () => {
      try {
        const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
        expect(port).toBeDefined();
        await port.start();
        expect(port.state).toBe(true);
        await port.start();
        expect(port.state).toBe(true);
      } catch (error) {
        console.log(error);
        throw new Error('Should not be here');
      }
    }, 300);
    it('Should resolve if try to disconnect when the instance is connected', async () => {
      try {
        const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
        expect(port).toBeDefined();
        await port.start();
        const mock = jest.spyOn(port.client, 'destroy').mockReturnValue();
        await port.close();
        expect(mock).toHaveBeenCalledTimes(1);
        expect(port.state).toBe(false);
      } catch (error) {
        console.log(error);
        throw new Error('Should not be here');
      }
    }, 300);
    it('Should resolve if try to disconnect when the instance is already disconnected', async () => {
      try {
        const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
        expect(port).toBeDefined();
        const mock = jest.spyOn(port.client, 'destroy').mockReturnValue();
        await port.close();
        expect(mock).toHaveBeenCalledTimes(0);
        expect(port.state).toBe(false);
      } catch (error) {
        console.log(error);
        throw new Error('Should not be here');
      }
    }, 300);
  });
});
