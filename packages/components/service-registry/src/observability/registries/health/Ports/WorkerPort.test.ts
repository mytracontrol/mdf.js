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
import { WorkerPort } from '.';
import { Aggregator } from '../Aggregator';
import { OurProvider } from '../test/Health.assets';
import { HealthMessage, HealthMessageType } from '../types';
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
describe('#Health #Port #Worker', () => {
  describe('#Happy path', () => {
    it(`Should return the correct health of the worker service`, () => {
      const aggregator = new Aggregator(microservice, logger);
      aggregator.register([providerPass, providerWarn, providerFail]);
      new WorkerPort(aggregator, logger);
      const health = aggregator.health;
      expect(health).toEqual({
        version: '1',
        release: '1.0.0',
        notes: [],
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
              status: 'pass',
              processId: process.pid,
              time: (health.checks as Health.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        },
      });
    }, 300);
    it(`Should respond to messages than come from master node`, done => {
      const aggregator = new Aggregator(microservice, logger);
      aggregator.register([providerPass, providerWarn, providerFail]);
      const port = new WorkerPort(aggregator, logger);
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
              componentId: (message.checks as Health.Checks)['myMicroservice:uptime'][0]
                .componentId,
              componentType: 'system',
              observedUnit: 'time',
              observedValue: (message.checks as Health.Checks)['myMicroservice:uptime'][0]
                .observedValue,
              processId: process.pid,
              status: 'pass',
              time: (message.checks as Health.Checks)['myMicroservice:uptime'][0].time,
            },
          ],
        });
        expect(message.requestId).toEqual(1);
        expect(message.type).toEqual(HealthMessageType.RES);
        process.send = undefined;
        port.stop();
        done();
        return true;
      };
      jest.spyOn(process, 'send').mockImplementation(mockSend);
      port.start();
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
