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
import { Health } from '@mdf/core';
import { mockProperty, undoMocks } from '@mdf/utils';
import cluster from 'cluster';
import { Service } from '.';
import { MasterRegistry, StandaloneRegistry, WorkerRegistry } from './Registries';
import { OurProvider } from './test/Health.assets';
import { ServiceMetadata } from './types';
// #endregion
// *************************************************************************************************
// #region Create test assets
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const microservice: ServiceMetadata = {
  name: 'myMicroservice',
  version: '1',
  release: '1.0.0',
  processId: UUID_FAKE,
  description: 'my microservice description',
};

const providerPass = new OurProvider('myPassed', 'pass');
const providerWarn = new OurProvider('myWarned', 'warn');
const providerFail = new OurProvider('myFailed', 'fail');
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Health #Service', () => {
  describe('#Happy path', () => {
    it(`Should return a correct health service in stand alone mode`, () => {
      const service = Service.create(microservice);
      //@ts-ignore - Test environment
      expect(service.registry).toBeInstanceOf(StandaloneRegistry);
      expect(service.name).toEqual('health');
      expect(service.links).toEqual({
        health: '/health',
      });
      service.register([providerPass, providerWarn, providerFail]);
      service.start();
      expect(service.router).toBeDefined();
      expect(service.status).toEqual('fail');
      const health = service.health;
      expect(health).toEqual({
        version: '1',
        releaseId: '1.0.0',
        notes: [],
        output: '',
        serviceId: UUID_FAKE,
        description: 'my microservice description',
        links: undefined,
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
              componentId: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .componentId,
              componentType: 'system',
              observedUnit: 'time',
              observedValue: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .observedValue,
              status: 'pass',
              time: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        },
      });
      service.stop();
    }, 300);
    it(`Should return a correct health service in worker mode`, () => {
      //@ts-ignore Test environment
      mockProperty(cluster, 'isPrimary', false);
      const service = Service.create(microservice, true);
      //@ts-ignore - Test environment
      expect(service.registry).toBeInstanceOf(WorkerRegistry);
      service.register([providerPass, providerWarn, providerFail]);
      service.start();
      expect(service.router).toBeDefined();
      expect(service.status).toEqual('fail');
      const health = service.health;
      expect(health).toEqual({
        version: '1',
        releaseId: '1.0.0',
        notes: [],
        output: '',
        serviceId: UUID_FAKE,
        description: 'my microservice description',
        links: undefined,
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
              componentId: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .componentId,
              componentType: 'system',
              observedUnit: 'time',
              observedValue: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .observedValue,
              status: 'pass',
              time: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        },
      });
      service.stop();
      undoMocks();
    }, 300);
    it(`Should return a correct health service in master mode`, () => {
      const service = Service.create(microservice, true);
      //@ts-ignore - Test environment
      expect(service.registry).toBeInstanceOf(MasterRegistry);
      service.start();
      expect(service.router).toBeDefined();
      expect(service.status).toEqual('pass');
      const health = service.health;
      expect(health).toEqual({
        version: '1',
        releaseId: '1.0.0',
        notes: [],
        output: '',
        serviceId: UUID_FAKE,
        description: 'my microservice description',
        links: undefined,
        status: 'pass',
        checks: {
          'myMicroservice:uptime': [
            {
              componentId: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .componentId,
              componentType: 'system',
              observedUnit: 'time',
              observedValue: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .observedValue,
              status: 'pass',
              time: (health.checks as Health.API.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        },
      });
      expect(
        service.addCheck('myComponent', 'myMeasure', { componentId: 'a', status: 'fail' })
      ).toBeTruthy();
      expect(service.status).toEqual('fail');
      service.stop();
    }, 300);
    it(`Should emit an error if underlayer component emit an error`, done => {
      const service = Service.create(microservice);
      service.register([providerPass, providerWarn, providerFail]);
      service.on('error', error => {
        expect(error.message).toEqual('myError');
        done();
      });
      providerPass.emit('error', new Error('myError'));
    }, 300);
  });
});
// #endregion
