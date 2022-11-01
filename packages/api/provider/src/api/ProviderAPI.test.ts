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
// *************************************************************************************************
// #region Component imports
import { BoomHelpers, Crash, Multi } from '@mdf.js/crash';
import { DebugLogger, LoggerInstance } from '@mdf.js/logger';
import EventEmitter from 'events';
import Joi from 'joi';
import { v4 } from 'uuid';
import { Manager } from './Manager';
import { Port } from './Port';
// #endregion
// *************************************************************************************************
// #region Arrange
interface MyPortConfig {
  myParam: string;
  fail?: boolean;
  asString?: boolean;
  empty?: boolean;
}

class MyPortInstance extends EventEmitter {
  shouldReject = false;
  constructor(config: MyPortConfig) {
    super();
    if (config.fail && config.asString) {
      throw 'myError';
    }
    if (config.fail && config.empty) {
      throw {};
    }
    if (config.fail) {
      throw { message: 'myError' };
    }
  }
  start(): Promise<void> {
    if (this.shouldReject) {
      return Promise.reject(new Crash('Error', { name: 'Forced' }));
    }
    return Promise.resolve();
  }
  stop(): Promise<void> {
    if (this.shouldReject) {
      return Promise.reject(new Crash('Error', { name: 'Forced' }));
    }
    return Promise.resolve();
  }
  close(): Promise<void> {
    if (this.shouldReject) {
      return Promise.reject(new Crash('Error', { name: 'Forced' }));
    }
    return Promise.resolve();
  }
}

class MyWrapperPort extends Port<MyPortInstance, MyPortConfig> {
  _instance: MyPortInstance;

  constructor(config: MyPortConfig, logger: LoggerInstance) {
    super(config, logger, 'myWrapperPort');
    this._instance = new MyPortInstance(config);
    this._instance.on('error', error => this.emit('error', error));
    this._instance.on('closed', error => this.emit('closed', error));
    this._instance.on('unhealthy', error => this.emit('unhealthy', error));
    this._instance.on('ready', () => this.emit('ready'));
    this._instance.on('healthy', state => this.emit('healthy', state));
    this.addCheck('myMeasure', { componentId: 'myComponentId', status: 'fail' });
    this.addCheck('myMeasure', { componentId: 'myComponentId', status: 'pass' });
    this.addCheck('myMeasure', { componentId: 'myOtherComponentId', status: 'pass' });
    expect(
      this.addCheck('myOtherMeasure', {
        //@ts-ignore - Test environment
        status: 'mass',
        componentId: 'myComponent',
      })
    ).toBeFalsy();
  }
  async start(): Promise<void> {
    await this._instance.start();
  }
  async stop(): Promise<void> {
    await this._instance.stop();
  }
  async close(): Promise<void> {
    await this._instance.close();
  }
  get client(): MyPortInstance {
    return this._instance;
  }
  get state(): boolean {
    return true;
  }
}
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
}
// #endregion
// *************************************************************************************************
// #region Tests
describe('#Provider #API', () => {
  describe('#Happy path', () => {
    it('Should create a correct instance of the provider with default values', () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      expect(provider).toBeDefined();
    }, 300);
    it('Should create a correct instance of the provider with own logger', () => {
      const fakeLogger = new FakeLogger();
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
          //@ts-ignore - we are testing the logger
          logger: fakeLogger,
        },
        { myParam: 'myValue' }
      );
      expect(provider).toBeDefined();
      expect(fakeLogger.entry).toBe('Changing state to stopped');
    }, 300);
    it(`When provider is in "stopped" state, should do nothing when events "healthy", "unhealthy", "close", "ready" are emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      provider.client.emit('ready');
      expect(provider.state).toEqual('stopped');
      provider.client.emit('closed', new Crash('myError'));
      expect(provider.state).toEqual('stopped');
      provider.client.emit('unhealthy', new Crash('myError'), { myStatus: 'unhealthy' });
      expect(provider.state).toEqual('stopped');
      provider.client.emit('healthy', { myStatus: 'unhealthy' });
      expect(provider.state).toEqual('stopped');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(0);
    }, 300);
    it(`When provider is in "stopped" state, should change to "error" state if the event "error" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      provider.client.emit('error', new Error('myError'));
      expect(provider.state).toEqual('error');
      expect(provider.error?.message).toEqual('myError');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "stopped" state, should do nothing if it receives a request to go to PAUSE or STOP, that are executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.pause();
      expect(provider.state).toEqual('stopped');
      await provider.stop();
      expect(provider.state).toEqual('stopped');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(0);
    }, 300);
    it(`When provider is in "stopped" state, should change to "error" state if it receives a request to go to STOP, that are executed WITH problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      provider.client.shouldReject = true;
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      try {
        await provider.stop();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).name).toEqual('Forced');
        expect((error as Crash).message).toEqual('Error');
      }
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "stopped" state, should change to "error" state if it receives a request to go to FAIL`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "stopped" state, should change to "running" state if it receives a request to go to START, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "stopped" state, should change to "error" state if it receives a request to go to START, that are executed WITH problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      provider.client.shouldReject = true;
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      try {
        await provider.start();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).name).toEqual('Forced');
        expect((error as Crash).message).toEqual('Error');
      }
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "stopped" state, should change to "running" state if it receives a request to go to RESUME, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.resume();
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "running" state, should do nothing when events "healthy" or "ready" are emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      provider.client.emit('ready');
      expect(provider.state).toEqual('running');
      provider.client.emit('healthy', { myStatus: 'unhealthy' });
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "running" state, should change to "error" state if the event "error" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      provider.client.emit('error', new Error('myError'));
      expect(provider.state).toEqual('error');
      expect(provider.error?.message).toEqual('myError');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should change to "error" state if the event "closed" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      provider.client.emit('closed', new Error('myError'));
      expect(provider.state).toEqual('error');
      expect(provider.error?.message).toEqual('myError');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should change to "error" state if the event "unhealthy" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      provider.client.emit('unhealthy', new Error('myError'), { myParam: 'myValue' });
      expect(provider.state).toEqual('error');
      expect(provider.error?.message).toEqual('myError');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should do nothing if it receives a request to go to RESUME or START, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      await provider.start();
      expect(provider.state).toEqual('running');
      await provider.resume();
      expect(provider.state).toEqual('running');
      await provider.start();
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "running" state, should change to "error" state if it receives a request to go to START, that are executed WITH problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      provider.client.shouldReject = true;
      try {
        await provider.start();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).name).toEqual('Forced');
        expect((error as Crash).message).toEqual('Error');
      }
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should change to "stopped" state if it receives a request to go to STOP, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      await provider.start();
      expect(provider.state).toEqual('running');
      await provider.stop();
      expect(provider.state).toEqual('stopped');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should change to "error" state if it receives a request to go to STOP, that are executed WITH problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      provider.client.shouldReject = true;
      try {
        await provider.stop();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).name).toEqual('Forced');
        expect((error as Crash).message).toEqual('Error');
      }
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should change to "stopped" state if it receives a request to go to PAUSE, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      await provider.start();
      expect(provider.state).toEqual('running');
      await provider.pause();
      expect(provider.state).toEqual('stopped');
      expect(errorCount).toEqual(0);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "running" state, should change to "error" state if it receives a request to go to FAIL, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.start();
      expect(provider.state).toEqual('running');
      await provider.fail(new Error());
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, should manage the error if it receives a request to go to FAIL`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      await provider.fail(new Error('myOtherError'));
      expect(provider.error?.message).toEqual('myOtherError');
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(2);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "error" state, should change to "running" state if it receives a request to go to START, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      await provider.start();
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, should manager the error if it receives a request to go to START, that are executed WITH problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      provider.client.shouldReject = true;
      try {
        await provider.start();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).name).toEqual('Forced');
        expect((error as Crash).message).toEqual('Error');
      }
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(2);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "error" state, Should change to "running" state if receives a request to go to RESUME, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      await provider.resume();
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, Should change to "stopped" state if receives a request to go to STOP, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      await provider.stop();
      expect(provider.state).toEqual('stopped');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, should manage the error if it receives a request to go to STOP, that are executed WITH problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      provider.client.shouldReject = true;
      try {
        await provider.stop();
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Crash);
        expect((error as Crash).name).toEqual('Forced');
        expect((error as Crash).message).toEqual('Error');
      }
      expect(provider.state).toEqual('error');
      expect(errorCount).toEqual(2);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "error" state, should change to "stopped" state if receives a request to go to PAUSE, that is executed without problems`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      await provider.pause();
      expect(provider.state).toEqual('stopped');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, should manage the error if the events "error" or "unhealthy" are emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      provider.client.emit('error', new Error('otherError'));
      expect(provider.state).toEqual('error');
      expect(provider.error?.message).toEqual('otherError');
      provider.client.emit('unhealthy', new Error('finalError'), { myParam: 'myValue' });
      expect(provider.state).toEqual('error');
      expect(provider.error?.message).toEqual('finalError');
      expect(errorCount).toEqual(3);
      expect(stateCount).toEqual(1);
    }, 300);
    it(`When provider is in "error" state, should change to "stopped" state if the event "closed" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      provider.client.emit('closed', new Error('otherError'));
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(provider.state).toEqual('stopped');
      expect(provider.error?.message).toEqual('myError');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, should change to "start" state if the event "ready" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      provider.client.emit('ready');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it(`When provider is in "error" state, should change to "start" state if the event "healthy" is emitted by the underlying port`, async () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      let errorCount = 0;
      let stateCount = 0;
      provider
        .on('error', () => {
          errorCount++;
        })
        .on('status', () => {
          stateCount++;
        });
      expect(provider.state).toEqual('stopped');
      await provider.fail(new Error('myError'));
      expect(provider.error?.message).toEqual('myError');
      expect(provider.state).toEqual('error');
      provider.client.emit('healthy', { myStatus: 'healthy' });
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(provider.state).toEqual('running');
      expect(errorCount).toEqual(1);
      expect(stateCount).toEqual(2);
    }, 300);
    it('Getters should work properly over a default configured instance', () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        { myParam: 'myValue' }
      );
      const checks = provider.checks;
      expect(checks).toEqual({
        'myProvider:status': [
          {
            componentId: provider.componentId,
            componentType: 'myType',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: provider.actualStateDate,
          },
        ],
        'myProvider:myMeasure': [
          { componentId: 'myComponentId', status: 'pass' },
          { componentId: 'myOtherComponentId', status: 'pass' },
        ],
      });
      expect(provider.actualStateDate).toEqual(checks['myProvider:status'][0].time);
      expect(provider.state).toEqual('stopped');
      expect(provider.name).toEqual('myProvider');
      expect(provider.error).toEqual(undefined);
      expect(provider.client).toBeInstanceOf(MyPortInstance);
    }, 300);
    it(`Should be possible to use all the logger functions`, () => {
      const logger = new DebugLogger('myLogger');
      const uuid = v4();
      const context = 'myContext';
      const meta = {
        prop1: 'a',
        prop2: 'b',
        prop3: null,
      };
      const error = new Crash(`myLogger`, uuid);
      jest.spyOn(logger, 'silly');
      jest.spyOn(logger, 'debug');
      jest.spyOn(logger, 'verbose');
      jest.spyOn(logger, 'info');
      jest.spyOn(logger, 'warn');
      jest.spyOn(logger, 'error');
      jest.spyOn(logger, 'crash');
      logger.silly('myLogger', uuid, context, meta);
      logger.debug('myLogger', uuid, context, meta);
      logger.verbose('myLogger', uuid, context, meta);
      logger.info('myLogger', uuid, context, meta);
      logger.warn('myLogger', uuid, context, meta);
      logger.error('myLogger', uuid, context, meta);
      logger.crash(error);
      logger.crash(BoomHelpers.badRequest('myError', uuid));

      expect(logger.silly).toHaveBeenCalledWith('myLogger', uuid, context, meta);
      expect(logger.debug).toHaveBeenCalledWith('myLogger', uuid, context, meta);
      expect(logger.verbose).toHaveBeenCalledWith('myLogger', uuid, context, meta);
      expect(logger.info).toHaveBeenCalledWith('myLogger', uuid, context, meta);
      expect(logger.warn).toHaveBeenCalledWith('myLogger', uuid, context, meta);
      expect(logger.error).toHaveBeenCalledWith('myLogger', uuid, context, meta);
      expect(logger.crash).toHaveBeenCalledWith(error);
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should throw an error if fail when try to create an instance of the port', () => {
      const test = () => {
        new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
          MyWrapperPort,
          {
            name: 'myProvider',
            type: 'myType',
            validation: {
              defaultConfig: { myParam: 'myValue' },
              envBasedConfig: { myParam: 'myValue' },
              schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
            },
          },
          { myParam: 'myValue', fail: true }
        );
      };
      expect(test).toThrowError('myError');
    }, 300);
    it('Should create an instance with default values if configuration is incorrect an show the error in the property "error"', () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          useEnvironment: true,
          validation: {
            defaultConfig: { myParam: 'myValue' },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        //@ts-ignore - Test environment
        { myParam: 3, fail: false }
      );
      expect(provider).toBeDefined();
      expect(provider.error).toBeDefined();
      expect(provider.error).toBeInstanceOf(Multi);
      expect((provider.error as Multi).size).toEqual(1);
      expect(provider.error?.message).toEqual('Error in the provider configuration process');
      //@ts-ignore - Test environment
      expect(provider.config).toEqual({ myParam: 'myValue' });
    }, 300);
    it('Should create an instance with default values if configuration is incorrect an show the error in the property "error" even when the default config is wrong too', () => {
      const provider = new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
        MyWrapperPort,
        {
          name: 'myProvider',
          type: 'myType',
          useEnvironment: true,
          validation: {
            //@ts-ignore - Test environment
            defaultConfig: { myParam: 2 },
            envBasedConfig: { myParam: 'myValue' },
            schema: Joi.object({ myParam: Joi.string().required(), fail: Joi.boolean() }),
          },
        },
        //@ts-ignore - Test environment
        { myParam: 3, fail: false }
      );
      expect(provider).toBeDefined();
      expect(provider.error).toBeDefined();
      expect(provider.error).toBeInstanceOf(Multi);
      expect(provider.error?.message).toEqual('Error in the provider configuration process');
      expect((provider.error as Multi).size).toEqual(2);
      //@ts-ignore - Test environment
      expect(provider.config).toEqual({ myParam: 2 });
      expect(provider.checks).toEqual({
        'myProvider:status': [
          {
            componentId: provider.componentId,
            componentType: 'myType',
            observedValue: 'error',
            output: [
              'ValidationError: "myParam" must be a string',
              'ValidationError: "myParam" must be a string',
            ],
            status: 'fail',
            time: provider.actualStateDate,
          },
        ],
        'myProvider:myMeasure': [
          { componentId: 'myComponentId', status: 'pass' },
          { componentId: 'myOtherComponentId', status: 'pass' },
        ],
      });
    }, 300);
    it('Should be able to manage malformed errors, for example, as strings', () => {
      const test = () => {
        new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
          MyWrapperPort,
          {
            name: 'myProvider',
            type: 'myType',
            validation: {
              defaultConfig: { myParam: 'myValue' },
              envBasedConfig: { myParam: 'myValue' },
              schema: Joi.object({
                myParam: Joi.string().required(),
                fail: Joi.boolean(),
                asString: Joi.boolean(),
              }),
            },
          },
          { myParam: 'myValue', fail: true, asString: true }
        );
      };
      expect(test).toThrowError('myError');
    }, 300);
    it('Should be able to manage malformed errors, for example, empty error', () => {
      const test = () => {
        new Manager<MyPortInstance, MyPortConfig, MyWrapperPort>(
          MyWrapperPort,
          {
            name: 'myProvider',
            type: 'myType',
            validation: {
              defaultConfig: { myParam: 'myValue' },
              envBasedConfig: { myParam: 'myValue' },
              schema: Joi.object({
                myParam: Joi.string().required(),
                fail: Joi.boolean(),
                empty: Joi.boolean(),
              }),
            },
          },
          { myParam: 'myValue', fail: true, empty: true }
        );
      };
      expect(test).toThrowError(
        'Unknown error in port myProvider, triggered during configuration process'
      );
    }, 300);
  });
});
// #endregion
