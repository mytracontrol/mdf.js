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
import { undoMocks } from '@mdf/utils';
import { StandaloneRegistry } from '.';
import { Aggregator } from '../Aggregator';
import { OurProvider } from '../test/Health.assets';
import { ServiceMetadata } from '../types';
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
describe('#Health #Registry #Standalone', () => {
  describe('#Happy path', () => {
    afterEach(function () {
      undoMocks();
    });
    it(`Should return the correct health of the standalone service`, () => {
      const aggregator = new Aggregator();
      aggregator.register([providerPass, providerWarn, providerFail]);
      const registry = new StandaloneRegistry(microservice, aggregator);
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
  });
});
// #endregion
