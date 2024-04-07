/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Health, Layer } from '@mdf.js/core';
import { DebugLogger } from '@mdf.js/logger';
import { undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import { Counter, Registry, register } from 'prom-client';
import { MetricsRegistry } from '.';
const logger = new DebugLogger(`test`);
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Metrics #Service', () => {
  describe('#Happy path', () => {
    it(`Should return a correct metrics service in stand alone mode`, async () => {
      const service = new MetricsRegistry({
        instanceId: UUID_FAKE,
        logger,
        name: 'myMicroService',
      });
      service.start();
      //@ts-ignore Test environment
      expect(service.port).toBeUndefined();
      expect(service.registry).not.toBe(register);
      expect(service.registry).toBeInstanceOf(Registry);
      expect(service.router).toBeDefined();
      expect(service.name).toEqual('myMicroService');
      expect(service.componentId).toEqual(UUID_FAKE);
      expect(service.router).toBeDefined();
      expect(service.status).toEqual(Health.STATUS.PASS);
      expect(service.checks).toEqual({
        [`${service.name}:metrics`]: [
          {
            status: Health.STATUS.PASS,
            observedUnit: 'metrics',
            componentId: UUID_FAKE,
            time: expect.any(String),
          },
        ],
      });
      expect(service.links).toEqual({
        metrics: '/metrics',
      });
      const counter = new Counter({
        name: 'counter',
        help: 'counter',
        registers: [service.registry],
      });
      expect(typeof (await service.getMetricAsString('counter'))).toEqual('string');
      expect(await service.getMetricAsJSON('counter')).toEqual({
        aggregator: 'sum',
        help: 'counter',
        name: 'counter',
        type: 'counter',
        values: [{ labels: {}, value: 0 }],
      });
      expect(service.getMetric('counter')).toBeInstanceOf(Counter);
      expect(typeof (await service.getMetric('gauge'))).toEqual('undefined');
      let metrics = await service.metricsJSON();
      expect(metrics.contentType).toEqual('application/json');
      expect(metrics.metrics.length).toBeGreaterThan(1);
      metrics = await service.metricsText();
      expect(metrics.contentType).toEqual('text/plain; version=0.0.4; charset=utf-8');
      expect(metrics.metrics).toContain('counter 0');
      const secondRegistry = new Registry();
      const addedCounter2 = new Counter({
        name: 'counter2',
        help: 'counter2',
        registers: [secondRegistry],
      });
      service.register({ name: 'test', metrics: secondRegistry } as Layer.App.Service);
      expect(service.getMetric('counter2')).toBeInstanceOf(Counter);

      service.stop();
      service.close();
      expect(await service.metricsJSON()).toEqual({
        metrics: [],
        contentType: 'application/json',
      });
    }, 300);
    it(`Should return a correct metrics service in cluster mode`, async () => {
      const service = new MetricsRegistry({
        instanceId: UUID_FAKE,
        logger,
        name: 'myMicroService',
        isCluster: true,
      });
      //@ts-ignore Test environment
      expect(service.port).toBeDefined();
      expect(service.registry).not.toBe(register);
      expect(service.registry).toBeInstanceOf(Registry);
      expect(service.router).toBeDefined();
      expect(service.name).toEqual('myMicroService');
      expect(service.componentId).toEqual(UUID_FAKE);
      expect(service.router).toBeDefined();
      expect(service.status).toEqual(Health.STATUS.PASS);
      expect(service.checks).toEqual({
        [`${service.name}:metrics`]: [
          {
            status: Health.STATUS.PASS,
            observedUnit: 'metrics',
            componentId: UUID_FAKE,
            time: expect.any(String),
          },
        ],
      });
      expect(service.links).toEqual({
        metrics: '/metrics',
      });
      const counter = new Counter({
        name: 'counter',
        help: 'counter',
        registers: [service.registry],
      });
      expect(typeof (await service.getMetricAsString('counter'))).toEqual('string');
      expect(await service.getMetricAsJSON('counter')).toEqual({
        aggregator: 'sum',
        help: 'counter',
        name: 'counter',
        type: 'counter',
        values: [{ labels: {}, value: 0 }],
      });
      expect(service.getMetric('counter')).toBeInstanceOf(Counter);
      expect(typeof (await service.getMetric('gauge'))).toEqual('undefined');
      let metrics = await service.metricsJSON();
      expect(metrics.contentType).toEqual('application/json');
      expect(metrics.metrics.length).toBeGreaterThan(1);
      metrics = await service.metricsText();
      expect(metrics.contentType).toEqual('text/plain; version=0.0.4; charset=utf-8');
      const secondRegistry = new Registry();
      const addedCounter2 = new Counter({
        name: 'counter2',
        help: 'counter2',
        registers: [secondRegistry],
      });
      service.register({ name: 'test', metrics: secondRegistry } as Layer.App.Service);
      expect(service.getMetric('counter2')).toBeInstanceOf(Counter);

      service.stop();
      service.close();
      expect(await service.metricsJSON()).toEqual({
        metrics: [],
        contentType: 'application/json',
      });
    }, 300);
    it(`Should return a correct metrics service in worker mode`, async () => {
      jest.replaceProperty(cluster, 'isPrimary', false);
      const service = new MetricsRegistry({
        instanceId: UUID_FAKE,
        logger,
        name: 'myMicroService',
        isCluster: true,
      });
      //@ts-ignore Test environment
      expect(service.port).toBeDefined();
      expect(service.registry).not.toBe(register);
      expect(service.registry).toBeInstanceOf(Registry);
      expect(service.router).toBeDefined();
      expect(service.name).toEqual('myMicroService');
      expect(service.componentId).toEqual(UUID_FAKE);
      expect(service.router).toBeDefined();
      expect(service.status).toEqual(Health.STATUS.PASS);
      expect(service.checks).toEqual({
        [`${service.name}:metrics`]: [
          {
            status: Health.STATUS.PASS,
            observedUnit: 'metrics',
            componentId: UUID_FAKE,
            time: expect.any(String),
          },
        ],
      });
      expect(service.links).toEqual({
        metrics: '/metrics',
      });
      const counter = new Counter({
        name: 'counter',
        help: 'counter',
        registers: [service.registry],
      });
      expect(typeof (await service.getMetricAsString('counter'))).toEqual('string');
      expect(await service.getMetricAsJSON('counter')).toEqual({
        aggregator: 'sum',
        help: 'counter',
        name: 'counter',
        type: 'counter',
        values: [{ labels: {}, value: 0 }],
      });
      expect(service.getMetric('counter')).toBeInstanceOf(Counter);
      expect(typeof (await service.getMetric('gauge'))).toEqual('undefined');
      let metrics = await service.metricsJSON();
      expect(metrics.contentType).toEqual('application/json');
      expect(metrics.metrics.length).toBeGreaterThan(1);
      metrics = await service.metricsText();
      expect(metrics.contentType).toEqual('text/plain; version=0.0.4; charset=utf-8');
      expect(metrics.metrics).toContain('counter 0');
      const secondRegistry = new Registry();
      const addedCounter2 = new Counter({
        name: 'counter2',
        help: 'counter2',
        registers: [secondRegistry],
      });
      service.register({ name: 'test', metrics: secondRegistry } as Layer.App.Service);
      expect(service.getMetric('counter2')).toBeInstanceOf(Counter);

      service.stop();
      service.close();
      expect(await service.metricsJSON()).toEqual({
        metrics: [],
        contentType: 'application/json',
      });
      undoMocks();
    }, 300);
  });
});
// #endregion
