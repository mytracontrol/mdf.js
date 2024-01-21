/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Layer } from '@mdf.js/core';
import { mockProperty, undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import EventEmitter from 'events';
import request from 'supertest';
import { v4 } from 'uuid';
import { Observability, ObservabilityOptions } from '.';
// #endregion
// *************************************************************************************************
// #region Our tests

class MyService extends EventEmitter implements Layer.Service.Registry {
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
    it(`Should create an instance of observability service in NO CLUSTER MODE`, async () => {
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: false,
        links: {
          self: 'http://localhost:3000',
        },
      };
      const service = new Observability(config);
      //@ts-ignore - private property
      expect(service.registries.length).toBe(3);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.attach).toBeDefined();
      expect(service.links).toBeUndefined();
      await service.stop();
      await service.start();
      await service.start();
      expect(service.links).toEqual({
        health: 'http://127.0.0.1:9080/v1/health',
        metrics: 'http://127.0.0.1:9080/v1/metrics',
        registers: 'http://127.0.0.1:9080/v1/registers',
      });
      // @ts-ignore - private property
      request(service.app).get('/v1/health').expect(200);

      await service.stop();
    }, 300);
    it(`Should create an instance of observability service in CLUSTER MODE, and the server should response to endpoints`, done => {
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: true,
      };
      const service = new Observability(config);
      //@ts-ignore - private property
      expect(service.registries.length).toBe(3);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.attach).toBeDefined();
      service
        .start()
        .then(() =>
          // @ts-ignore - private property
          request(service.app)
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
          expect(response.body.output).toEqual('');
        })
        .then(() => service.stop())
        .then(() => done())
        .catch(error => {
          service.stop().then();
          done(error);
        });
    }, 300);
    it(`Should create an instance of observability service in CLUSTER MODE as WORKER`, async () => {
      //@ts-ignore - Test environment
      mockProperty(cluster, 'isPrimary', false);
      //@ts-ignore - Test environment
      mockProperty(cluster, 'isWorker', true);
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: true,
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.attach).toBeDefined();
      undoMocks();
    }, 300);
    it(`Should create an instance of observability service in CLUSTER MODE as MASTER`, async () => {
      //@ts-ignore - Test environment
      mockProperty(cluster, 'isPrimary', true);
      //@ts-ignore - Test environment
      mockProperty(cluster, 'isWorker', false);
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: true,
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.attach).toBeDefined();
      undoMocks();
    }, 300);
    it(`Should create an instance of observability service in NO CLUSTER MODE with too much low port`, async () => {
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: false,
        port: 1,
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.attach).toBeDefined();
      await service.stop();
      await service.start();
      await service.start();
      await service.stop();
    }, 300);
    it(`Should create an instance of observability service in NO CLUSTER MODE with too much high port`, async () => {
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: false,
        port: 70000,
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.attach).toBeDefined();
      await service.stop();
      await service.start();
      await service.start();
      await service.stop();
    }, 300);
    it(`Should store in the registry the errors emitted by the health service`, async () => {
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: false,
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.errorsRegistry).toBeDefined();
      expect(service.errorsRegistry.size).toBe(0);
      service.healthRegistry.emit('error', new Error('Test error'));
      expect(service.errorsRegistry.size).toBe(1);
    }, 300);
    it(`Should register a service in the registry`, async () => {
      const config: ObservabilityOptions = {
        name: 'myObservability',
        version: '1',
        description: 'myObservability service',
        instanceId: v4(),
        release: '1.0.0',
        isCluster: false,
      };
      const service = new Observability(config);
      expect(service).toBeDefined();
      expect(service.healthRegistry).toBeDefined();
      expect(service.metricsRegistry).toBeDefined();
      expect(service.errorsRegistry).toBeDefined();
      expect(service.errorsRegistry.size).toBe(0);
      const myService = new MyService();
      //@ts-ignore - private property
      expect(service.registries.length).toBe(3);
      service.attach(myService);
      //@ts-ignore - private property
      expect(service.registries.length).toBe(4);
      await service.stop();
      await service.start();
      await service.start();
      await service.stop();
    }, 300);
  });
});
// #endregion
