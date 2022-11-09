/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { undoMocks } from '@mdf.js/utils';
import { EventEmitter } from 'events';
import { Config } from '../types';
import { Factory } from './Factory';
import { Port } from './Port';

const DEFAULT_CONFIG: Config = {
  container_id: 'mdf-amqp',
  host: '127.0.0.1',
  initial_reconnect_delay: 30000,
  max_reconnect_delay: 10000,
  monitor: {
    brokerName: '*',
    interval: 10000,
    routingType: '*',
    timeout: 1000,
    url: 'http://127.0.0.1:8161/console/jolokia',
  },
  non_fatal_errors: ['amqp:connection:forced'],
  port: 5672,
  receiver_options: {
    autoaccept: false,
    autosettle: true,
    credit_window: 0,
    rcv_settle_mode: 0,
    source: {
      address: 'amqp::receiver',
    },
  },
  reconnect: 5000,
  rejectUnauthorized: false,
  requestCert: false,
  transport: 'tcp',
  username: 'consumer',
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
class FakeSession extends EventEmitter {
  open = true;
  credit = 10;
  sender?: FakeSender;
  shouldFailCreate = false;
  async createAwaitableSender(): Promise<FakeSender> {
    if (!this.shouldFailCreate) {
      this.sender = new FakeSender(this.credit);
      return this.sender;
    } else {
      throw new Error('Error creating sender');
    }
  }
  async close(): Promise<void> {
    this.open = false;
  }
  isOpen(): boolean {
    return true;
  }
}
class FakeSender extends EventEmitter {
  open = true;
  credit: number;
  shouldFailClose = false;
  public constructor(credit: number) {
    super();
    this.credit = credit;
  }
  isOpen(): boolean {
    return this.open;
  }
  async close(): Promise<void> {
    if (this.shouldFailClose) {
      throw new Error('Failed to close sender');
    }
    this.open = false;
  }
}
describe('#Port #AMQP #Sender', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
      jest.clearAllMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'amqp:status': [
          {
            componentId: checks['amqp:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['amqp:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'amqp',
        logger: new FakeLogger() as LoggerInstance,
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'amqp:status': [
          {
            componentId: checks['amqp:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['amqp:status'][0].time,
          },
        ],
      });
    }, 300);
    it(`Should create a valid instance`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it(`Should start and stop the port properly, with credits`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      return port
        .start()
        .then(() => port.start())
        .then(() => {
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          expect(port.state).toBeTruthy();
          const checks = port.checks;
          expect(checks).toEqual({
            credits: [
              {
                componentId: checks['credits'][0].componentId,
                observedUnit: 'credits',
                observedValue: 10,
                output: undefined,
                status: 'pass',
                time: checks['credits'][0].time,
              },
            ],
          });
        })
        .then(() => port.close())
        .then(() => port.close());
    }, 300);
    it(`Should start and stop the port properly, without credits`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      mySession.credit = 0;
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      return port
        .start()
        .then(() => {
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          const checks = port.checks;
          expect(checks).toEqual({
            credits: [
              {
                componentId: checks['credits'][0].componentId,
                observedUnit: 'credits',
                observedValue: 0,
                output: 'No credits available',
                status: 'warn',
                time: checks['credits'][0].time,
              },
            ],
          });
        })
        .then(() => port.close());
    }, 300);
    it(`Should start and stop the port properly, attaching/detaching the listeners to the instance`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      let events = 0;
      port.on('error', error => {
        expect(error.message).toEqual('myError');
        events++;
      });
      port.on('closed', error => {
        expect(error?.message).toEqual('myError');
        events++;
      });
      port.on('healthy', () => {
        events++;
      });
      port.on('unhealthy', error => {
        expect(error?.message).toEqual('myError');
        events++;
      });
      return port
        .start()
        .then(() => {
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          const checks = port.checks;
          expect(checks).toEqual({
            credits: [
              {
                componentId: checks['credits'][0].componentId,
                observedUnit: 'credits',
                observedValue: 10,
                output: undefined,
                status: 'pass',
                time: checks['credits'][0].time,
              },
            ],
          });
          //@ts-ignore - Test environment
          port.instance.emit('error', new Error('myError'));
          //@ts-ignore - Test environment
          port.instance.emit('closed', new Error('myError'));
          //@ts-ignore - Test environment
          port.instance.emit('healthy');
          //@ts-ignore - Test environment
          port.instance.emit('unhealthy', new Error('myError'));
          expect(events).toEqual(4);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('closed').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('healthy').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('unhealthy').length).toEqual(1);
        })
        .then(() => port.close())
        .then(() => {
          //@ts-ignore - Test environment
          expect(port.instance.listeners('error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('closed').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('healthy').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.listeners('unhealthy').length).toEqual(0);
        });
    }, 300);
    it(`Should start and stop the port properly, attaching/detaching the listeners to the underlayer sender`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      let events = 0;
      let numOfError = 0;
      port.on('error', error => {
        expect(error.message).toEqual('myError');
        events++;
      });
      port.on('closed', error => {
        expect(error).toBeUndefined();
        events++;
      });
      port.on('healthy', () => {
        events++;
      });
      port.on('unhealthy', error => {
        if (numOfError === 0) {
          expect(error?.message).toEqual('Sender error: myError - myDescription');
          expect(error.info).toBeDefined();
          numOfError++;
        } else {
          expect(error?.message).toEqual('Sender error: Unknown error');
          expect(error.info).toBeDefined();
        }
        events++;
      });
      return port
        .start()
        .then(() => {
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sendable').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_open').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_draining').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_flow').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_close').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('accepted').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('released').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('rejected').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('modified').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('settled').length).toEqual(1);
          //@ts-ignore - Test environment
          port.instance.sender.emit('sendable', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('sender_open', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('sender_draining', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('sender_flow', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('sender_error', {
            error: { condition: 'myError', description: 'myDescription' },
          });
          //@ts-ignore - Test environment
          port.instance.sender.emit('sender_error', {
            sender: {},
          });
          //@ts-ignore - Test environment
          port.instance.sender.emit('sender_close', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('accepted', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('released', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('rejected', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('modified', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.sender.emit('settled', { message: { to: 'myAddress' } });
          expect(events).toEqual(4);
        })
        .then(() => port.close())
        .then(() => {
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sendable').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_open').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_draining').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_flow').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('sender_close').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('accepted').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('released').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('rejected').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('modified').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.sender.listeners('settled').length).toEqual(0);
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should throw an error if try to access to the Receiver but is not initialized', () => {
      const provider = Factory.create();
      expect(() => provider.client).toThrowError('Sender is not initialized');
    });
    it(`Should reject to start if session.createReceiver rejects`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      mySession.shouldFailCreate = true;
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      return port.start().catch(error => {
        expect(error.message).toEqual('Error creating the AMQP Sender: Error creating sender');
        expect(error.cause.message).toEqual('Error creating sender');
      });
    }, 300);
    it(`Should reject to stop if receiver.close rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      await port.start();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
      //@ts-ignore - Test environment
      mySession.sender?.shouldFailClose = true;
      try {
        await port.close();
        throw new Error('Should not be here');
      } catch (error: any) {
        expect(error.message).toEqual('Error closing the AMQP Sender: Failed to close sender');
        expect(error.cause.message).toEqual('Failed to close sender');
      }
    }, 300);
  });
});
