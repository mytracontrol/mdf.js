/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Layer } from '@mdf.js/core';
import { overallStatus } from '@mdf.js/core/dist/Health';
import { CommandJobHandler, Control } from '@mdf.js/openc2';
import cluster from 'cluster';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { ServiceRegistry } from './ServiceRegistry';

class ResourceMock extends EventEmitter implements Layer.App.Resource {
  componentId = 'myComponentId';
  rejectStart = false;
  rejectStop = false;
  rejectClose = false;
  constructor(public name: string) {
    super();
  }
  start(): Promise<void> {
    if (this.rejectStart) {
      return Promise.reject(new Error('start error'));
    }
    return Promise.resolve();
  }
  stop(): Promise<void> {
    if (this.rejectStop) {
      return Promise.reject(new Error('stop error'));
    }
    return Promise.resolve();
  }
  close(): Promise<void> {
    if (this.rejectClose) {
      return Promise.reject(new Error('close error'));
    }
    return Promise.resolve();
  }
  get status(): Health.Status {
    return overallStatus(this.checks);
  }
  get checks(): Health.Checks {
    const check: Health.Check = {
      status: 'pass',
      componentId: 'myComponentId',
    };
    return {
      [`${this.name}:status`]: [check],
    };
  }
}
class ResourceMockWithOutMethod extends EventEmitter {
  componentId = 'myComponentId';
  rejectStart = false;
  rejectStop = false;
  rejectClose = false;
  constructor(public name: string) {
    super();
  }
  get checks(): Health.Checks {
    const check: Health.Check = {
      status: 'pass',
      componentId: 'myComponentId',
    };
    return {
      [`${this.name}:status`]: [check],
    };
  }
}
describe('#ServiceRegistry class', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });
    it('Should create a valid instance with default values', async () => {
      const wrapper = new ServiceRegistry<{ test: string }>();
      expect(wrapper).toBeInstanceOf(ServiceRegistry);
      wrapper.register(new ResourceMock('oneResource'));
      wrapper.register([new ResourceMock('twoResource'), new ResourceMock('threeResource')]);
      //@ts-ignore private property
      const health = wrapper._observability.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'mdf-app',
        description: undefined,
        release: '0.0.0',
        version: '0',
        serviceId: 'mdf-service',
        serviceGroupId: 'mdf-service-group',
        //@ts-ignore private property
        instanceId: wrapper._settingsManager.instanceId,
        notes: [],
        output: undefined,
        status: 'warn',
        checks: {
          'mdf-app:uptime': [
            {
              componentId: checks['mdf-app:uptime'][0].componentId,
              componentType: 'system',
              observedValue: checks['mdf-app:uptime'][0].observedValue,
              observedUnit: 'time',
              status: 'pass',
              time: checks['mdf-app:uptime'][0].time,
              processId: checks['mdf-app:uptime'][0]['processId'],
            },
          ],
          'mdf-app:settings': [
            {
              componentId: checks['mdf-app:settings'][0].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'ServiceRegistry',
              status: 'warn',
              time: checks['mdf-app:settings'][0].time,
            },
            {
              componentId: checks['mdf-app:settings'][1].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'CustomSettings',
              status: 'warn',
              time: checks['mdf-app:settings'][1].time,
            },
          ],
          'oneResource:status': [
            {
              status: 'pass',
              componentId: 'myComponentId',
            },
          ],
          'twoResource:status': [
            {
              status: 'pass',
              componentId: 'myComponentId',
            },
          ],
          'threeResource:status': [
            {
              status: 'pass',
              componentId: 'myComponentId',
            },
          ],
        },
      });
      expect(wrapper.logger).toBeDefined();
    }, 300);
    it('Should call `process.exit` if SIGINT or SIGTERM', done => {
      const wrapper = new ServiceRegistry<{ test: string }>();
      jest.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });
      //@ts-ignore private property
      jest.spyOn(wrapper, 'shutdown').mockResolvedValue();
      process.emit('SIGINT');
      process.emit('SIGTERM');
      setTimeout(() => {
        //@ts-ignore private property
        expect(wrapper.shutdown).toHaveBeenCalledTimes(2);
        done();
      }, 1001);
    }, 2000);
    it('Should create a valid instance with default values and consumer', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        { consumerOptions: {}, adapterOptions: { type: 'redis' } }
      );
      expect(wrapper).toBeInstanceOf(ServiceRegistry);
      wrapper.register(new ResourceMock('oneResource'));
      wrapper.register([new ResourceMock('twoResource'), new ResourceMock('threeResource')]);
      //@ts-ignore private property
      const health = wrapper._observability.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'mdf-app',
        description: undefined,
        release: '0.0.0',
        version: '0',
        serviceId: 'mdf-service',
        serviceGroupId: 'mdf-service-group',
        //@ts-ignore private property
        instanceId: wrapper._settingsManager.instanceId,
        notes: [],
        output: undefined,
        status: 'warn',
        checks: {
          'mdf-app:commands': [
            {
              status: 'pass',
              componentId: checks['mdf-app:commands'][0].componentId,
              componentType: 'source',
              observedValue: 0,
              observedUnit: 'pending commands',
              time: checks['mdf-app:commands'][0].time,
              output: undefined,
            },
          ],
          'mdf-app-publisher:status': [
            {
              status: 'warn',
              componentId: checks['mdf-app-publisher:status'][0].componentId,
              componentType: 'database',
              observedValue: 'stopped',
              time: checks['mdf-app-publisher:status'][0].time,
              output: undefined,
            },
          ],
          'mdf-app-subscriber:status': [
            {
              status: 'warn',
              componentId: checks['mdf-app-subscriber:status'][0].componentId,
              componentType: 'database',
              observedValue: 'stopped',
              time: checks['mdf-app-subscriber:status'][0].time,
              output: undefined,
            },
          ],
          'mdf-app:lastOperation': [
            {
              status: 'pass',
              componentId: checks['mdf-app:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedValue: 'ok',
              observedUnit: 'result of last operation',
              time: undefined,
              output: undefined,
            },
          ],
          'mdf-app:uptime': [
            {
              componentId: checks['mdf-app:uptime'][0].componentId,
              componentType: 'system',
              observedValue: checks['mdf-app:uptime'][0].observedValue,
              observedUnit: 'time',
              status: 'pass',
              time: checks['mdf-app:uptime'][0].time,
              processId: checks['mdf-app:uptime'][0]['processId'],
            },
          ],
          'mdf-app:settings': [
            {
              componentId: checks['mdf-app:settings'][0].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'ServiceRegistry',
              status: 'warn',
              time: checks['mdf-app:settings'][0].time,
            },
            {
              componentId: checks['mdf-app:settings'][1].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'CustomSettings',
              status: 'warn',
              time: checks['mdf-app:settings'][1].time,
            },
          ],
          'oneResource:status': [
            {
              status: 'pass',
              componentId: 'myComponentId',
            },
          ],
          'twoResource:status': [
            {
              status: 'pass',
              componentId: 'myComponentId',
            },
          ],
          'threeResource:status': [
            {
              status: 'pass',
              componentId: 'myComponentId',
            },
          ],
        },
      });
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer.instance, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer.instance, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockResolvedValue();
      await wrapper.start();
      await wrapper.stop();
    }, 300);
    it('Should create a valid instance with non-default values with redis adapter', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
            description: 'myDescription',
            release: '2.0.1',
            namespace: 'x-myNamespace',
            version: '2',
            links: {
              self: 'http://localhost:3000',
              about: 'http://localhost:3000/about',
              related: 'http://localhost:3000/related',
            },
            tags: ['test', 'test2'],
            serviceGroupId: 'myGroupId',
            serviceId: 'myServiceId',
          },
          adapterOptions: {
            type: 'redis',
            config: {
              connectionName: 'myConnectionTest',
            },
          },
          consumerOptions: {
            id: 'myConsumerId',
            resolver: {
              'query:x-myNamespace:other': (): Promise<number> => Promise.resolve(3),
            },
            actionTargetPairs: {
              query: ['x-myNamespace:other'],
            },
          },
          loggerOptions: {
            console: {
              level: 'debug',
              enabled: true,
            },
          },
          observabilityOptions: {
            host: '0.0.0.0',
          },
          retryOptions: {
            attempts: 2,
          },
        }
      );
      expect(wrapper).toBeInstanceOf(ServiceRegistry);
      //@ts-ignore private property
      const health = wrapper._observability.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'test',
        description: 'myDescription',
        release: '2.0.1',
        version: '2',
        //@ts-ignore private property
        instanceId: wrapper._settingsManager.instanceId,
        notes: [],
        output: undefined,
        serviceGroupId: 'myGroupId',
        serviceId: 'myServiceId',
        status: 'warn',
        tags: ['test', 'test2'],
        checks: {
          'myConsumerId:commands': [
            {
              status: 'pass',
              componentId: checks['myConsumerId:commands'][0].componentId,
              componentType: 'source',
              observedValue: 0,
              observedUnit: 'pending commands',
              time: checks['myConsumerId:commands'][0].time,
              output: undefined,
            },
          ],
          'myConsumerId-publisher:status': [
            {
              status: 'warn',
              componentId: checks['myConsumerId-publisher:status'][0].componentId,
              componentType: 'database',
              observedValue: 'stopped',
              time: checks['myConsumerId-publisher:status'][0].time,
              output: undefined,
            },
          ],
          'myConsumerId-subscriber:status': [
            {
              status: 'warn',
              componentId: checks['myConsumerId-subscriber:status'][0].componentId,
              componentType: 'database',
              observedValue: 'stopped',
              time: checks['myConsumerId-subscriber:status'][0].time,
              output: undefined,
            },
          ],
          'myConsumerId:lastOperation': [
            {
              status: 'pass',
              componentId: checks['myConsumerId:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedValue: 'ok',
              observedUnit: 'result of last operation',
              time: undefined,
              output: undefined,
            },
          ],
          'test:uptime': [
            {
              componentId: checks['test:uptime'][0].componentId,
              componentType: 'system',
              observedValue: checks['test:uptime'][0].observedValue,
              observedUnit: 'time',
              processId: process.pid,
              status: 'pass',
              time: checks['test:uptime'][0].time,
            },
          ],
          'test:settings': [
            {
              componentId: checks['test:settings'][0].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'ServiceRegistry',
              status: 'warn',
              time: checks['test:settings'][0].time,
            },
            {
              componentId: checks['test:settings'][1].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'CustomSettings',
              status: 'warn',
              time: checks['test:settings'][1].time,
            },
          ],
        },
        links: {
          about: 'http://localhost:3000/about',
          related: 'http://localhost:3000/related',
          self: 'http://localhost:3000',
        },
      });
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'query:x-myNamespace:errors'
      );
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'query:x-myNamespace:health'
      );
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'query:x-myNamespace:other'
      );
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'query:x-myNamespace:stats'
      );
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'start:x-myNamespace:resources'
      );
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'stop:x-myNamespace:resources'
      );
    }, 300);
    it('Should create a valid instance with non-default values with socket-io adapter', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
            description: 'myDescription',
            release: '2.0.1',
            version: '2',
            links: {
              self: 'http://localhost:3000',
              about: 'http://localhost:3000/about',
              related: 'http://localhost:3000/related',
            },
            tags: ['test', 'test2'],
            serviceGroupId: 'myGroupId',
            serviceId: 'myServiceId',
          },
          adapterOptions: {
            type: 'socketIO',
            config: {
              host: 'localhost',
            },
          },
          consumerOptions: {
            id: 'myConsumerId',
            actionTargetPairs: {
              query: ['x-myNamespace:other'],
            },
            resolver: {
              'query:x-myNamespace:other': (): Promise<number> => Promise.resolve(3),
            },
          },
          loggerOptions: {
            console: {
              level: 'debug',
              enabled: true,
            },
          },
          observabilityOptions: {
            host: '0.0.0.0',
          },
          retryOptions: {
            attempts: 2,
          },
        }
      );
      expect(wrapper).toBeInstanceOf(ServiceRegistry);
      //@ts-ignore private property
      const health = wrapper._observability.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'test',
        description: 'myDescription',
        version: '2',
        release: '2.0.1',
        //@ts-ignore private property
        instanceId: wrapper._settingsManager.instanceId,
        serviceId: 'myServiceId',
        serviceGroupId: 'myGroupId',
        tags: ['test', 'test2'],
        links: {
          self: 'http://localhost:3000',
          about: 'http://localhost:3000/about',
          related: 'http://localhost:3000/related',
        },
        notes: [],
        output: undefined,
        status: 'warn',
        checks: {
          'test:settings': [
            {
              componentId: checks['test:settings'][0].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'ServiceRegistry',
              status: 'warn',
              time: checks['test:settings'][0].time,
            },
            {
              componentId: checks['test:settings'][1].componentId,
              componentType: 'setup service',
              observedUnit: 'status',
              observedValue: 'stopped',
              output: undefined,
              scope: 'CustomSettings',
              status: 'warn',
              time: checks['test:settings'][1].time,
            },
          ],
          'myConsumerId:commands': [
            {
              status: 'pass',
              componentId: checks['myConsumerId:commands'][0].componentId,
              componentType: 'source',
              observedValue: 0,
              observedUnit: 'pending commands',
              time: checks['myConsumerId:commands'][0].time,
              output: undefined,
            },
          ],
          'myConsumerId:status': [
            {
              status: 'warn',
              componentId: checks['myConsumerId:status'][0].componentId,
              componentType: 'service',
              observedValue: 'stopped',
              time: checks['myConsumerId:status'][0].time,
              output: undefined,
            },
          ],
          'myConsumerId:lastOperation': [
            {
              status: 'pass',
              componentId: checks['myConsumerId:lastOperation'][0].componentId,
              componentType: 'adapter',
              observedValue: 'ok',
              observedUnit: 'result of last operation',
              time: undefined,
              output: undefined,
            },
          ],
          'test:uptime': [
            {
              componentId: checks['test:uptime'][0].componentId,
              componentType: 'system',
              observedValue: checks['test:uptime'][0].observedValue,
              observedUnit: 'time',
              processId: process.pid,
              status: 'pass',
              time: checks['test:uptime'][0].time,
            },
          ],
        },
      });
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.options.resolver).toHaveProperty(
        'query:x-myNamespace:other'
      );
    }, 300);
    it('Should bootstrap and shutdown properly', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        { consumerOptions: {}, adapterOptions: { type: 'redis' } }
      );
      const resource = new ResourceMock('oneResource');
      wrapper.register(resource);
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      expect(wrapper._booted).toBeFalsy();
      //@ts-ignore - private property
      await wrapper.bootstrap();
      //@ts-ignore - private property
      await wrapper.bootstrap();
      //@ts-ignore - private property
      expect(wrapper._observability.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._consumer.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._booted).toBeTruthy();
      //@ts-ignore - private property
      await wrapper.shutdown();
      //@ts-ignore - private property
      await wrapper.shutdown();
      //@ts-ignore - private property
      expect(wrapper._observability.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._consumer.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._booted).toBeFalsy();
    }, 300);
    it('Should start and stop properly', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        { consumerOptions: {}, adapterOptions: { type: 'redis' } }
      );
      const resource = new ResourceMock('oneResource');
      const otherResource = new ResourceMockWithOutMethod('otherResourceWithOutMethod');
      wrapper.register(resource);
      //@ts-ignore - private property
      wrapper.register(otherResource);
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'stop').mockResolvedValue();
      jest.spyOn(resource, 'start').mockResolvedValue();
      jest.spyOn(resource, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      expect(wrapper._booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper._started).toBeFalsy();
      await wrapper.start();
      await wrapper.start();
      //@ts-ignore - private property
      expect(wrapper._observability.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._consumer.start).toHaveBeenCalledTimes(1);
      expect(resource.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._booted).toBeTruthy();
      //@ts-ignore - private property
      expect(wrapper._started).toBeTruthy();
      await wrapper.stop();
      await wrapper.stop();
      //@ts-ignore - private property
      expect(wrapper._observability.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._consumer.stop).toHaveBeenCalledTimes(1);
      expect(resource.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper._started).toBeFalsy();
    }, 300);
    it('Should execute the commands', async () => {
      const myCommandResolver = jest.fn(() => Promise.resolve(3));
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
            namespace: 'x-myNamespace',
          },
          consumerOptions: {
            actionTargetPairs: {
              query: ['x-myNamespace:other', 'x-myNamespace:another'],
            },
            resolver: {
              'query:x-myNamespace:another': myCommandResolver,
            },
          },
          adapterOptions: { type: 'redis' },
        }
      );
      const resource = new ResourceMock('oneResource');
      wrapper.register(resource);
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer.instance, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer.instance, 'stop').mockResolvedValue();
      jest.spyOn(resource, 'start').mockResolvedValue();
      jest.spyOn(resource, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability._metricsRegistry, 'metricsJSON').mockResolvedValue({
        //@ts-ignore - private property
        name: 'test',
      });
      const queryHealth: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Query,
          target: {
            'x-myNamespace:health': {},
          },
        },
      };
      const queryStats: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Query,
          target: {
            'x-myNamespace:stats': {},
          },
        },
      };
      const queryErrors: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Query,
          target: {
            'x-myNamespace:errors': {},
          },
        },
      };
      const queryStop: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Stop,
          target: {
            'x-myNamespace:resources': {},
          },
        },
      };
      const queryStart: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Start,
          target: {
            'x-myNamespace:resources': {},
          },
        },
      };
      const otherCommand: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Query,
          target: {
            'x-myNamespace:other': {},
          },
        },
      };
      const anotherCommand: Control.CommandMessage = {
        from: 'my',
        to: ['test'],
        msg_type: Control.MessageType.Command,
        request_id: v4(),
        content_type: 'application/json',
        created: Date.now(),
        content: {
          action: Control.Action.Query,
          target: {
            'x-myNamespace:another': {},
          },
        },
      };
      //@ts-ignore - private property
      const resultOfQueryHealth = await wrapper._consumer.instance.processCommand(queryHealth);
      expect(resultOfQueryHealth).toEqual({
        content_type: 'application/openc2+json;version=1.0',
        msg_type: 'response',
        request_id: resultOfQueryHealth.request_id,
        status: 200,
        created: resultOfQueryHealth.created,
        from: 'test',
        to: ['my'],
        content: {
          status: 200,
          status_text: undefined,
          results: {
            'x-myNamespace:health': {
              name: 'test',
              description: undefined,
              version: '0',
              release: '0.0.0',
              serviceId: 'mdf-service',
              serviceGroupId: 'mdf-service-group',
              instanceId: resultOfQueryHealth.content.results['x-myNamespace:health'].instanceId,
              notes: [],
              output: undefined,
              status: 'warn',
              checks: {
                'oneResource:status': [
                  {
                    status: 'pass',
                    componentId: 'myComponentId',
                  },
                ],
                'test:commands': [
                  {
                    status: 'pass',
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test:commands'
                      ][0].componentId,
                    componentType: 'source',
                    observedValue: 0,
                    observedUnit: 'pending commands',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test:commands'
                    ][0].time,
                    output: undefined,
                  },
                ],
                'test-publisher:status': [
                  {
                    status: 'warn',
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test-publisher:status'
                      ][0].componentId,
                    componentType: 'database',
                    observedValue: 'stopped',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test-publisher:status'
                    ][0].time,
                    output: undefined,
                  },
                ],
                'test-subscriber:status': [
                  {
                    status: 'warn',
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test-subscriber:status'
                      ][0].componentId,
                    componentType: 'database',
                    observedValue: 'stopped',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test-subscriber:status'
                    ][0].time,
                    output: undefined,
                  },
                ],
                'test:lastOperation': [
                  {
                    status: 'pass',
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test:lastOperation'
                      ][0].componentId,
                    componentType: 'adapter',
                    observedValue: 'ok',
                    observedUnit: 'result of last operation',
                    time: undefined,
                    output: undefined,
                  },
                ],
                'test:uptime': [
                  {
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test:uptime'
                      ][0].componentId,
                    componentType: 'system',
                    observedValue:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test:uptime'
                      ][0].observedValue,
                    observedUnit: 'time',
                    processId: process.pid,
                    status: 'pass',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test:uptime'
                    ][0].time,
                  },
                ],
                ['test:settings']: [
                  {
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test:settings'
                      ][0].componentId,
                    componentType: 'setup service',
                    observedUnit: 'status',
                    observedValue: 'stopped',
                    output: undefined,
                    scope: 'ServiceRegistry',
                    status: 'warn',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test:settings'
                    ][0].time,
                  },
                  {
                    componentId:
                      resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                        'test:settings'
                      ][1].componentId,
                    componentType: 'setup service',
                    observedUnit: 'status',
                    observedValue: 'stopped',
                    output: undefined,
                    scope: 'CustomSettings',
                    status: 'warn',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test:settings'
                    ][1].time,
                  },
                ],
              },
            },
          },
        },
      });
      //@ts-ignore - private property
      const resultOfQueryStats = await wrapper._consumer.instance.processCommand(queryStats);
      expect(resultOfQueryStats).toEqual({
        content_type: 'application/openc2+json;version=1.0',
        msg_type: 'response',
        request_id: resultOfQueryStats.request_id,
        status: 200,
        created: resultOfQueryStats.created,
        from: 'test',
        to: ['my'],
        content: {
          status: 200,
          status_text: undefined,
          results: {
            'x-myNamespace:stats': {
              name: 'test',
            },
          },
        },
      });
      //@ts-ignore - private property
      const resultOfQueryErrors = await wrapper._consumer.instance.processCommand(queryErrors);
      expect(resultOfQueryErrors).toEqual({
        content_type: 'application/openc2+json;version=1.0',
        msg_type: 'response',
        request_id: resultOfQueryErrors.request_id,
        status: 200,
        created: resultOfQueryErrors.created,
        from: 'test',
        to: ['my'],
        content: {
          status: 200,
          status_text: undefined,
          results: {
            'x-myNamespace:errors': [],
          },
        },
      });
      //@ts-ignore - private property
      expect(wrapper._booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper._started).toBeFalsy();
      //@ts-ignore - private property
      await wrapper._consumer.instance.processCommand(queryStart);
      //@ts-ignore - private property
      await wrapper._consumer.instance.processCommand(queryStart);
      //@ts-ignore - private property
      expect(wrapper._observability.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.start).toHaveBeenCalledTimes(1);
      expect(resource.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._booted).toBeTruthy();
      //@ts-ignore - private property
      expect(wrapper._started).toBeTruthy();
      //@ts-ignore - private property
      wrapper._consumer.instance.emit('error', new Error('Error starting'));
      expect(wrapper.errors[0].message).toEqual('Error starting');
      wrapper.on('command', (command: CommandJobHandler) => {
        command.data;
        command.done();
      });
      //@ts-ignore - private property
      const resultOfOther = await wrapper._consumer.instance.processCommand(otherCommand);
      expect(resultOfOther).toEqual({
        content_type: 'application/openc2+json;version=1.0',
        msg_type: 'response',
        request_id: resultOfOther.request_id,
        status: 200,
        created: resultOfOther.created,
        from: 'test',
        to: ['my'],
        content: {
          status: 200,
          status_text: undefined,
          results: undefined,
        },
      });
      //@ts-ignore - private property
      const resultOfAnother = await wrapper._consumer.instance.processCommand(anotherCommand);
      expect(resultOfAnother).toEqual({
        content_type: 'application/openc2+json;version=1.0',
        msg_type: 'response',
        request_id: resultOfAnother.request_id,
        status: 200,
        created: resultOfAnother.created,
        from: 'test',
        to: ['my'],
        content: {
          status: 200,
          status_text: undefined,
          results: { 'x-myNamespace:another': 3 },
        },
      });
      //@ts-ignore - private property
      await wrapper._consumer.instance.processCommand(queryStop);
      //@ts-ignore - private property
      await wrapper._consumer.instance.processCommand(queryStop);
      //@ts-ignore - private property
      expect(wrapper._observability.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._consumer.instance.stop).toHaveBeenCalledTimes(1);
      expect(resource.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper._booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper._started).toBeFalsy();
      jest.resetAllMocks();
      jest.restoreAllMocks();
    }, 300);
    it('Should create a valid instance as a Primary node in a cluster', async () => {
      jest.replaceProperty(cluster, 'isPrimary', true);
      const wrapper = new ServiceRegistry({}, { observabilityOptions: { isCluster: true } });
      const resource = new ResourceMock('oneResource');
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      jest.spyOn(resource, 'start').mockResolvedValue();
      jest.spyOn(resource, 'stop').mockResolvedValue();
      wrapper.register(resource);
      await wrapper.start();
      await wrapper.stop();
      expect(resource.start).toHaveBeenCalledTimes(0);
      expect(resource.stop).toHaveBeenCalledTimes(0);
    }, 300);
    it('Should create a valid instance as a Worker node in a cluster', async () => {
      jest.replaceProperty(cluster, 'isPrimary', false);
      const wrapper = new ServiceRegistry({}, { observabilityOptions: { isCluster: true } });
      const resource = new ResourceMock('oneResource');
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      jest.spyOn(resource, 'start').mockResolvedValue();
      jest.spyOn(resource, 'stop').mockResolvedValue();
      wrapper.register(resource);
      await wrapper.start();
      await wrapper.stop();
      expect(resource.start).toHaveBeenCalledTimes(1);
      expect(resource.stop).toHaveBeenCalledTimes(1);
      jest.restoreAllMocks();
    }, 300);
  });
  describe('#Sad path', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });
    it('Should add an error in the list if the adapter is not valid', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
          },
          retryOptions: {
            attempts: 1,
          },
          consumerOptions: {},
          adapterOptions: {
            //@ts-ignore - Invalid adapter
            type: 'invalid',
          },
        }
      );
      expect(wrapper.status).toEqual('warn');
      expect(wrapper.errors.length).toEqual(1);
      expect(wrapper.errors[0].message).toEqual(
        'Error in the OpenC2 Consumer instance configuration'
      );
      const checks = wrapper.health.checks as Health.Checks;
      expect(checks['test:lastOperation']).toBeUndefined();
    }, 300);
    it('Should throw an error if try to bootstrap and its not possible', async () => {
      try {
        const wrapper = new ServiceRegistry(
          { consumer: true },
          {
            metadata: {
              name: 'test',
            },
            retryOptions: {
              attempts: 1,
              maxWaitTime: 100,
              timeout: 120,
              waitTime: 100,
            },
            consumerOptions: {},
            adapterOptions: { type: 'redis' },
          }
        );
        //@ts-ignore - private property
        await wrapper.bootstrap();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error bootstrapping the application engine: Too much attempts [1], the promise will not be retried'
        );
      }
    }, 300);
    it('Should throw an error in try to shutdown and its not possible', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
          },
          retryOptions: {
            attempts: 1,
          },
          consumerOptions: {},
        }
      );
      const resource = new ResourceMock('oneResource');
      wrapper.register(resource);
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockRejectedValue(new Error('Error stopping'));
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      await wrapper.bootstrap();
      try {
        //@ts-ignore - private property
        await wrapper.shutdown();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error shutting down the application engine: Too much attempts [1], the promise will not be retried'
        );
      }
    }, 300);
    it('Should throw an error in try to start and its not possible', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
          },
          retryOptions: {
            attempts: 1,
          },
          consumerOptions: {},
        }
      );
      const resource = new ResourceMock('oneResource');
      resource.rejectStart = true;
      wrapper.register(resource);
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'stop').mockResolvedValue();
      try {
        await wrapper.start();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error starting the application resources: Too much attempts [1], the promise will not be retried'
        );
      }
    }, 300);
    it('Should throw an error in try to stop and its not possible', async () => {
      const wrapper = new ServiceRegistry(
        { consumer: true },
        {
          metadata: {
            name: 'test',
          },
          retryOptions: {
            attempts: 1,
          },
          consumerOptions: {},
        }
      );
      const resource = new ResourceMock('oneResource');
      resource.rejectStop = true;
      wrapper.register(resource);
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._observability, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'start').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper._consumer, 'stop').mockResolvedValue();
      try {
        await wrapper.start();
        await wrapper.stop();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error stopping the application resources: Too much attempts [1], the promise will not be retried'
        );
      }
    }, 300);
  });
});
