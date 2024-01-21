/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { mockProperty, undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import {
  AggregatorRegistry as ClusterRegistry,
  Registry as StandAloneRegistry,
  register,
} from 'prom-client';
import { Counter, Gauge, Histogram, MetricsRegistry, Summary } from '.';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Metrics #Service', () => {
  describe('#Happy path', () => {
    it(`Should return a correct metrics service in stand alone mode`, async () => {
      const service = MetricsRegistry.create();
      //@ts-ignore - Test environment
      expect(service.aggregator.registry).toBeInstanceOf(StandAloneRegistry);
      //@ts-ignore - Test environment
      expect(service.aggregator.clusterRegistryForWorkerMode).toBeUndefined();
      expect(service.router).toBeDefined();
      expect(service.name).toEqual('metrics');
      expect(service.links).toEqual({
        metrics: '/metrics',
      });
      expect(await service.start()).toBeUndefined();
      service.setMetrics({
        counter: { name: 'counter', type: 'Counter', help: 'counter' },
        gauge: { name: 'gauge', type: 'Gauge', help: 'gauge' },
        histogram: { name: 'histogram', type: 'Histogram', help: 'histogram' },
        summary: { name: 'summary', type: 'Summary', help: 'summary' },
      });
      expect(typeof (await service.getMetricAsString('counter'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('gauge'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('histogram'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('summary'))).toEqual('string');
      expect(await service.getMetricAsJSON('counter')).toEqual({
        aggregator: 'sum',
        help: 'counter',
        name: 'counter',
        type: 'counter',
        values: [{ labels: {}, value: 0 }],
      });
      expect(service.getMetric('counter')).toBeInstanceOf(Counter);
      expect(service.getMetric('gauge')).toBeInstanceOf(Gauge);
      expect(service.getMetric('histogram')).toBeInstanceOf(Histogram);
      expect(service.getMetric('summary')).toBeInstanceOf(Summary);
      service.removeMetric('gauge');
      expect(typeof (await service.getMetric('gauge'))).toEqual('undefined');
      expect(await service.metricsJSON()).toBeDefined();
      expect((await service.metrics()).contentType).toEqual(
        'text/plain; version=0.0.4; charset=utf-8'
      );
      expect(await service.stop()).toBeUndefined();
    }, 300);
    it(`Should return a correct metrics service in cluster mode`, async () => {
      const service = MetricsRegistry.create(true);
      //@ts-ignore - Test environment
      expect(service.aggregator.registry).toBeInstanceOf(ClusterRegistry);
      //@ts-ignore - Test environment
      expect(service.aggregator.clusterRegistryForWorkerMode).toBeUndefined();
      expect(service.router).toBeDefined();
      service.setMetrics({
        counter: { name: 'counter', type: 'Counter', help: 'counter' },
        gauge: { name: 'gauge', type: 'Gauge', help: 'gauge' },
        histogram: { name: 'histogram', type: 'Histogram', help: 'histogram' },
        summary: { name: 'summary', type: 'Summary', help: 'summary' },
      });
      expect(typeof (await service.getMetricAsString('counter'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('gauge'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('histogram'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('summary'))).toEqual('string');
      expect(await service.getMetricAsJSON('counter')).toEqual({
        aggregator: 'sum',
        help: 'counter',
        name: 'counter',
        type: 'counter',
        values: [{ labels: {}, value: 0 }],
      });
      expect(service.getMetric('counter')).toBeInstanceOf(Counter);
      expect(service.getMetric('gauge')).toBeInstanceOf(Gauge);
      expect(service.getMetric('histogram')).toBeInstanceOf(Histogram);
      expect(service.getMetric('summary')).toBeInstanceOf(Summary);
      service.removeMetric('gauge');
      expect(typeof (await service.getMetric('gauge'))).toEqual('undefined');
      expect(await service.metricsJSON()).toBeDefined();
      expect((await service.metrics()).contentType).toEqual(
        'text/plain; version=0.0.4; charset=utf-8'
      );
    }, 300);
    it(`Should return a correct metrics service in worker mode`, async () => {
      //@ts-ignore Test environment
      mockProperty(cluster, 'isPrimary', false);
      const service = MetricsRegistry.create(true);
      //@ts-ignore - Test environment
      expect(service.aggregator.registry).toBe(register);
      //@ts-ignore - Test environment
      expect(service.aggregator.clusterRegistryForWorkerMode).toBeDefined();
      expect(service.router).toBeDefined();
      service.setMetrics({
        counter: { name: 'counter', type: 'Counter', help: 'counter' },
        gauge: { name: 'gauge', type: 'Gauge', help: 'gauge' },
        histogram: { name: 'histogram', type: 'Histogram', help: 'histogram' },
        summary: { name: 'summary', type: 'Summary', help: 'summary' },
      });
      expect(typeof (await service.getMetricAsString('counter'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('gauge'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('histogram'))).toEqual('string');
      expect(typeof (await service.getMetricAsString('summary'))).toEqual('string');
      expect(await service.getMetricAsJSON('counter')).toEqual({
        aggregator: 'sum',
        help: 'counter',
        name: 'counter',
        type: 'counter',
        values: [{ labels: {}, value: 0 }],
      });
      expect(service.getMetric('counter')).toBeInstanceOf(Counter);
      expect(service.getMetric('gauge')).toBeInstanceOf(Gauge);
      expect(service.getMetric('histogram')).toBeInstanceOf(Histogram);
      expect(service.getMetric('summary')).toBeInstanceOf(Summary);
      service.removeMetric('gauge');
      expect(typeof (await service.getMetric('gauge'))).toEqual('undefined');
      expect(await service.metricsJSON()).toBeDefined();
      expect((await service.metrics()).contentType).toEqual(
        'text/plain; version=0.0.4; charset=utf-8'
      );
      undoMocks();
    }, 300);
  });
});
// #endregion
