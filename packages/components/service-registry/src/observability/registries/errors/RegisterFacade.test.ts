/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Health } from '@mdf.js/core';
import { Crash } from '@mdf.js/crash';
import { DebugLogger } from '@mdf.js/logger';
import { undoMocks } from '@mdf.js/utils';
import cluster from 'cluster';
import { ErrorRegistry } from '.';
import { MasterPort, WorkerPort } from './Ports';
import { REGISTER_SERVICE_NAME } from './types';
const logger = new DebugLogger('test');
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';

import { OurComponent } from './test/Error.assets';

const providerNoError = new OurComponent('myNoErrored');
const providerError = new OurComponent('myErrored', new Error('test'));
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Register #Service', () => {
  describe('#Happy path', () => {
    it(`Should return a correct registry service in stand alone mode, this means, with no port`, async () => {
      const service = new ErrorRegistry({
        name: 'registers',
        instanceId: UUID_FAKE,
        logger,
      });
      service.start();
      //@ts-ignore - Test environment
      expect(service.port).toBeUndefined();
      expect(service.router).toBeDefined();
      expect(service.name).toEqual('registers');
      expect(service.links).toEqual({
        registers: '/registers',
      });
      expect(service.lastUpdate).toBeDefined();
      expect(service.size).toEqual(0);
      expect(service.errors).toEqual([]);
      expect(service.status).toEqual(Health.STATUS.PASS);
      expect(service.checks).toEqual({
        [`${REGISTER_SERVICE_NAME}:errors`]: [
          {
            status: Health.STATUS.PASS,
            componentType: 'system',
            observedValue: 0,
            observedUnit: 'errors',
            componentId: UUID_FAKE,
            processId: process.pid,
            time: expect.any(String),
          },
        ],
      });
      let errorEmitted = false;
      service.on('error', error => {
        expect(error).toBeDefined();
        expect(service.size).toEqual(1);
        expect(service.errors).toEqual([
          {
            name: 'Error',
            message: 'test',
            info: undefined,
            uuid: expect.any(String),
            subject: 'myErrored',
            timestamp: expect.any(String),
            trace: expect.any(Array),
          },
        ]);
        expect(service.status).toEqual(Health.STATUS.WARN);
        expect(service.checks).toEqual({
          [`${REGISTER_SERVICE_NAME}:errors`]: [
            {
              componentType: 'system',
              processId: process.pid,
              status: Health.STATUS.WARN,
              observedValue: 1,
              observedUnit: 'errors',
              componentId: UUID_FAKE,
              time: expect.any(String),
            },
          ],
        });
        errorEmitted = true;
      });
      service.register([providerNoError, providerError]);
      expect(service.size).toEqual(1);
      expect(service.status).toEqual(Health.STATUS.WARN);
      expect(service.errors).toEqual([
        {
          name: 'Error',
          message: 'test',
          info: undefined,
          uuid: expect.any(String),
          subject: 'myErrored',
          timestamp: expect.any(String),
          trace: expect.any(Array),
        },
      ]);
      expect(errorEmitted).toBeTruthy();
      service.clear();
      service.removeAllListeners('error');
      for (let index = 0; index < 101; index++) {
        service.push(new Crash('test'));
      }
      expect(service.size).toEqual(100);
      expect(service.status).toEqual(Health.STATUS.WARN);
      expect(service.checks).toEqual({
        [`${REGISTER_SERVICE_NAME}:errors`]: [
          {
            componentType: 'system',
            processId: process.pid,
            status: Health.STATUS.WARN,
            observedValue: 100,
            observedUnit: 'errors',
            componentId: UUID_FAKE,
            time: expect.any(String),
          },
        ],
      });
      service.clear();
      expect(service.size).toEqual(0);
      service.close();
    }, 300);
    it(`Should return a correct registry service in cluster mode`, async () => {
      const service = new ErrorRegistry({
        name: 'registers',
        instanceId: UUID_FAKE,
        isCluster: true,
        maxSize: 100,
      });
      //@ts-ignore - Test environment
      expect(service.port).toBeInstanceOf(MasterPort);
      expect(service.router).toBeDefined();
      expect(service.lastUpdate).toBeDefined();
      expect(service.size).toEqual(0);
      for (let index = 0; index < 101; index++) {
        service.push(new Crash('test'));
      }
      expect(service.size).toEqual(100);
      service.clear();
      expect(service.size).toEqual(0);
      service.start();
      service.stop();
    }, 300);
    it(`Should return a correct registry service in worker mode`, async () => {
      jest.replaceProperty(cluster, 'isPrimary', false);
      const service = new ErrorRegistry({
        name: 'registers',
        instanceId: UUID_FAKE,
        isCluster: true,
        maxSize: 100,
      });
      //@ts-ignore - Test environment
      expect(service.port).toBeInstanceOf(WorkerPort);
      expect(service.router).toBeDefined();
      expect(service.lastUpdate).toBeDefined();
      expect(service.size).toEqual(0);
      for (let index = 0; index < 101; index++) {
        service.push(new Crash('test'));
      }
      expect(service.size).toEqual(100);
      service.clear();
      expect(service.size).toEqual(0);
      service.start();
      service.stop();
      undoMocks();
    }, 300);
    it(`Should include the stack on emitted events from monitored components`, () => {
      const service = new ErrorRegistry({
        name: 'registers',
        instanceId: UUID_FAKE,
        logger,
        includeStack: true,
      });
      service.start();
      let errorEmitted = false;
      service.on('error', error => {
        expect(error).toBeDefined();
        expect(service.size).toEqual(1);
        expect(service.errors).toEqual([
          {
            name: 'Error',
            message: 'test',
            info: undefined,
            uuid: expect.any(String),
            subject: 'myNoErrored',
            timestamp: expect.any(String),
            trace: expect.any(Array),
            stack: expect.any(String),
          },
        ]);
        errorEmitted = true;
      });
      service.register([providerNoError]);
      expect(errorEmitted).toBeFalsy();
      providerNoError.emit('error', new Error('test'));
      expect(errorEmitted).toBeTruthy();
      service.clear();
      service.close();
    });
  });
});
// #endregion
