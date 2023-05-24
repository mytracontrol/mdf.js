/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Health, Layer } from '@mdf.js/core';
import { undoMocks } from '@mdf.js/utils';
import { StandaloneRegistry } from '.';
import { Aggregator } from '../Aggregator';
import { OurProvider } from '../test/Health.assets';
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
        release: '1.0.0',
        notes: [],
        output: '',
        name: 'myMicroservice',
        instanceId: UUID_FAKE,
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
  });
});
// #endregion
