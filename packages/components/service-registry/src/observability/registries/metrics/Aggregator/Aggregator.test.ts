/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { DebugLogger } from '@mdf.js/logger';
import { Counter, Registry } from 'prom-client';
import { Aggregator } from './Aggregator';

describe('#Metrics #Aggregator', () => {
  describe('#Happy path', () => {
    it(`Should create a new aggregator and be able to use all the methods of the aggregator properly`, async () => {
      const myLogger = new DebugLogger('test');
      const aggregator = new Aggregator(myLogger);
      const addedCounter1 = new Counter({
        name: 'counter1',
        help: 'counter1',
        registers: [aggregator.registry],
      });
      expect(typeof (await aggregator.getMetricAsString('counter1'))).toEqual('string');
      expect(typeof (await aggregator.getMetricAsJSON('counter1'))).toEqual('object');
      expect(aggregator.getMetric('counter1') instanceof Counter).toBe(true);
      let metrics = await aggregator.metricsText();
      expect(metrics.contentType).toEqual('text/plain; version=0.0.4; charset=utf-8');
      expect(metrics.metrics).toContain(
        '# HELP counter1 counter1\n# TYPE counter1 counter\ncounter1 0\n'
      );
      expect(metrics.metrics).toContain('# HELP nodejs_version_info');
      metrics = await aggregator.metricsJSON();
      expect(metrics.contentType).toEqual('application/json');
      expect(metrics.metrics).toContainEqual({
        help: 'counter1',
        name: 'counter1',
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      const secondRegistry = new Registry();
      const addedCounter2 = new Counter({
        name: 'counter2',
        help: 'counter2',
        registers: [secondRegistry],
      });
      aggregator.register({ name: 'test', metrics: secondRegistry } as Layer.App.Service);
      expect(typeof (await aggregator.getMetricAsString('counter2'))).toEqual('string');
      expect(typeof (await aggregator.getMetricAsJSON('counter2'))).toEqual('object');
      expect(aggregator.getMetric('counter2') instanceof Counter).toBe(true);
      metrics = await aggregator.metricsText();
      expect(metrics.contentType).toEqual('text/plain; version=0.0.4; charset=utf-8');
      expect(metrics.metrics).toContain(
        '# HELP counter1 counter1\n# TYPE counter1 counter\ncounter1 0\n\n# HELP counter2 counter2\n# TYPE counter2 counter\ncounter2 0\n'
      );
      metrics = await aggregator.metricsJSON();
      expect(metrics.contentType).toEqual('application/json');
      expect(metrics.metrics).toContainEqual({
        help: 'counter1',
        name: 'counter1',
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      expect(metrics.metrics).toContainEqual({
        help: 'counter2',
        name: 'counter2',
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      addedCounter1.inc();
      addedCounter2.inc();
      metrics = await aggregator.metricsJSON();
      expect(metrics.contentType).toEqual('application/json');
      expect(metrics.metrics).toContainEqual({
        help: 'counter1',
        name: 'counter1',
        type: 'counter',
        values: [{ value: 1, labels: {} }],
        aggregator: 'sum',
      });
      expect(metrics.metrics).toContainEqual({
        help: 'counter2',
        name: 'counter2',
        type: 'counter',
        values: [{ value: 1, labels: {} }],
        aggregator: 'sum',
      });
    }, 300);
  });
});
