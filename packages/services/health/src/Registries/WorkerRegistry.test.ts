/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Health } from '@mdf.js/core';
import { undoMocks } from '@mdf.js/utils';
import { WorkerRegistry } from '.';
import { Aggregator } from '../Aggregator';
import { OurProvider } from '../test/Health.assets';
import { HealthMessage, HealthMessageType, ServiceMetadata } from '../types';
// #endregion
// *************************************************************************************************
// #region Create test assets
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const microservice: ServiceMetadata = {
  name: 'myMicroservice',
  version: '1',
  release: '1.0.0',
  instanceId: UUID_FAKE,
  description: 'my microservice description',
};

const providerPass = new OurProvider('myPassed', 'pass');
const providerWarn = new OurProvider('myWarned', 'warn');
const providerFail = new OurProvider('myFailed', 'fail');

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Health #Registry #Worker', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      undoMocks();
    });
    it(`Should return the correct health of the worker service`, () => {
      const aggregator = new Aggregator();
      aggregator.register([providerPass, providerWarn, providerFail]);
      const registry = new WorkerRegistry(microservice, aggregator);
      const health = registry.health();
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
    }, 300);
    it(`Should respond to messages than come from master node`, done => {
      const aggregator = new Aggregator();
      aggregator.register([providerPass, providerWarn, providerFail]);
      const registry = new WorkerRegistry(microservice, aggregator);
      const mockSend = (message: HealthMessage): boolean => {
        expect(message.checks).toEqual({
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
              componentId: (message.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .componentId,
              componentType: 'system',
              observedUnit: 'time',
              observedValue: (message.checks as Health.API.Checks)['myMicroservice:uptime'][0]
                .observedValue,
              status: 'pass',
              time: (message.checks as Health.API.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        });
        expect(message.requestId).toEqual(1);
        expect(message.type).toEqual(HealthMessageType.RES);
        process.send = undefined;
        done();
        return true;
      };
      jest.spyOn(process, 'send').mockImplementation(mockSend);
      process.emit(
        'message',
        {
          type: HealthMessageType.REQ,
          requestId: 1,
        },
        {}
      );
    }, 300);
  });
});
// #endregion
