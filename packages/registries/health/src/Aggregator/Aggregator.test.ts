/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import { v4 } from 'uuid';
import { Aggregator } from '.';
import { OurProvider } from '../test/Health.assets';

const providerPass = new OurProvider('myFailedPassed', 'pass');
const providerWarn = new OurProvider('myFailedWarned', 'warn');
const providerFail = new OurProvider('myFailedProvider', 'fail');

describe('#Health #Aggregator', () => {
  describe('#Happy path', () => {
    it('Status getter should return the aggregate status in the correct way WITHOUT external checks', () => {
      const aggregator = new Aggregator();
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
      const aggregator = new Aggregator();
      aggregator.register(providerPass);
      expect(aggregator.status).toEqual('pass');
      expect(
        aggregator.addCheck('myComponent', 'myMeasure', {
          status: 'pass',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('pass');
      expect(
        aggregator.addCheck('myComponent', 'myMeasure', {
          status: 'warn',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('warn');
      expect(
        aggregator.addCheck('myComponent', 'myMeasure', {
          status: 'fail',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('fail');
      expect(
        aggregator.addCheck('myComponent', 'myMeasure', {
          status: 'pass',
          componentId: 'myComponent',
        })
      ).toBeTruthy();
      expect(aggregator.status).toEqual('pass');
      expect(
        aggregator.addCheck('myComponent', 'myMeasure', {
          //@ts-ignore - Test environment
          status: 'mass',
          componentId: 'myComponent',
        })
      ).toBeFalsy();
      expect(aggregator.status).toEqual('pass');
    }, 300);
    it(`Should notify a status change when one of the provider change the status and this change the overall status`, done => {
      const aggregator = new Aggregator();
      aggregator.register([providerPass, providerWarn]);
      aggregator.on('status', state => {
        expect(state).toEqual('warn');
        done();
      });
      providerPass.emit('status', 'pass');
    }, 300);
    it('Should notify an error change when one of the provider emit an error', done => {
      const aggregator = new Aggregator();
      aggregator.register([providerPass, providerWarn]);
      aggregator.on('error', error => {
        expect(error.message).toEqual('fake');
        done();
      });
      providerPass.emit('error', new Crash('fake', v4()), 'myProvider');
    }, 300);
  });
});
// #endregion
