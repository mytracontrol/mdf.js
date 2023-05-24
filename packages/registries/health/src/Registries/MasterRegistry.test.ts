/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Health, Layer } from '@mdf.js/core';
import { mockProperty, undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import { MasterRegistry } from '.';
import { Aggregator } from '../Aggregator';
import { HealthMessageType } from '../types';
// #endregion
// *************************************************************************************************
// #region Create test assets
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const microservice: Layer.App.Metadata = {
  name: 'myMicroservice',
  version: '1',
  release: '1.0.0',
  instanceId: UUID_FAKE,
  description: 'my microservice description',
};
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Health #Registry #Master', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      undoMocks();
    });
    it(`Should return the correct health of the master service`, () => {
      const aggregator = new Aggregator();
      const registry = new MasterRegistry(microservice, aggregator);
      const health = registry.health();
      expect(health).toEqual({
        version: '1',
        release: '1.0.0',
        notes: [],
        output: '',
        name: 'myMicroservice',
        instanceId: UUID_FAKE,
        description: 'my microservice description',
        status: 'pass',
        checks: {
          'myMicroservice:uptime': [
            {
              componentId: (health.checks as Health.Checks)['myMicroservice:uptime'][0].componentId,
              componentType: 'system',
              observedUnit: 'time',
              observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][0]
                .observedValue,
              status: 'pass',
              time: (health.checks as Health.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        },
      });
    }, 300);
    it(`Should include messages from workers nodes in the final serviceStatus object`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createMessage = (id: number) => {
        return {
          type: HealthMessageType.RES,
          requestId: 1,
          checks: {
            'myMicroservice:uptime': [
              {
                componentId: `12345678-1234-1234-1234-1234567${id}`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'pass',
                time: 'tooMuch',
              },
            ],
            'myMicroservice:otherMetric': [
              {
                componentId: `12345678-1234-1234-1234-1234567${id}`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'warn',
                time: 'includedTo',
              },
            ],
          },
        };
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: () => {
            cluster.emit('message', { process: { pid: id }, id }, createMessage(id));
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
        worker2: createWorker(2),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator();
      const registry = new MasterRegistry(microservice, aggregator, 200);
      registry.start();
      setTimeout(() => {
        registry.stop();
        const health = registry.health();
        expect(health).toEqual({
          version: '1',
          release: '1.0.0',
          notes: [],
          output: '',
          instanceId: UUID_FAKE,
          name: 'myMicroservice',
          description: 'my microservice description',
          status: 'warn',
          checks: {
            'system:workers': [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: 'online',
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workers'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: 'online',
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workers'][1].time,
              },
            ],
            'system:workerHealth': [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: 'updated',
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workerHealth'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: 'updated',
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workerHealth'][1].time,
              },
            ],
            'myMicroservice:uptime': [
              {
                componentId: '12345678-1234-1234-1234-12345671',
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'pass',
                time: 'tooMuch',
                workerId: 1,
                workerPid: 1,
              },
              {
                componentId: '12345678-1234-1234-1234-12345672',
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'pass',
                time: 'tooMuch',
                workerId: 2,
                workerPid: 2,
              },
              {
                componentId: registry.componentId,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][2]
                  .observedValue,
                status: 'pass',
                time: (health.checks as Health.Checks)['myMicroservice:uptime'][2].time,
              },
            ],
            'myMicroservice:otherMetric': [
              {
                componentId: `12345678-1234-1234-1234-12345671`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'warn',
                time: 'includedTo',
                workerId: 1,
                workerPid: 1,
              },
              {
                componentId: `12345678-1234-1234-1234-12345672`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'warn',
                time: 'includedTo',
                workerId: 2,
                workerPid: 2,
              },
            ],
          },
        });
        registry.stop();
        done();
      }, 185);
    }, 300);
    it(`Should not include messages from workers nodes with different requestId`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createMessage = (id: number) => {
        return {
          type: HealthMessageType.RES,
          requestId: id,
          checks: {
            'myMicroservice:uptime': [
              {
                componentId: `12345678-1234-1234-1234-1234567${id}`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'pass',
                time: 'tooMuch',
              },
            ],
            'myMicroservice:otherMetric': [
              {
                componentId: `12345678-1234-1234-1234-1234567${id}`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'warn',
                time: 'includedTo',
              },
            ],
          },
        };
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: () => {
            cluster.emit('message', { process: { pid: id }, id }, createMessage(id));
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
        worker2: createWorker(2),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator();
      const registry = new MasterRegistry(microservice, aggregator, 200);
      registry.start();
      setTimeout(() => {
        const health = registry.health();
        expect(health).toEqual({
          version: '1',
          release: '1.0.0',
          notes: [],
          output: '',
          instanceId: UUID_FAKE,
          name: 'myMicroservice',
          description: 'my microservice description',
          status: 'fail',
          checks: {
            'system:workers': [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: 'online',
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workers'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: 'online',
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workers'][1].time,
              },
            ],
            'system:workerHealth': [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: 'updated',
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workerHealth'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'fail',
                observedValue: 'outdated',
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workerHealth'][1].time,
              },
            ],
            'myMicroservice:uptime': [
              {
                componentId: '12345678-1234-1234-1234-12345671',
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'pass',
                time: 'tooMuch',
                workerId: 1,
                workerPid: 1,
              },
              {
                componentId: registry.componentId,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][1]
                  .observedValue,
                status: 'pass',
                time: (health.checks as Health.Checks)['myMicroservice:uptime'][1].time,
              },
            ],
            'myMicroservice:otherMetric': [
              {
                componentId: `12345678-1234-1234-1234-12345671`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'warn',
                time: 'includedTo',
                workerId: 1,
                workerPid: 1,
              },
            ],
          },
        });
        registry.stop();
        done();
      }, 185);
    }, 300);
    it(`Should not include messages from workers nodes with incorrect message type`, done => {
      const workerBase = {
        kill: () => {
          return;
        },
        isConnected: () => true,
      };
      const createMessage = (id: number) => {
        return {
          type: 'anyOther',
          requestId: 1,
          checks: {
            'myMicroservice:uptime': [
              {
                componentId: `12345678-1234-1234-1234-1234567${id}`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'pass',
                time: 'tooMuch',
              },
            ],
            'myMicroservice:otherMetric': [
              {
                componentId: `12345678-1234-1234-1234-1234567${id}`,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: 'okey',
                status: 'fail',
                time: 'includedTo',
              },
            ],
          },
        };
      };
      const createWorker = (id: number) => {
        return {
          process: { pid: id },
          id,
          ...workerBase,
          send: () => {
            cluster.emit('message', { process: { pid: id }, id }, createMessage(id));
          },
        };
      };
      const workers = {
        worker1: createWorker(1),
        worker2: createWorker(2),
      };
      //@ts-ignore Test environment
      mockProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator();
      const registry = new MasterRegistry(microservice, aggregator, 200);
      registry.start();
      setTimeout(() => {
        registry.stop();
        const health = registry.health();
        expect(health).toEqual({
          version: '1',
          release: '1.0.0',
          notes: [],
          output: '',
          instanceId: UUID_FAKE,
          name: 'myMicroservice',
          description: 'my microservice description',
          status: 'fail',
          checks: {
            'system:workers': [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: 'online',
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workers'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: 'online',
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workers'][1].time,
              },
            ],
            'system:workerHealth': [
              {
                componentId: '1',
                componentType: 'process',
                status: 'fail',
                observedValue: 'outdated',
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workerHealth'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'fail',
                observedValue: 'outdated',
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workerHealth'][1].time,
              },
            ],
            'myMicroservice:uptime': [
              {
                componentId: registry.componentId,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][0]
                  .observedValue,
                status: 'pass',
                time: (health.checks as Health.Checks)['myMicroservice:uptime'][0].time,
              },
            ],
          },
        });
        registry.stop();
        done();
      }, 185);
    }, 300);
  });
});
// #endregion
