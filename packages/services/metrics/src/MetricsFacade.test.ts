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
// ************************************************************************************************
// #region Component imports
import { mockProperty, undoMocks } from '@mdf/utils';
import cluster from 'cluster';
import {
  AggregatorRegistry as ClusterRegistry,
  register,
  Registry as StandAloneRegistry,
} from 'prom-client';
import { Counter, Gauge, Histogram, Service, Summary } from '.';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Metrics #Service', () => {
  describe('#Happy path', () => {
    it(`Should return a correct metrics service in stand alone mode`, async () => {
      const service = Service.create();
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
      const service = Service.create(true);
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
      const service = Service.create(true);
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
