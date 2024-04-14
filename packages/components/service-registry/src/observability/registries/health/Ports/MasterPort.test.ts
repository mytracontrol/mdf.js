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
import cluster from 'cluster';
import { MasterPort } from '.';
import { Aggregator } from '../Aggregator';
import {
  HealthMessageType,
  SYSTEM_WORKER as SYSTEM_WORKERS,
  SYSTEM_WORKER_HEALTH,
  WORKER_CONNECTION_STATE,
  WORKER_STATUS,
} from '../types';
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
const logger = new DebugLogger('test');
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Health #Port #Master', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
    it(`Should return the correct health of the master service`, () => {
      const aggregator = new Aggregator(microservice, logger);
      new MasterPort(aggregator, logger);
      const health = aggregator.health;
      expect(health).toEqual({
        version: '1',
        release: '1.0.0',
        notes: [],
        output: undefined,
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
              processId: process.pid,
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
      jest.replaceProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(microservice, logger);
      const port = new MasterPort(aggregator, logger, 200);
      port.start();
      setTimeout(() => {
        port.stop();
        const health = aggregator.health;
        expect(health).toEqual({
          version: '1',
          release: '1.0.0',
          notes: [],
          output: undefined,
          instanceId: UUID_FAKE,
          name: 'myMicroservice',
          description: 'my microservice description',
          status: 'warn',
          checks: {
            [`${SYSTEM_WORKERS}`]: [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_CONNECTION_STATE.CONNECTED,
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)['system:workers'][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_CONNECTION_STATE.CONNECTED,
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)['system:workers'][1].time,
              },
            ],
            [`${SYSTEM_WORKER_HEALTH}`]: [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_STATUS.UPDATED,
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKER_HEALTH}`][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_STATUS.UPDATED,
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKER_HEALTH}`][1].time,
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
                componentId: microservice.instanceId,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][2]
                  .observedValue,
                processId: process.pid,
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
        port.stop();
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
      jest.replaceProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(microservice, logger);
      const port = new MasterPort(aggregator, logger, 200);
      port.start();
      setTimeout(() => {
        const health = aggregator.health;
        expect(health).toEqual({
          version: '1',
          release: '1.0.0',
          notes: [],
          output: undefined,
          instanceId: UUID_FAKE,
          name: 'myMicroservice',
          description: 'my microservice description',
          status: 'fail',
          checks: {
            [`${SYSTEM_WORKERS}`]: [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_CONNECTION_STATE.CONNECTED,
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKERS}`][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_CONNECTION_STATE.CONNECTED,
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKERS}`][1].time,
              },
            ],
            [`${SYSTEM_WORKER_HEALTH}`]: [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_STATUS.UPDATED,
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKER_HEALTH}`][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'fail',
                observedValue: WORKER_STATUS.OUTDATED,
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKER_HEALTH}`][1].time,
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
                componentId: microservice.instanceId,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][1]
                  .observedValue,
                processId: process.pid,
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
        port.stop();
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
      jest.replaceProperty(cluster, 'workers', workers);
      const aggregator = new Aggregator(microservice, logger);
      const port = new MasterPort(aggregator, logger, 200);
      port.start();
      setTimeout(() => {
        port.stop();
        const health = aggregator.health;
        expect(health).toEqual({
          version: '1',
          release: '1.0.0',
          notes: [],
          output: undefined,
          instanceId: UUID_FAKE,
          name: 'myMicroservice',
          description: 'my microservice description',
          status: 'fail',
          checks: {
            [`${SYSTEM_WORKERS}`]: [
              {
                componentId: '1',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_CONNECTION_STATE.CONNECTED,
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKERS}`][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'pass',
                observedValue: WORKER_CONNECTION_STATE.CONNECTED,
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKERS}`][1].time,
              },
            ],
            [`${SYSTEM_WORKER_HEALTH}`]: [
              {
                componentId: '1',
                componentType: 'process',
                status: 'fail',
                observedValue: WORKER_STATUS.OUTDATED,
                observedUnit: 'status',
                workerId: 1,
                workerPid: 1,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKER_HEALTH}`][0].time,
              },
              {
                componentId: '2',
                componentType: 'process',
                status: 'fail',
                observedValue: WORKER_STATUS.OUTDATED,
                observedUnit: 'status',
                workerId: 2,
                workerPid: 2,
                time: (health.checks as Health.Checks)[`${SYSTEM_WORKER_HEALTH}`][1].time,
              },
            ],
            'myMicroservice:uptime': [
              {
                componentId: microservice.instanceId,
                componentType: 'system',
                observedUnit: 'time',
                observedValue: (health.checks as Health.Checks)['myMicroservice:uptime'][0]
                  .observedValue,
                processId: process.pid,
                status: 'pass',
                time: (health.checks as Health.Checks)['myMicroservice:uptime'][0].time,
              },
            ],
          },
        });
        port.stop();
        done();
      }, 185);
    }, 300);
  });
});
// #endregion
