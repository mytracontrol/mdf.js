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
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  container_id: 'mdf-amqp',
  host: '127.0.0.1',
  initial_reconnect_delay: 30000,
  max_reconnect_delay: 10000,
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
  receiver?: FakeReceiver;
  shouldFailCreate = false;
  shouldFailClose = false;
  async createReceiver(): Promise<FakeReceiver> {
    if (this.shouldFailCreate) {
      throw new Error('Failed to create receiver');
    }
    this.receiver = new FakeReceiver(this.credit);
    return this.receiver;
  }
  async close(): Promise<void> {
    if (this.shouldFailClose) {
      throw new Error('Failed to close session');
    }
    this.open = false;
  }
  isOpen(): boolean {
    return this.open;
  }
}
class FakeReceiver extends EventEmitter {
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
      throw new Error('Failed to close receiver');
    }
    this.open = false;
  }
}
describe('#Port #AMQP #Receiver', () => {
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
        config: {},
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
      const port = new Port(
        {
          ...DEFAULT_CONFIG,
          receiver_options: {
            autoaccept: false,
            autosettle: true,
            credit_window: 0,
            rcv_settle_mode: 0,
            source: 'amqp::receiver',
          },
        },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
    }, 300);
    it(`Should start and stop the port properly and fullfil the checks`, () => {
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
    it(`Should start and stop the port properly, attaching/detaching the listeners to the underlayer receiver`, () => {
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
          expect(error?.message).toEqual('Receiver error: myError - myDescription');
          expect(error.info).toBeDefined();
          numOfError++;
        } else {
          expect(error?.message).toEqual('Receiver error: Unknown error');
          expect(error.info).toBeDefined();
        }
        events++;
      });
      return port
        .start()
        .then(() => {
          expect(port.state).toBeTruthy();
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('message').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_open').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_drained').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_flow').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_close').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('settled').length).toEqual(1);
          //@ts-ignore - Test environment
          port.instance.receiver.emit('message', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('receiver_open', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('receiver_drained', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('receiver_flow', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('receiver_error', {
            receiver: {
              error: { condition: 'myError', description: 'myDescription' },
            },
          });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('receiver_error', {
            receiver: {},
          });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('receiver_close', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.receiver.emit('settled', { message: { to: 'myAddress' } });
          expect(events).toEqual(4);
        })
        .then(() => port.close())
        .then(() => {
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('message').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_open').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_drained').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_flow').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('receiver_close').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.receiver.listeners('settle').length).toEqual(0);
        });
    }, 300);
    it(`Should start and stop the port properly, attaching/detaching the listeners to the underlayer session`, () => {
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
        if (numOfError === 0) {
          expect(error?.message).toEqual('Session error: myError - myDescription');
          expect(error.info).toBeDefined();
          numOfError++;
        } else {
          expect(error?.message).toEqual('Session error: Unknown error');
          expect(error.info).toBeDefined();
        }
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
        events++;
      });
      return port
        .start()
        .then(() => {
          expect(port.state).toBeTruthy();
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('session_open').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('session_error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('session_close').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('settled').length).toEqual(1);
          //@ts-ignore - Test environment
          port.instance.session.emit('session_open', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.session.emit('session_error', {
            session: {
              error: { condition: 'myError', description: 'myDescription' },
            },
          });
          //@ts-ignore - Test environment
          port.instance.session.emit('session_error', {
            session: {},
          });
          //@ts-ignore - Test environment
          port.instance.session.emit('session_close', { message: { to: 'myAddress' } });
          //@ts-ignore - Test environment
          port.instance.session.emit('settled', { message: { to: 'myAddress' } });
          expect(events).toEqual(2);
        })
        .then(() => port.close())
        .then(() => {
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('session_open').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('session_error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('session_close').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.session.listeners('settled').length).toEqual(0);
        });
    }, 300);
    it(`Should start and stop the port properly, attaching/detaching the listeners to the underlayer container`, () => {
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
        if (numOfError === 0) {
          expect(error?.message).toEqual('Connection error: myError');
          expect(error.info).toBeDefined();
          numOfError++;
        } else if (numOfError === 1) {
          expect(error?.message).toEqual('Protocol error: myError');
          expect(error.info).toBeDefined();
          numOfError++;
        } else {
          expect(error?.message).toEqual('Container error: myError');
          expect(error.info).toBeDefined();
        }
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
        expect(error?.message).toEqual('Disconnection error: myError');
        events++;
      });
      return port
        .start()
        .then(() => {
          expect(port.state).toBeTruthy();
          //@ts-ignore - Test environment
          jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('connection_open').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('connection_error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('connection_close').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('protocol_error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('error').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('disconnected').length).toEqual(1);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('settled').length).toEqual(1);
          //@ts-ignore - Test environment
          port.instance.connection.emit('connection_open', {
            connection: { options: { host: 'myHost', port: 'myPort' } },
          });
          //@ts-ignore - Test environment
          port.instance.connection.emit('connection_error', { error: new Error('myError') });
          //@ts-ignore - Test environment
          port.instance.connection.emit('connection_close', {
            connection: { options: { host: 'myHost', port: 'myPort' } },
          });
          //@ts-ignore - Test environment
          port.instance.connection.emit('protocol_error', { error: new Error('myError') });
          //@ts-ignore - Test environment
          port.instance.connection.emit('error', { error: new Error('myError') });
          //@ts-ignore - Test environment
          port.instance.connection.emit('disconnected', {
            error: new Error('myError'),
            reconnecting: true,
          });
          //@ts-ignore - Test environment
          port.instance.connection.emit('settled', { message: { to: 'myAddress' } });
          expect(events).toEqual(4);
        })
        .then(() => port.close())
        .then(() => {
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('connection_open').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('connection_error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('connection_close').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('protocol_error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('error').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('disconnected').length).toEqual(0);
          //@ts-ignore - Test environment
          expect(port.instance.connection.listeners('settled').length).toEqual(0);
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should throw an error if try to access to the Receiver but is not initialized', () => {
      const provider = Factory.create();
      expect(() => provider.client).toThrowError('Receiver is not initialized');
    }, 300);
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
        expect(error.message).toEqual(
          'Error creating the AMQP Receiver: Failed to create receiver'
        );
        expect(error.cause.message).toEqual('Failed to create receiver');
      });
    }, 300);
    it(`Should reject to start if container.createSessionRejects rejects`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.connection, 'createSession')
        .mockRejectedValue(new Error('Failed to create session'));
      return port.start().catch(error => {
        expect(error.message).toEqual(
          'Error creating the AMQP Receiver: Error creating the AMQP Session: Failed to create session'
        );
        expect(error.cause.message).toEqual(
          'Error creating the AMQP Session: Failed to create session'
        );
        expect(error.cause.cause.message).toEqual('Failed to create session');
      });
    }, 300);
    it(`Should reject to start if connection.open rejects`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.connection, 'open')
        .mockRejectedValue(new Error('Failed to open connection'));
      return port.start().catch(error => {
        expect(error.message).toEqual(
          'Error creating the AMQP Receiver: Error creating the AMQP Session: Error opening the AMQP connection: Failed to open connection'
        );
        expect(error.cause.message).toEqual(
          'Error creating the AMQP Session: Error opening the AMQP connection: Failed to open connection'
        );
        expect(error.cause.cause.message).toEqual(
          'Error opening the AMQP connection: Failed to open connection'
        );
        expect(error.cause.cause.cause.message).toEqual('Failed to open connection');
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
      mySession.receiver?.shouldFailClose = true;
      try {
        await port.close();
        throw new Error('Should have failed');
      } catch (error: any) {
        expect(error.message).toEqual('Error closing the AMQP Receiver: Failed to close receiver');
        expect(error.cause.message).toEqual('Failed to close receiver');
      }
    }, 300);
    it(`Should reject to stop if session.close rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'close').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      port.on('error', error => {
        expect(error.message).toEqual('myError');
      });
      await port.start();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
      mySession.shouldFailClose = true;
      try {
        await port.close();
        throw new Error('Should have failed');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error closing the AMQP Receiver: Error closing the AMQP Session: Failed to close session'
        );
        expect(error.cause.message).toEqual(
          'Error closing the AMQP Session: Failed to close session'
        );
        expect(error.cause.cause.message).toEqual('Failed to close session');
      }
    }, 300);
    it(`Should reject to stop if connection.close rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      const mySession = new FakeSession();
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'open').mockResolvedValue();
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.connection, 'close')
        .mockRejectedValue(new Error('Failed to close connection'));
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'createSession').mockResolvedValue(mySession);
      await port.start();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.connection, 'isOpen').mockReturnValue(true);
      try {
        await port.close();
        throw new Error('Should not reach here');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error closing the AMQP Receiver: Error closing the AMQP Session: Error closing the AMQP connection: Failed to close connection'
        );
        expect(error.cause.message).toEqual(
          'Error closing the AMQP Session: Error closing the AMQP connection: Failed to close connection'
        );
        expect(error.cause.cause.message).toEqual(
          'Error closing the AMQP connection: Failed to close connection'
        );
        expect(error.cause.cause.cause.message).toEqual('Failed to close connection');
      }
    }, 300);
  });
});
