/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Layer } from '@mdf.js/core';
import { DebugLogger } from '@mdf.js/logger';
import { Aggregator } from '.';
import { OurProvider } from '../test/Health.assets';

const providerPass = new OurProvider('myFailedPassed', 'pass');
const providerWarn = new OurProvider('myFailedWarned', 'warn');
const providerFail = new OurProvider('myFailedProvider', 'fail');

const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const microservice: Layer.App.Metadata = {
  name: 'myMicroservice',
  version: '1',
  release: '1.0.0',
  instanceId: UUID_FAKE,
  description: 'my microservice description',
};

const logger = new DebugLogger('test');

describe('#Health #Aggregator', () => {
  describe('#Happy path', () => {
    it('Status getter should return the aggregate status in the correct way WITHOUT external checks', () => {
      const aggregator = new Aggregator(microservice, logger);
      aggregator.register(providerPass);
      expect(aggregator.status).toEqual('pass');
      aggregator.register(providerWarn);
      expect(aggregator.status).toEqual('warn');
      aggregator.register(providerFail);
      expect(aggregator.status).toEqual('fail');
      aggregator.register([providerPass, providerWarn]);
      expect(aggregator.status).toEqual('fail');
    }, 300);
    it('Status getter should return the aggregate status in the correct way WITH external checks', () => {
      const aggregator = new Aggregator(microservice, logger);
      aggregator.register(providerPass);
      expect(aggregator.status).toEqual('pass');
      expect(
        aggregator.addExternalCheck('myComponent', 'myMeasure', {
          status: 'pass',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('pass');
      expect(
        aggregator.addExternalCheck('myComponent', 'myMeasure', {
          status: 'warn',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('warn');
      expect(
        aggregator.addExternalCheck('myComponent', 'myMeasure', {
          status: 'fail',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('fail');
      expect(
        aggregator.addExternalCheck('myComponent', 'myMeasure', {
          status: 'pass',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('pass');
      expect(
        aggregator.addExternalCheck('myComponent', 'myMeasure', {
          //@ts-ignore - Test environment
          status: 'mass',
          componentId: 'myComponent',
        })
      ).toBeFalsy();
      expect(aggregator.status).toEqual('pass');
    }, 300);
    it(`Should notify a status change when one of the provider change the status and this change the overall status`, done => {
      const aggregator = new Aggregator(microservice, logger);
      aggregator.register([providerPass, providerWarn]);
      aggregator.on('status', state => {
        expect(state).toEqual('warn');
        done();
      });
      providerPass.emit('status', 'pass');
    }, 300);
  });
});
// #endregion
