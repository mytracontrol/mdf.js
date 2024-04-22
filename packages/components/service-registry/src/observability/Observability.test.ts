/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import cluster from 'cluster';
import EventEmitter from 'events';
import request from 'supertest';
import { v4 } from 'uuid';
import { Observability, ObservabilityOptions } from '.';

// Create a random port number between 1024 and 65535
const randomPort = () => Math.floor(Math.random() * (65535 - 1024) + 1024);

// @ts-ignore - Test environment
class MyService extends EventEmitter implements Layer.App.Service {
  name = 'myService';
  links = {
    openc2: {
      jobs: '/openc2/jobs',
      pendingJobs: '/openc2/pendingJobs',
      messages: '/openc2/messages',
    },
  };
}
describe('#Observability #Service', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });
    it(`Should create an instance of observability service in NO CLUSTER MODE`, async () => {
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
          links: {
            self: 'http://localhost:3000',
          },
        },
        service: { isCluster: false, port: randomPort() },
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      //@ts-ignore - private property
      expect(service._registers.length).toBe(3);
      await service.stop();

      //@ts-ignore - private property
      service._app._build = service._app.build;
      //@ts-ignore - private property
      jest.spyOn(service._app, 'build').mockImplementation(async () => {
        // @ts-ignore - private property
        await service._app._build();
        // @ts-ignore - private property
        jest.spyOn(service._app._server.client, 'listen').mockImplementation(() => {
          // @ts-ignore - private property
          setImmediate(() => service._app._server.client.emit('listening'));
          // @ts-ignore - private property
          return service._app._server.client;
        });
        // @ts-ignore - private property
        jest.spyOn(service._app._server.port.terminator, 'terminate').mockResolvedValue();
        return Promise.resolve();
      });
      await service.start();
      await service.start();
      // @ts-ignore - private property
      request(service._app._app).get('/v1/health').expect(200);
      await service.close();
    }, 300);
    it(`Should create an instance of observability service in CLUSTER MODE, and the server should response to endpoints`, done => {
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: true,
          primaryPort: randomPort(),
          port: randomPort(),
        },
      };
      const service = new Observability(config);
      //@ts-ignore - private property
      expect(service._registers.length).toBe(3);
      expect(service).toBeDefined();
      expect(service.attach).toBeDefined();
      service
        .start()
        .then(() =>
          // @ts-ignore - private property
          request(service._app._app)
            .get('/v1/health')
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
        )
        .then(response => {
          expect(response.body.status).toEqual('pass');
          expect(response.body.version).toEqual('1');
          expect(response.body.release).toEqual('1.0.0');
          expect(response.body.notes).toEqual([]);
          expect(response.body.output).toEqual(undefined);
        })
        .then(() => service.stop())
        .then(() => service.close())
        .then(() => done())
        .catch(error => {
          service.stop().then();
          done(error);
        });
    }, 300);
    it(`Should create an instance of observability service in CLUSTER MODE as WORKER`, async () => {
      jest.replaceProperty(cluster, 'isPrimary', false);
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: true,
          port: randomPort(),
          primaryPort: randomPort(),
        },
      };
      const service = new Observability(config);
      //@ts-ignore - private property
      jest.spyOn(service._errorsRegistry, 'start').mockImplementation(() => Promise.resolve());
      //@ts-ignore - private property
      jest.spyOn(service._metricsRegistry, 'start').mockImplementation(() => Promise.resolve());
      //@ts-ignore - private property
      jest.spyOn(service._healthRegistry, 'start').mockImplementation(() => Promise.resolve());
      //@ts-ignore - private property
      service._app.build();
      //@ts-ignore - private property
      service._app.build();
      //@ts-ignore - private property
      jest.spyOn(service._app._server, 'start').mockImplementation(() => Promise.resolve());
      //@ts-ignore - private property
      jest.spyOn(service._app._server, 'stop').mockImplementation(() => Promise.resolve());
      expect(service).toBeDefined();
      await service.start();
      await service.stop();
      await service.close();
    }, 300);
    it(`Should create an instance of observability service in CLUSTER MODE as MASTER`, async () => {
      jest.replaceProperty(cluster, 'isPrimary', true);
      jest.replaceProperty(cluster, 'isWorker', false);
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: true,
          port: randomPort(),
          primaryPort: randomPort(),
        },
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
    }, 300);
    it(`Should create an instance of observability service in NO CLUSTER MODE with too much low port`, async () => {
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: false,
          port: -1,
        },
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      //@ts-ignore - spy private
      jest.spyOn(service._app, 'checkPort');
      //@ts-ignore - call private
      await service._app.build();
      //@ts-ignore - check private
      expect(service._app.checkPort).toHaveLastReturnedWith(9080); //@ts-ignore - spy private
      jest.spyOn(service._app, 'checkPort');
      //@ts-ignore - call private
      await service._app.build();
      //@ts-ignore - check private
      expect(service._app.checkPort).toHaveLastReturnedWith(9080);
    }, 300);
    it(`Should create an instance of observability service in NO CLUSTER MODE with too much high port`, async () => {
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: false,
          port: 70000,
        },
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      //@ts-ignore - spy private
      jest.spyOn(service._app, 'checkPort');
      //@ts-ignore - call private
      await service._app.build();
      //@ts-ignore - check private
      expect(service._app.checkPort).toHaveLastReturnedWith(9080);
    }, 300);
    it(`Should store in the registry the errors emitted by underlayer services`, async () => {
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: false,
          port: randomPort(),
          primaryPort: randomPort(),
        },
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      const myNewService = new MyService();
      //@ts-ignore - private property
      service.attach(myNewService);

      //@ts-ignore - private property
      service._app._build = service._app.build;
      //@ts-ignore - private property
      jest.spyOn(service._app, 'build').mockImplementation(async () => {
        // @ts-ignore - private property
        await service._app._build();
        // @ts-ignore - private property
        jest.spyOn(service._app._server.client, 'listen').mockImplementation(() => {
          // @ts-ignore - private property
          setImmediate(() => service._app._server.client.emit('listening'));
          // @ts-ignore - private property
          return service._app._server.client;
        });
        // @ts-ignore - private property
        jest.spyOn(service._app._server.port.terminator, 'terminate').mockResolvedValue();
        return Promise.resolve();
      });

      await service.start();
      //@ts-ignore - private property
      expect(service._errorsRegistry.size).toBe(0);
      myNewService.emit('error', new Error('Test error'));
      //@ts-ignore - private property
      expect(service._errorsRegistry.size).toBe(1);
      service.push(new Error('Test error'));
      //@ts-ignore - private property
      expect(service._errorsRegistry.size).toBe(2);
      //@ts-ignore - private property
      expect(service._healthRegistry.health.notes?.length).toBe(0);
      service.addNote(`Test note`);
      //@ts-ignore - private property
      expect(service._healthRegistry.health.notes?.length).toBe(1);
      service.addCheck('myComponent', 'myCheck', {
        status: 'pass',
        componentId: '123',
        output: 'Test output',
      });
      //@ts-ignore - private property
      expect(service._healthRegistry.health.checks['myComponent:myCheck'][0].status).toBe('pass');
      await service.stop();
    }, 300);
    it(`Should register a service in the registry`, async () => {
      const config: ObservabilityOptions = {
        metadata: {
          name: 'myObservability',
          version: '1',
          description: 'myObservability service',
          instanceId: v4(),
          release: '1.0.0',
        },
        service: {
          isCluster: false,
          port: randomPort(),
          primaryPort: randomPort(),
        },
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      //@ts-ignore - private property
      expect(service._errorsRegistry.size).toBe(0);
      const myService = new MyService();
      //@ts-ignore - private property
      expect(service._registers.length).toBe(3);
      //@ts-ignore - private property
      service.attach(myService);
      //@ts-ignore - private property
      expect(service._registers.length).toBe(3);

      //@ts-ignore - private property
      service._app._build = service._app.build;
      //@ts-ignore - private property
      jest.spyOn(service._app, 'build').mockImplementation(async () => {
        // @ts-ignore - private property
        await service._app._build();
        // @ts-ignore - private property
        jest.spyOn(service._app._server.client, 'listen').mockImplementation(() => {
          // @ts-ignore - private property
          setImmediate(() => service._app._server.client.emit('listening'));
          // @ts-ignore - private property
          return service._app._server.client;
        });
        // @ts-ignore - private property
        jest.spyOn(service._app._server.port.terminator, 'terminate').mockResolvedValue();
        return Promise.resolve();
      });

      await service.stop();
      await service.start();
      await service.start();
      await service.stop();
    }, 300);
  });
});
// #endregion
