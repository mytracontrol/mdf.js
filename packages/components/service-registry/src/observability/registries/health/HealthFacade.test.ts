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
import { HealthRegistry } from '.';
import { MasterPort, WorkerPort } from './Ports';
import { OurProvider } from './test/Health.assets';
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

const providerPass = new OurProvider('myPassed', 'pass');
const providerWarn = new OurProvider('myWarned', 'warn');
const providerFail = new OurProvider('myFailed', 'fail');

const logger = new DebugLogger('test');
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Health #Registry', () => {
  describe('#Happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      jest.resetAllMocks();
    });
    it(`Should return a correct health service in stand alone mode, this means without port`, done => {
      const service = new HealthRegistry({
        applicationMetadata: microservice,
        logger,
      });
      service.on('status', status => {
        expect(status).toEqual('fail');
        service.close();
        done();
      });
      //@ts-ignore - Test environment
      expect(service.port).toBeUndefined();
      expect(service.name).toEqual('myMicroservice');
      expect(service.links).toEqual({
        health: '/health',
      });
      service.register([providerPass, providerWarn, providerFail]);
      service.start();
      expect(service.router).toBeDefined();
      expect(service.status).toEqual('fail');
      service.addNote(`This is a note`);
      const health = service.health;
      const checks = service.checks;
      expect(checks).toBeDefined();
      expect(health).toEqual({
        version: '1',
        release: '1.0.0',
        notes: expect.arrayContaining([expect.stringMatching(/.*This is a note.*/)]),
        output: undefined,
        name: 'myMicroservice',
        instanceId: UUID_FAKE,
        description: 'my microservice description',
        status: 'fail',
        checks: {
          'myPassed:pass': [
            {
              componentId: providerPass.componentId,
              componentType: 'component',
              observedValue: 'pass',
              output: undefined,
              status: 'pass',
              time: providerPass.actualStateDate,
            },
          ],
          'myWarned:warn': [
            {
              componentId: providerWarn.componentId,
              componentType: 'component',
              observedValue: 'warn',
              output: undefined,
              status: 'warn',
              time: providerWarn.actualStateDate,
            },
          ],
          'myFailed:fail': [
            {
              componentId: providerFail.componentId,
              componentType: 'component',
              observedValue: 'fail',
              output: undefined,
              status: 'fail',
              time: providerFail.actualStateDate,
            },
          ],
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
      providerPass.emit('status', 'pass');
    }, 300);
    it(`Should return a correct health service in worker mode`, () => {
      jest.replaceProperty(cluster, 'isPrimary', false);
      const service = new HealthRegistry({
        applicationMetadata: microservice,
        logger,
        isCluster: true,
      });
      //@ts-ignore - Test environment
      expect(service.port).toBeInstanceOf(WorkerPort);
      service.register([providerPass, providerWarn, providerFail]);
      service.start();
      expect(service.router).toBeDefined();
      expect(service.status).toEqual('fail');
      for (let i = 0; i < 21; i++) {
        service.addNote(`This is a note ${i}`);
      }
      const health = service.health;
      expect(health).toEqual({
        version: '1',
        release: '1.0.0',
        notes: expect.arrayContaining([
          expect.stringMatching(/.*This is a note 1.*/),
          expect.stringMatching(/.*This is a note 2.*/),
          expect.stringMatching(/.*This is a note 3.*/),
          expect.stringMatching(/.*This is a note 4.*/),
          expect.stringMatching(/.*This is a note 5.*/),
          expect.stringMatching(/.*This is a note 6.*/),
          expect.stringMatching(/.*This is a note 7.*/),
          expect.stringMatching(/.*This is a note 8.*/),
          expect.stringMatching(/.*This is a note 9.*/),
          expect.stringMatching(/.*This is a note 10.*/),
          expect.stringMatching(/.*This is a note 11.*/),
          expect.stringMatching(/.*This is a note 12.*/),
          expect.stringMatching(/.*This is a note 13.*/),
          expect.stringMatching(/.*This is a note 14.*/),
          expect.stringMatching(/.*This is a note 15.*/),
          expect.stringMatching(/.*This is a note 16.*/),
          expect.stringMatching(/.*This is a note 17.*/),
          expect.stringMatching(/.*This is a note 18.*/),
          expect.stringMatching(/.*This is a note 19.*/),
          expect.stringMatching(/.*This is a note 20.*/),
        ]),
        output: undefined,
        instanceId: UUID_FAKE,
        name: 'myMicroservice',
        description: 'my microservice description',
        status: 'fail',
        checks: {
          'myPassed:pass': [
            {
              componentId: providerPass.componentId,
              componentType: 'component',
              observedValue: 'pass',
              output: undefined,
              status: 'pass',
              time: providerPass.actualStateDate,
            },
          ],
          'myWarned:warn': [
            {
              componentId: providerWarn.componentId,
              componentType: 'component',
              observedValue: 'warn',
              output: undefined,
              status: 'warn',
              time: providerWarn.actualStateDate,
            },
          ],
          'myFailed:fail': [
            {
              componentId: providerFail.componentId,
              componentType: 'component',
              observedValue: 'fail',
              output: undefined,
              status: 'fail',
              time: providerFail.actualStateDate,
            },
          ],
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
      service.stop();
    }, 300);
    it(`Should return a correct health service in master mode`, () => {
      const service = new HealthRegistry({
        applicationMetadata: microservice,
        logger,
        isCluster: true,
      });
      //@ts-ignore - Test environment
      expect(service.port).toBeInstanceOf(MasterPort);
      service.start();
      expect(service.router).toBeDefined();
      expect(service.status).toEqual('pass');
      const health = service.health;
      expect(health).toEqual({
        version: '1',
        release: '1.0.0',
        notes: [],
        output: undefined,
        instanceId: UUID_FAKE,
        name: 'myMicroservice',
        description: 'my microservice description',
        status: 'pass',
        checks: {
          'system:workers': [],
          'system:workersHealth': [],
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
      expect(
        service.addCheck('myComponent', 'myMeasure', { componentId: 'a', status: 'fail' })
      ).toBeTruthy();
      expect(service.status).toEqual('fail');
      service.close();
    }, 300);
  });
});
// #endregion
