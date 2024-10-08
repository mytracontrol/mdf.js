/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Client } from '@elastic/elasticsearch';
import { Layer } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { LoggerInstance } from '@mdf.js/logger';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  maxRetries: 5,
  name: 'mms-elastic',
  nodes: 'http://localhost:9200',
  pingTimeout: 3000,
  requestTimeout: 30000,
  resurrectStrategy: 'ping',
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
describe('#Port #Elastic', () => {
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
        'elastic:status': [
          {
            componentId: checks['elastic:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['elastic:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'elastic',
        logger: new FakeLogger() as LoggerInstance,
        config: { pingTimeout: undefined },
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Layer.Provider.Manager);
      expect(provider.client).toBeInstanceOf(Client);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'elastic:status': [
          {
            componentId: checks['elastic:status'][0].componentId,
            componentType: 'database',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['elastic:status'][0].time,
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
    it(`Should emit a healthy event if health receive the expected response`, done => {
      const port = new Port(
        {
          node: 'http://192.168.1.5:9200',
          pingTimeout: 100,
          requestTimeout: 100,
        },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.client.cat, 'health').mockResolvedValue({ body: [] });
      port.on('closed', () => {
        done();
      });
      port.on('healthy', () => {
        port.close().then();
        const checks = port.checks;
        expect(checks).toEqual({
          nodes: [
            {
              componentId: checks['nodes'][0].componentId,
              observedUnit: 'Nodes Health',
              observedValue: [],
              output: undefined,
              status: 'pass',
              time: checks['nodes'][0].time,
            },
          ],
        });
      });
      port.start().then();
    }, 300);
    it(`Should emit change between healthy and unhealthy properly`, done => {
      const port = new Port(
        {
          node: 'http://192.168.1.5:9200',
          pingTimeout: 20,
          requestTimeout: 20,
        },
        new FakeLogger() as LoggerInstance
      );
      let wasUnhealthy = false;
      let wasHealthy = false;
      expect(port).toBeDefined();
      jest
        .spyOn(port.client.cat, 'health')
        //@ts-ignore - Test environment
        .mockResolvedValueOnce({ body: [] })
        //@ts-ignore - Test environment
        .mockResolvedValueOnce({ body: [{ status: 'red' }] })
        //@ts-ignore - Test environment
        .mockResolvedValueOnce({ body: [] });
      port.on('healthy', () => {
        wasHealthy = true;
        if (wasHealthy && wasUnhealthy) {
          port.close().then();
          done();
        }
      });
      port.on('unhealthy', () => {
        wasUnhealthy = true;
      });
      port.start().then();
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should emit an unhealthy event if health NOT receive the expected response`, done => {
      const port = new Port(
        {
          node: 'http://192.168.1.5:9200',
          pingTimeout: 100,
          requestTimeout: 100,
        },
        new FakeLogger() as LoggerInstance
      );
      const mySpy = jest.spyOn(port.client.cat, 'health');
      //@ts-ignore - Test environment
      mySpy.mockResolvedValue({ body: [{ status: 'red' }] });
      port.on('unhealthy', error => {
        expect(error).toBeInstanceOf(Crash);
        expect(error.message).toEqual('At least one of the nodes in the system is red state');
        const checks = port.checks;
        expect(checks).toEqual({
          nodes: [
            {
              componentId: checks['nodes'][0].componentId,
              observedUnit: 'Nodes Health',
              observedValue: [{ status: 'red' }],
              output: 'At least one of the nodes in the system is red state',
              status: 'fail',
              time: checks['nodes'][0].time,
            },
          ],
        });
        //@ts-ignore - Test environment
        expect(port.timeInterval).toBeDefined();
        port.close().then();
        //@ts-ignore - Test environment
        expect(port.timeInterval).toBeUndefined();
        expect(mySpy).toHaveBeenCalledTimes(1);
        expect(mySpy.mock.calls[0][0]).toEqual({ format: 'json' });
        expect(mySpy.mock.calls[0][1]).toEqual({ requestTimeout: 90 });
        done();
      });
      port.start().then();
    });
    it(`Should emit an error event if there is a problem checking the health status of the system,`, done => {
      const port = new Port(
        {
          node: 'http://192.168.1.5:9200',
          pingTimeout: 100,
          requestTimeout: 100,
        },
        new FakeLogger() as LoggerInstance
      );
      //@ts-ignore - Test environment
      jest.spyOn(port.client.cat, 'health').mockRejectedValue(new Error('myError'));
      port.on('error', (error: any) => {
        expect(error.message).toEqual('Error performing status check of elastic instance');
        expect(error.cause.message).toEqual('myError');
        port.close().then();
        done();
      });
      port.start().then();
    });
  });
});
