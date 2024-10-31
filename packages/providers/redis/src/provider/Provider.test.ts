/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import IORedis from 'ioredis';
import { ReplyError } from 'redis-errors';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  port: 28910,
  host: '127.0.0.1',
  db: 0,
  family: 4,
  keepAlive: 10000,
  connectionName: 'myRedis',
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
  lazyConnect: true,
  keyPrefix: '',
  readOnly: false,
  retryStrategy: (times: number): number => {
    return Math.min(times * 2000, 60000);
  },
  reconnectOnError: (error: ReplyError): boolean => {
    if (error.message.includes('ERR invalid password')) {
      return false;
    }
    return true;
  },
  showFriendlyErrorStack: true,
  checkInterval: 10000,
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

const memory =
  '# Memory' +
  '\r\nused_memory:1090104' +
  '\r\nused_memory_human:1.04M' +
  '\r\nmaxmemory:0' +
  '\r\nmaxmemory_human:0B' +
  '\r\n';
const memoryProblem =
  '# Memory' +
  '\r\nused_memory:1090104' +
  '\r\nused_memory_human:1.04M' +
  '\r\nmaxmemory:1' +
  '\r\nmaxmemory_human:1B' +
  '\r\n';
const memoryUnparsable =
  '# Memory' +
  '\r\nused_memory:1090104' +
  '\r\nused_memory_human:1.04M' +
  '\r\nmaxmemory1' +
  '\r\nmaxmemory_human:1B' +
  '\r\n';
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
      expect(provider.client).toBeInstanceOf(IORedis);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'redis:status': [
          {
            componentId: checks['redis:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['redis:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'redis',
        logger: new FakeLogger() as LoggerInstance,
        config: {},
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(IORedis);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'redis:status': [
          {
            componentId: checks['redis:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['redis:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeInstanceOf(IORedis);
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it('Should start the status check interval if connection is established, and stop it on disconnect', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memory);
      port.on('error', error => {
        throw error;
      });
      port.on('healthy', () => {
        const checks = port.checks;
        expect(checks).toEqual({
          memory: [
            {
              componentId: checks['memory'][0].componentId,
              observedUnit: 'used memory / max memory',
              observedValue: '1090104 / 0',
              output: `The system is using 0.00% of the available memory`,
              status: 'pass',
              time: checks['memory'][0].time,
            },
          ],
        });
        // @ts-ignore - Test environment
        jest.replaceProperty(port.instance, 'status', 'ready');
        // This is to test that can not wrap method twice
        port.start().then();
        expect(port.state).toBeTruthy();
        // @ts-ignore - Test environment
        expect(port.timeInterval).toBeDefined();
        expect(port.client.listenerCount('connect')).toEqual(1);
        port.close().then();
        expect(port.client.listenerCount('connect')).toEqual(0);
        done();
      });
      port.start().then(() => {
        expect(port.client.listenerCount('connect')).toEqual(1);
      });
    }, 300);
    it('Should perform the event wrapping properly for "error" on ReplyError', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memory);
      port.on('error', error => {
        expect(error.message).toEqual('myError');
        done();
      });
      port.start().then(() => {
        port.client.emit('error', new ReplyError('myError'));
      });
    }, 300);
    it('Should perform the event wrapping properly for "error" on Crash', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memory);
      port.on('error', error => {
        expect(error.message).toEqual('myError');
        done();
      });
      port.start().then(() => {
        port.client.emit('error', new Crash('myError'));
      });
    }, 300);
    it('Should perform the event wrapping properly for "end"', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memory);
      port.on('closed', error => {
        expect(error?.message).toEqual('The connection was closed intentionally');
        done();
      });
      port.start().then(() => {
        port.client.emit('end');
      });
    }, 300);
    it('Should resolve if try to connect when the instance is already connected', async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      const mock = jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'info').mockResolvedValue('OK');
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memory);
      await port.start();
      await port.start();
      await port.close();
      expect(mock).toHaveBeenCalledTimes(1);
    }, 300);
    it('Should resolve if try to connect and an error is throw by the connect with the message "Redis is already connecting/connected"', async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      const mock = jest
        .spyOn(port.client, 'connect')
        .mockRejectedValue(new Error('Redis is already connecting/connected'));
      jest.spyOn(port.client, 'info').mockResolvedValue('OK');
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memory);
      await port.start();
      await port.close();
      expect(mock).toHaveBeenCalledTimes(1);
    }, 300);
    it('Should resolve if try to disconnect when the instance is already disconnected', async () => {
      try {
        const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
        expect(port).toBeDefined();
        jest.spyOn(port.client, 'info').mockResolvedValue(memory);
        await port.close();
      } catch (error) {
        console.log(error);
        throw new Error('Should not be here');
      }
    }, 300);
    it('Should resolve if try to disconnect and an error is throw by the quit method with the message "Connection is closed."', async () => {
      try {
        const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
        expect(port).toBeDefined();
        // @ts-ignore - Test environment
        jest.replaceProperty(port, 'connected', true);
        const mock = jest
          .spyOn(port.client, 'quit')
          .mockRejectedValue(new Error('Connection is closed.'));
        jest.spyOn(port.client, 'info').mockResolvedValue(memory);
        await port.close();
        expect(mock).toHaveBeenCalledTimes(1);
      } catch (error) {
        console.log(error);
        throw new Error('Should not be here');
      }
    }, 300);
  });
  describe('#Sad path', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
    it('Should rejects if try to connect and the methods rejects', async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockRejectedValue(new Error('myError'));
      try {
        //@ts-ignore - Test environment
        expect(port.timeInterval).toBeNull();
        await port.start();
        throw new Error('Should not be here');
      } catch (rawError: any) {
        //@ts-ignore - Test environment
        expect(port.timeInterval).toBeDefined();
        expect(rawError).toBeInstanceOf(Crash);
        expect(rawError.message).toEqual(
          'Error performing the connection to Redis instance: myError'
        );
        expect(rawError.cause).toBeInstanceOf(Error);
        expect(rawError.cause?.message).toEqual('myError');
      }
    }, 300);
    it('Should rejects if try to disconnect and the methods rejects', async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      // @ts-ignore - Test environment
      jest.replaceProperty(port, 'connected', true);
      jest.spyOn(port.client, 'quit').mockRejectedValue(new Error('myError'));
      try {
        await port.stop();
        throw new Error('Should not be here');
      } catch (rawError: any) {
        expect(rawError).toBeInstanceOf(Crash);
        expect(rawError.message).toEqual(
          'Error performing the disconnection to Redis instance: myError'
        );
        expect(rawError.cause).toBeInstanceOf(Error);
        expect(rawError.cause?.message).toEqual('myError');
      }
    }, 300);
    it('Should emit healthy and unhealthy events properly', done => {
      const port = new Port(
        { ...DEFAULT_CONFIG, lazyConnect: false, checkInterval: 50 },
        new FakeLogger() as LoggerInstance
      );
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      let count = 0;
      jest.spyOn(port.client, 'info').mockImplementation(() => {
        count++;
        if (count === 1 || count === 2 || count === 3 || count > 4) {
          return Promise.resolve(memory);
        } else if (count === 4) {
          return Promise.resolve(memoryProblem);
        } else {
          return Promise.resolve(memory);
        }
      });
      port.on('error', error => {
        throw error;
      });
      let wasUnhealthy = false;
      let wasHealthy = false;
      port.on('healthy', () => {
        wasHealthy = true;
        if (wasHealthy && wasUnhealthy) {
          port.close().then(done);
        }
      });
      port.on('unhealthy', error => {
        wasUnhealthy = true;
      });
      port.start().then();
    }, 300);
    it('Should emit unhealthy event if there is a problem in the memory resources', done => {
      const port = new Port(
        { ...DEFAULT_CONFIG, checkInterval: 50 },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memoryProblem);
      port.on('error', error => {
        throw error;
      });
      port.on('unhealthy', error => {
        expect(error.message).toEqual('The system is OOM - used 1.04M - max 1B');
        const checks = port.checks;
        expect(checks).toEqual({
          memory: [
            {
              componentId: checks['memory'][0].componentId,
              observedUnit: 'used memory / max memory',
              observedValue: '1090104 / 1',
              output: 'The system is OOM - used 1.04M - max 1B',
              status: 'fail',
              time: checks['memory'][0].time,
            },
          ],
        });
        port.close().then();
        done();
      });
      port.start().then(() => {
        expect(port.client.listenerCount('connect')).toEqual(1);
      });
    }, 300);
    it('Should emit unhealthy event if there is a problem parsing the results', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockResolvedValue(memoryUnparsable);
      port.on('error', error => {
        throw error;
      });
      port.on('unhealthy', error => {
        expect(error.message).toContain('Error parsing the Redis INFO stats: Unexpected token');
        const checks = port.checks;
        expect(checks).toEqual({
          memory: [
            {
              componentId: checks['memory'][0].componentId,
              observedUnit: 'used memory / max memory',
              observedValue: '- bytes / - bytes',
              output: error.message,
              status: 'fail',
              time: checks['memory'][0].time,
            },
          ],
        });
        port.close().then();
        done();
      });
      port.start().then(() => {
        expect(port.client.listenerCount('connect')).toEqual(1);
      });
    }, 300);
    it('Should emit unhealthy event if there is a problem in the memory resources the second time that is checked', done => {
      const port = new Port(
        { ...DEFAULT_CONFIG, checkInterval: 50 },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest
        .spyOn(port.client, 'info')
        .mockResolvedValueOnce(memory)
        .mockResolvedValueOnce(memory)
        .mockResolvedValueOnce(memoryProblem)
        .mockResolvedValueOnce(memoryProblem);
      port.on('error', error => {
        throw error;
      });
      port.on('unhealthy', error => {
        expect(error.message).toEqual('The system is OOM - used 1.04M - max 1B');
        port.close().then();
        done();
      });
      port.start().then(() => {
        expect(port.client.listenerCount('connect')).toEqual(1);
      });
    }, 300);
    it('Should emit error event if there is a problem getting the info from the server', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockRejectedValue(new Error('myError'));
      port.on('error', error => {
        expect(error.message).toEqual('Error performing the status check of the Redis instance');
        port.close().then();
        done();
      });
      port.start().then();
    }, 300);
    it('Should emit error event if there is a problem getting the info from the server as ReplyError "NOAUTH Authentication required"', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest
        .spyOn(port.client, 'info')
        .mockRejectedValue(new ReplyError('NOAUTH Authentication required'));
      port.on('error', (error: any) => {
        expect(error.message).toEqual('Error performing the status check of the Redis instance');
        expect(error.cause.message).toEqual('Error getting the Redis INFO stats');
        expect(error.cause.cause.message).toEqual('No authentication config for RDB connection');
        port.close().then();
        done();
      });
      port.start().then();
    }, 300);
    it('Should emit error event if there is a problem getting the info from the server as ReplyError "ERR invalid password"', done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest.spyOn(port.client, 'connect').mockResolvedValue();
      jest.spyOn(port.client, 'quit').mockResolvedValue('OK');
      jest.spyOn(port.client, 'info').mockRejectedValue(new ReplyError('ERR invalid password'));
      port.on('error', (error: any) => {
        expect(error.message).toEqual('Error performing the status check of the Redis instance');
        expect(error.cause.message).toEqual('Error getting the Redis INFO stats');
        expect(error.cause.cause.message).toEqual('Wrong authentication config on RDB connection');
        port.close().then();
        done();
      });
      port.start().then();
    }, 300);
  });
});
