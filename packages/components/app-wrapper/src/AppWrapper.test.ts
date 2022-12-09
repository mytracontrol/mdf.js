/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Health, Layer } from '@mdf.js/core';
import { Logger } from '@mdf.js/logger';
import { Control } from '@mdf.js/openc2';
import { undoMocks } from '@mdf.js/utils';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { AppWrapper } from './AppWrapper';

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
describe('#AppWrapper class', () => {
  describe('#Happy path', () => {
    it('Should create a valid instance with default values', async () => {
      const wrapper = new AppWrapper({ name: 'test' });
      expect(wrapper).toBeInstanceOf(AppWrapper);
      expect(wrapper.instanceId).toBeDefined();
      wrapper.register(new ResourceMock('oneResource'));
      wrapper.register([new ResourceMock('twoResource'), new ResourceMock('threeResource')]);
      const health = wrapper.observability.healthRegistry.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'test',
        description: 'test',
        release: '1.0.0',
        version: '1',
        instanceId: wrapper.instanceId,
        notes: [],
        output: '',
        status: 'warn',
        checks: {
          'test:commands': [
            {
              status: 'pass',
              componentId: checks['test:commands'][0].componentId,
              componentType: 'source',
              observedValue: 0,
              observedUnit: 'pending commands',
              time: checks['test:commands'][0].time,
              output: undefined,
            },
          ],
          'test-publisher:status': [
            {
              status: 'warn',
              componentId: checks['test-publisher:status'][0].componentId,
              componentType: 'database',
              observedValue: 'stopped',
              time: checks['test-publisher:status'][0].time,
              output: undefined,
            },
          ],
          'test-subscriber:status': [
            {
              status: 'warn',
              componentId: checks['test-subscriber:status'][0].componentId,
              componentType: 'database',
              observedValue: 'stopped',
              time: checks['test-subscriber:status'][0].time,
              output: undefined,
            },
          ],
          'test:lastOperation': [
            {
              status: 'pass',
              componentId: checks['test:lastOperation'][0].componentId,
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
              status: 'pass',
              time: checks['test:uptime'][0].time,
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
    });
    it('Should create a valid instance with non-default values with redis adapter', async () => {
      const wrapper = new AppWrapper({
        name: 'test',
        application: {
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
        adapter: {
          type: 'redis',
          config: {
            connectionName: 'myConnectionTest',
          },
        },
        consumer: {
          id: 'myConsumerId',
          logger: new Logger('myConsumerId'),
          resolver: {
            'query:x-myNamespace:other': (): Promise<number> => Promise.resolve(3),
          },
        },
        namespace: 'x-myNamespace',
        logger: {
          console: {
            level: 'debug',
            enabled: true,
          },
        },
        observability: {
          host: '0.0.0.0',
        },
        retryOptions: {
          attempts: 2,
        },
      });
      expect(wrapper).toBeInstanceOf(AppWrapper);
      expect(wrapper.instanceId).toBeDefined();
      const health = wrapper.observability.healthRegistry.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'test',
        description: 'myDescription',
        release: '2.0.1',
        version: '2',
        instanceId: wrapper.instanceId,
        notes: [],
        output: '',
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
              status: 'pass',
              time: checks['test:uptime'][0].time,
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
      expect(wrapper.consumer.options.resolver).toHaveProperty('query:x-myNamespace:errors');
      //@ts-ignore - private property
      expect(wrapper.consumer.options.resolver).toHaveProperty('query:x-myNamespace:health');
      //@ts-ignore - private property
      expect(wrapper.consumer.options.resolver).toHaveProperty('query:x-myNamespace:other');
      //@ts-ignore - private property
      expect(wrapper.consumer.options.resolver).toHaveProperty('query:x-myNamespace:stats');
      //@ts-ignore - private property
      expect(wrapper.consumer.options.resolver).toHaveProperty('start:x-myNamespace:resources');
      //@ts-ignore - private property
      expect(wrapper.consumer.options.resolver).toHaveProperty('stop:x-myNamespace:resources');
    });
    it('Should create a valid instance with non-default values with socket-io adapter', async () => {
      const wrapper = new AppWrapper({
        name: 'test',
        application: {
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
        adapter: {
          type: 'socketIO',
          config: {
            host: 'localhost',
          },
        },
        consumer: {
          id: 'myConsumerId',
          logger: new Logger('myConsumerId'),
          actionTargetPairs: {
            query: ['x-myNamespace:other'],
          },
          resolver: {
            'query:x-myNamespace:other': (): Promise<number> => Promise.resolve(3),
          },
        },
        logger: {
          console: {
            level: 'debug',
            enabled: true,
          },
        },
        observability: {
          host: '0.0.0.0',
        },
        retryOptions: {
          attempts: 2,
        },
      });
      expect(wrapper).toBeInstanceOf(AppWrapper);
      expect(wrapper.instanceId).toBeDefined();
      const health = wrapper.observability.healthRegistry.health;
      const checks = health.checks as Health.Checks;
      expect(health).toEqual({
        name: 'test',
        description: 'myDescription',
        version: '2',
        release: '2.0.1',
        instanceId: wrapper.instanceId,
        serviceId: 'myServiceId',
        serviceGroupId: 'myGroupId',
        tags: ['test', 'test2'],
        links: {
          self: 'http://localhost:3000',
          about: 'http://localhost:3000/about',
          related: 'http://localhost:3000/related',
        },
        notes: [],
        output: '',
        status: 'warn',
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
              status: 'pass',
              time: checks['test:uptime'][0].time,
            },
          ],
        },
      });
      //@ts-ignore - private property
      expect(wrapper.consumer.options.resolver).toHaveProperty('query:x-myNamespace:other');
    });
    it('Should bootstrap and shutdown properly', async () => {
      const wrapper = new AppWrapper({ name: 'test' });
      const resource = new ResourceMock('oneResource');
      wrapper.register(resource);
      jest.spyOn(wrapper.observability, 'start').mockResolvedValue();
      jest.spyOn(wrapper.observability, 'stop').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'start').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      expect(wrapper.booted).toBeFalsy();
      await wrapper.bootstrap();
      await wrapper.bootstrap();
      expect(wrapper.observability.start).toHaveBeenCalledTimes(1);
      expect(wrapper.consumer.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper.booted).toBeTruthy();
      await wrapper.shutdown();
      await wrapper.shutdown();
      expect(wrapper.observability.stop).toHaveBeenCalledTimes(1);
      expect(wrapper.consumer.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper.booted).toBeFalsy();
    });
    it('Should start and stop properly', async () => {
      const wrapper = new AppWrapper({ name: 'test' });
      const resource = new ResourceMock('oneResource');
      const otherResource = new ResourceMockWithOutMethod('otherResourceWithOutMethod');
      wrapper.register(resource);
      //@ts-ignore - private property
      wrapper.register(otherResource);
      jest.spyOn(wrapper.observability, 'start').mockResolvedValue();
      jest.spyOn(wrapper.observability, 'stop').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'start').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'stop').mockResolvedValue();
      jest.spyOn(resource, 'start').mockResolvedValue();
      jest.spyOn(resource, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      expect(wrapper.booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper.started).toBeFalsy();
      await wrapper.start();
      await wrapper.start();
      expect(wrapper.observability.start).toHaveBeenCalledTimes(1);
      expect(wrapper.consumer.start).toHaveBeenCalledTimes(1);
      expect(resource.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper.booted).toBeTruthy();
      //@ts-ignore - private property
      expect(wrapper.started).toBeTruthy();
      await wrapper.stop();
      await wrapper.stop();
      expect(wrapper.observability.stop).toHaveBeenCalledTimes(1);
      expect(wrapper.consumer.stop).toHaveBeenCalledTimes(1);
      expect(resource.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper.booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper.started).toBeFalsy();
    });
    it('Should execute the commands', async () => {
      const wrapper = new AppWrapper({ name: 'test', namespace: 'x-myNamespace' });
      const resource = new ResourceMock('oneResource');
      wrapper.register(resource);
      jest.spyOn(wrapper.observability, 'start').mockResolvedValue();
      jest.spyOn(wrapper.observability, 'stop').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'start').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'stop').mockResolvedValue();
      jest.spyOn(resource, 'start').mockResolvedValue();
      jest.spyOn(resource, 'stop').mockResolvedValue();
      //@ts-ignore - private property
      jest.spyOn(wrapper.observability.metricsRegistry, 'metricsJSON').mockResolvedValue({
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
      //@ts-ignore - private property
      const resultOfQueryHealth = await wrapper.consumer.processCommand(queryHealth);
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
              description: 'test',
              version: '1',
              release: '1.0.0',
              instanceId: resultOfQueryHealth.content.results['x-myNamespace:health'].instanceId,
              notes: [],
              output: '',
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
                    status: 'pass',
                    time: resultOfQueryHealth.content.results['x-myNamespace:health'].checks[
                      'test:uptime'
                    ][0].time,
                  },
                ],
              },
            },
          },
        },
      });
      //@ts-ignore - private property
      const resultOfQueryStats = await wrapper.consumer.processCommand(queryStats);
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
      const resultOfQueryErrors = await wrapper.consumer.processCommand(queryErrors);
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
      expect(wrapper.booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper.started).toBeFalsy();
      //@ts-ignore - private property
      await wrapper.consumer.processCommand(queryStart);
      //@ts-ignore - private property
      await wrapper.consumer.processCommand(queryStart);
      expect(wrapper.observability.start).toHaveBeenCalledTimes(1);
      expect(wrapper.consumer.start).toHaveBeenCalledTimes(1);
      expect(resource.start).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper.booted).toBeTruthy();
      //@ts-ignore - private property
      expect(wrapper.started).toBeTruthy();
      //@ts-ignore - private property
      await wrapper.consumer.processCommand(queryStop);
      //@ts-ignore - private property
      await wrapper.consumer.processCommand(queryStop);
      expect(wrapper.observability.stop).toHaveBeenCalledTimes(1);
      expect(wrapper.consumer.stop).toHaveBeenCalledTimes(1);
      expect(resource.stop).toHaveBeenCalledTimes(1);
      //@ts-ignore - private property
      expect(wrapper.booted).toBeFalsy();
      //@ts-ignore - private property
      expect(wrapper.started).toBeFalsy();
      undoMocks();
    });
  });
  describe('#Sad path', () => {
    it('Should throw an error if the adapter is not valid', async () => {
      try {
        const wrapper = new AppWrapper({
          name: 'test',
          retryOptions: {
            attempts: 2,
          },
          adapter: {
            //@ts-ignore - Invalid adapter
            type: 'invalid',
          },
        });
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual('Unknown consumer adapter type: invalid');
      }
    });
    it('Should throw an error if try to bootstrap and its not possible', async () => {
      try {
        const wrapper = new AppWrapper({
          name: 'test',
          retryOptions: {
            attempts: 2,
          },
        });
        await wrapper.bootstrap();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error bootstrapping the application engine: Too much attempts [2], the promise will not be retried'
        );
      }
    });
    it('Should throw an error in try to shutdown and its not possible', async () => {
      const wrapper = new AppWrapper({
        name: 'test',
        retryOptions: {
          attempts: 2,
        },
      });
      const resource = new ResourceMock('oneResource');
      wrapper.register(resource);
      jest.spyOn(wrapper.observability, 'start').mockResolvedValue();
      jest.spyOn(wrapper.observability, 'stop').mockRejectedValue(new Error('Error stopping'));
      jest.spyOn(wrapper.consumer, 'start').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'stop').mockResolvedValue();
      await wrapper.bootstrap();
      try {
        await wrapper.shutdown();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error shutting down the application engine: Too much attempts [2], the promise will not be retried'
        );
      }
    });
    it('Should throw an error in try to start and its not possible', async () => {
      const wrapper = new AppWrapper({
        name: 'test',
        retryOptions: {
          attempts: 2,
        },
      });
      const resource = new ResourceMock('oneResource');
      resource.rejectStart = true;
      wrapper.register(resource);
      jest.spyOn(wrapper.observability, 'start').mockResolvedValue();
      jest.spyOn(wrapper.observability, 'stop').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'start').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'stop').mockResolvedValue();
      try {
        await wrapper.start();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error starting the application resources: Too much attempts [2], the promise will not be retried'
        );
      }
    });
    it('Should throw an error in try to stop and its not possible', async () => {
      const wrapper = new AppWrapper({
        name: 'test',
        retryOptions: {
          attempts: 2,
        },
      });
      const resource = new ResourceMock('oneResource');
      resource.rejectStop = true;
      wrapper.register(resource);
      jest.spyOn(wrapper.observability, 'start').mockResolvedValue();
      jest.spyOn(wrapper.observability, 'stop').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'start').mockResolvedValue();
      jest.spyOn(wrapper.consumer, 'stop').mockResolvedValue();
      try {
        await wrapper.start();
        await wrapper.stop();
        throw new Error('Should not be here');
      } catch (error) {
        expect((error as Error).message).toEqual(
          'Error stopping the application resources: Too much attempts [2], the promise will not be retried'
        );
      }
    });
  });
});
