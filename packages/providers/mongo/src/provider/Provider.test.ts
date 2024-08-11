/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { MongoClient } from 'mongodb';
import { Factory } from './Factory';
import { Port } from './Port';
import { Collections, Config } from './types';

const DEFAULT_CONFIG: Config = {
  url: 'mongodb://localhost:27017',
};

const COLLECTIONS_OPTIONS: Collections = {
  myCollection: {
    options: { clusteredIndex: { key: { id: 1 }, unique: true, name: 'alarmIdIndex' } },
    indexes: [
      { key: { id: 1 }, name: 'alarmIdIndex', unique: true },
      { key: { locationId: 1 }, name: 'locationIdIndex' },
      { key: { deviceId: 1 }, name: 'deviceIdIndex' },
      { key: { entity: 1 }, name: 'entityIdIndex' },
    ],
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

describe('#Port #Mongo', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(MongoClient);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'mongo:status': [
          {
            componentId: checks['mongo:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['mongo:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mongo',
        logger: new FakeLogger() as LoggerInstance,
        config: {},
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(MongoClient);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'mongo:status': [
          {
            componentId: checks['mongo:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['mongo:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create the instance with default configuration', () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.client).toBeInstanceOf(MongoClient);
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it('Should start/stop the instance properly', async () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mongo',
        logger: new FakeLogger() as LoggerInstance,
        config: {},
      });
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'close').mockResolvedValue();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('commandFailed')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(0);
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      await provider.start();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeTruthy();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(2);
      expect(provider.client.listenerCount('commandFailed')).toEqual(2);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(2);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(2);
      await provider.start();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeTruthy();
      //@ts-ignore - Test environment
      await provider.port.close();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('commandFailed')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(0);
      await provider.stop();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      await provider.stop();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
    });
    it('Should start/stop the instance properly, creating the collections if the collections not exist', async () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mongo',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          collections: COLLECTIONS_OPTIONS,
        },
      });
      const createIndexes = jest.fn().mockResolvedValue(undefined);
      const toArray = jest.fn().mockResolvedValue([]);
      const mockedDB = {
        listCollections: jest.fn().mockReturnValue({
          toArray,
        }),
        createCollection: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn().mockReturnValue({
          createIndexes,
        }),
      };
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'db').mockReturnValue(mockedDB);
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'close').mockResolvedValue();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('commandFailed')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(0);
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      await provider.start();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeTruthy();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(2);
      expect(provider.client.listenerCount('commandFailed')).toEqual(2);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(2);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(2);
      await provider.start();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeTruthy();
      //@ts-ignore - Test environment
      await provider.port.close();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('commandFailed')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(0);
      await provider.stop();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      await provider.stop();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      expect(mockedDB.listCollections).toHaveBeenCalledTimes(1);
      expect(toArray).toHaveBeenCalledTimes(1);
      expect(mockedDB.listCollections.mock.calls[0][0]).toEqual({});
      expect(mockedDB.listCollections.mock.calls[0][1]).toEqual({ nameOnly: true });
      expect(mockedDB.createCollection).toHaveBeenCalledTimes(1);
      expect(mockedDB.createCollection.mock.calls[0][0]).toEqual('myCollection');
      expect(mockedDB.createCollection.mock.calls[0][1]).toEqual(
        COLLECTIONS_OPTIONS['myCollection'].options
      );
      expect(mockedDB.collection).toHaveBeenCalledTimes(1);
      expect(createIndexes).toHaveBeenCalledTimes(1);
      expect(createIndexes.mock.calls[0][0]).toEqual(COLLECTIONS_OPTIONS['myCollection'].indexes);
    });
    it('Should start/stop the instance properly, and not creating the collections if the collection exist', async () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mongo',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          collections: COLLECTIONS_OPTIONS,
        },
      });
      const createIndexes = jest.fn().mockResolvedValue(undefined);
      const toArray = jest.fn().mockResolvedValue([{ name: 'myCollection' }]);
      const mockedDB = {
        listCollections: jest.fn().mockReturnValue({
          toArray,
        }),
        createCollection: jest.fn().mockResolvedValue(undefined),
        collection: jest.fn().mockReturnValue({
          createIndexes,
        }),
      };
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'db').mockReturnValue(mockedDB);
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'close').mockResolvedValue();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('commandFailed')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(0);
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      await provider.start();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeTruthy();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(2);
      expect(provider.client.listenerCount('commandFailed')).toEqual(2);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(2);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(2);
      await provider.start();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeTruthy();
      //@ts-ignore - Test environment
      await provider.port.close();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      expect(provider.client.listenerCount('commandSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('commandFailed')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatSucceeded')).toEqual(0);
      expect(provider.client.listenerCount('serverHeartbeatFailed')).toEqual(0);
      await provider.stop();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      await provider.stop();
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      expect(mockedDB.listCollections).toHaveBeenCalledTimes(1);
      expect(toArray).toHaveBeenCalledTimes(1);
      expect(mockedDB.listCollections.mock.calls[0][0]).toEqual({});
      expect(mockedDB.listCollections.mock.calls[0][1]).toEqual({ nameOnly: true });
      expect(mockedDB.createCollection).toHaveBeenCalledTimes(0);
      expect(mockedDB.collection).toHaveBeenCalledTimes(0);
      expect(createIndexes).toHaveBeenCalledTimes(0);
    });
    it('Should log events as silly', async () => {
      const logger = new FakeLogger();
      //@ts-ignore - Test environment
      const provider = Factory.create({ logger });
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      await provider.start();
      //@ts-ignore - Test environment
      provider.client.emit('commandStarted', { test: 1 });
      expect(logger.entry).toEqual(
        'New incoming [commandStarted] event from Mongo with meta: { test: 1 }'
      );
      await provider.stop();
    });
    it('Should register commandFailed and commandSucceeded events', async () => {
      const provider = Factory.create();
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      await provider.start();
      let errors = 0;
      provider.on('error', error => {
        expect(error.message).toEqual('test - myMessage');
        errors++;
      });
      provider.client.emit('commandFailed', {
        commandName: 'test',
        // @ts-ignore - Test environment
        failure: { message: 'myMessage' },
      });
      provider.client.emit('commandSucceeded', {
        commandName: 'test',
        // @ts-ignore - Test environment
        any: {},
      });
      let checks = provider.checks;
      expect(checks).toEqual({
        'mongo:lastCommand': [
          {
            componentId: checks['mongo:lastCommand'][0].componentId,
            observedUnit: 'command result',
            observedValue: 'succeeded',
            output: undefined,
            status: 'pass',
            time: checks['mongo:lastCommand'][0].time,
          },
        ],
        'mongo:lastFailedCommands': [
          {
            componentId: checks['mongo:lastFailedCommands'][0].componentId,
            observedUnit: 'last failed commands',
            observedValue: [`${checks['mongo:lastFailedCommands'][0].time} - test - myMessage`],
            output: undefined,
            status: 'pass',
            time: checks['mongo:lastFailedCommands'][0].time,
          },
        ],
        'mongo:status': [
          {
            componentId: checks['mongo:status'][0].componentId,
            componentType: 'database',
            observedValue: 'running',
            output: undefined,
            status: 'pass',
            time: checks['mongo:status'][0].time,
          },
        ],
      });
      for (let i = 0; i < 12; i++) {
        provider.client.emit('commandFailed', {
          commandName: 'test',
          // @ts-ignore - Test environment
          failure: { message: 'myMessage' },
        });
      }
      checks = provider.checks;
      expect(checks['mongo:lastFailedCommands'][0].observedValue.length).toEqual(10);
      expect(checks).toEqual({
        'mongo:lastCommand': [
          {
            componentId: checks['mongo:lastCommand'][0].componentId,
            observedUnit: 'command result',
            observedValue: 'failed',
            output: 'test - myMessage',
            status: 'fail',
            time: checks['mongo:lastCommand'][0].time,
          },
        ],
        'mongo:lastFailedCommands': [
          {
            componentId: checks['mongo:lastFailedCommands'][0].componentId,
            observedUnit: 'last failed commands',
            observedValue: checks['mongo:lastFailedCommands'][0].observedValue,
            output: undefined,
            status: 'pass',
            time: checks['mongo:lastFailedCommands'][0].time,
          },
        ],
        'mongo:status': [
          {
            componentId: checks['mongo:status'][0].componentId,
            componentType: 'database',
            observedValue: 'running',
            output: undefined,
            status: 'pass',
            time: checks['mongo:status'][0].time,
          },
        ],
      });
      expect(errors).toEqual(13);
    });
    it('Should register serverHeartbeatFailed and serverHeartbeatSucceeded events', done => {
      const provider = Factory.create();
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      provider.start().then(() => {
        let healthy = false;
        // @ts-ignore - Test environment
        provider.port.on('unhealthy', error => {
          expect(error.message).toEqual('Mongo port is unhealthy: myMessage');
          const checks = provider.checks;
          expect(checks).toEqual({
            'mongo:heartbeat': [
              {
                componentId: checks['mongo:heartbeat'][0].componentId,
                observedUnit: 'heartbeat result',
                observedValue: 'failed',
                output: 'test - myMessage',
                status: 'fail',
                time: checks['mongo:heartbeat'][0].time,
              },
            ],
            'mongo:status': [
              {
                componentId: checks['mongo:status'][0].componentId,
                componentType: 'database',
                observedValue: 'error',
                output: ['CrashError: Mongo port is unhealthy: myMessage'],
                status: 'fail',
                time: checks['mongo:status'][0].time,
              },
            ],
          });
          if (healthy) {
            done();
          }
        });
        //@ts-ignore - Test environment
        provider.port.on('healthy', () => {
          healthy = true;
          const checks = provider.checks;
          expect(checks).toEqual({
            'mongo:heartbeat': [
              {
                componentId: checks['mongo:heartbeat'][0].componentId,
                observedUnit: 'heartbeat result',
                observedValue: {
                  any: {},
                },
                output: undefined,
                status: 'pass',
                time: checks['mongo:heartbeat'][0].time,
              },
            ],
            'mongo:status': [
              {
                componentId: checks['mongo:status'][0].componentId,
                componentType: 'database',
                observedValue: 'running',
                output: undefined,
                status: 'pass',
                time: checks['mongo:status'][0].time,
              },
            ],
          });
        });
        provider.client.emit('serverHeartbeatSucceeded', {
          // @ts-ignore - Test environment
          any: {},
        });
        provider.client.emit('serverHeartbeatFailed', {
          connectionId: 'test',
          // @ts-ignore - Test environment
          failure: { message: 'myMessage' },
        });
      });
    });
  });
  describe('#Sad path', () => {
    it('Should rejects start the connect method rejects', async () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mongo',
        logger: new FakeLogger() as LoggerInstance,
        config: {},
      });
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockRejectedValue(new Crash('myError'));
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      try {
        await provider.start();
      } catch (error: any) {
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toEqual('Error starting Mongo port: myError');
      }
    });
    it('Should rejects stop the close method rejects', async () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'mongo',
        logger: new FakeLogger() as LoggerInstance,
        config: {},
      });
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(provider.client, 'close').mockRejectedValue(new Crash('myError'));
      //@ts-ignore - Test environment
      expect(provider.port.isConnected).toBeFalsy();
      try {
        await provider.start();
        await provider.stop();
      } catch (error: any) {
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toEqual('Error stopping Mongo port: myError');
      }
    });
  });
});
