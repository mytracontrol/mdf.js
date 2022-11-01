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
import {
  AggregatorRegistry as ClusterRegistry,
  Counter,
  Gauge,
  Histogram,
  Registry as StandAloneRegister,
  Summary,
} from 'prom-client';
import { Aggregator } from './Aggregator';
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const aggregator = new Aggregator(new StandAloneRegister());
const aggregatorCluster = new Aggregator(new ClusterRegistry());
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Metrics #Aggregator', () => {
  describe('#Happy path', () => {
    it(`Should add counters, gauges, histogram and summary properly using the methods`, async () => {
      aggregator.setMetrics({
        counter: { name: 'counter', type: 'Counter', help: 'counter' },
        gauge: { name: 'gauge', type: 'Gauge', help: 'gauge' },
        histogram: { name: 'histogram', type: 'Histogram', help: 'histogram' },
        summary: { name: 'summary', type: 'Summary', help: 'summary' },
      });
      expect(typeof (await aggregator.getMetricAsString('counter'))).toEqual('string');
      expect(typeof (await aggregator.getMetricAsString('gauge'))).toEqual('string');
      expect(typeof (await aggregator.getMetricAsString('histogram'))).toEqual('string');
      expect(typeof (await aggregator.getMetricAsString('summary'))).toEqual('string');
      aggregator.removeMetric('gauge');
      expect(typeof (await aggregator.getMetric('gauge'))).toEqual('undefined');
    }, 300);
    it(`Should be possible to retrieve the metrics properly using the methods`, () => {
      expect(aggregator.getMetric('counter') instanceof Counter).toBe(true);
      expect(aggregator.getMetric('gauge') instanceof Gauge).toBe(false);
      expect(aggregator.getMetric('histogram') instanceof Histogram).toBe(true);
      expect(aggregator.getMetric('summary') instanceof Summary).toBe(true);
    }, 300);
    it(`Should be possible to retrieve the value in JSON format or undefined if not exists`, async () => {
      expect((await aggregator.getMetricAsJSON('counter'))?.name).toEqual('counter');
      jest
        .spyOn(aggregator, 'metricsJSON')
        .mockResolvedValue({ contentType: '', metrics: 'myMetics' });
      expect(await aggregator.getMetricAsJSON('none')).toBeUndefined();
    }, 300);
    it(`Should be possible to retrieve the value in JSON format or undefined if not exists`, async () => {
      expect((await aggregatorCluster.metrics()).contentType).toEqual(
        'text/plain; version=0.0.4; charset=utf-8'
      );
      expect((await aggregator.metrics()).contentType).toEqual(
        'text/plain; version=0.0.4; charset=utf-8'
      );
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should throw an error if we try to create a metric with a invalid name`, async () => {
      expect(() =>
        aggregator.setMetrics({
          test: {
            name: '',
            type: 'Counter',
            help: 'test',
          },
        })
      ).toThrowError(/Error including new metrics in the aggregator: Metric name is required/);
      expect(() =>
        aggregator.setMetrics({
          test: {
            //@ts-ignore - Test environment
            name: 3,
            type: 'Counter',
            help: 'test',
          },
        })
      ).toThrowError(/Error including new metrics in the aggregator: Metric name is required/);
    }, 300);
    it(`Should throw an error if we try to create a metric with a invalid help`, async () => {
      expect(() =>
        aggregator.setMetrics({
          test: {
            name: 'counter',
            type: 'Counter',
            help: '',
          },
        })
      ).toThrowError(/Error including new metrics in the aggregator: Metric help is required/);
      expect(() =>
        aggregator.setMetrics({
          test: {
            name: 'counter',
            type: 'Counter',
            //@ts-ignore - Test environment
            help: 3,
          },
        })
      ).toThrowError(/Error including new metrics in the aggregator: Metric help is required/);
    }, 300);
    it(`Should throw an error if we try to create a metric with a invalid type`, async () => {
      expect(() =>
        aggregator.setMetrics({
          test: {
            name: 'counter',
            //@ts-ignore - Test environment
            type: 3,
            help: 'test',
          },
        })
      ).toThrowError(/Error including new metrics in the aggregator: Metric type is required/);
      expect(() =>
        aggregator.setMetrics({
          test: {
            name: 'counter',
            //@ts-ignore - Test environment
            type: 'nonSense',
            help: 'test',
          },
        })
      ).toThrowError(/Error including new metrics in the aggregator: Metric type is required/);
    }, 300);
  });
});
// #endregion
