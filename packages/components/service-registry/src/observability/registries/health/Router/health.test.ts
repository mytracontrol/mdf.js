/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Layer } from '@mdf.js/core';
import { DebugLogger } from '@mdf.js/logger';
import express from 'express';
import request from 'supertest';
import { Aggregator } from '../Aggregator';
import { OurProvider } from '../test/Health.assets';
import { Router } from './health.router';
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const app = express();
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
const microservice: Layer.App.Metadata = {
  name: 'myMicroservice',
  version: '1',
  release: '1.0.0',
  instanceId: UUID_FAKE,
  description: 'my microservice description',
  links: {
    about: 'http://mymicroservice.com',
  },
};

const providerPass = new OurProvider('myPassed', 'pass');
const providerWarn = new OurProvider('myWarned', 'warn');
const providerFail = new OurProvider('myFailed', 'fail');

const providerAggregator = new Aggregator(microservice, new DebugLogger(`health`));
providerAggregator.register([providerPass, providerWarn, providerFail]);
const healthRoute = new Router(providerAggregator);

app.use(healthRoute.router);

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Component #health', () => {
  describe('#Happy path', () => {
    it(`Should response 200 and array of provider status when a GET request is performed over /health`, done => {
      request(app)
        .get(`/health`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body.links).toEqual({
            about: 'http://mymicroservice.com',
          });
          expect(response.body.status).toEqual('fail');
          expect(response.body.version).toEqual(microservice.version);
          expect(response.body.release).toEqual(microservice.release);
          expect(response.body.notes).toEqual([]);
          expect(response.body.output).toEqual(undefined);
          expect(response.body.instanceId).toEqual(microservice.instanceId);
          expect(response.body.checks['myWarned:warn']).toEqual([
            {
              componentId: providerWarn.componentId,
              componentType: 'component',
              observedValue: 'warn',
              output: undefined,
              status: 'warn',
              time: providerWarn.actualStateDate,
            },
          ]);
          expect(response.body.checks['myPassed:pass']).toEqual([
            {
              componentId: providerPass.componentId,
              componentType: 'component',
              observedValue: 'pass',
              output: undefined,
              status: 'pass',
              time: providerPass.actualStateDate,
            },
          ]);
          expect(response.body.checks['myFailed:fail']).toEqual([
            {
              componentId: providerFail.componentId,
              componentType: 'component',
              observedValue: 'fail',
              output: undefined,
              status: 'fail',
              time: providerFail.actualStateDate,
            },
          ]);
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
  });
});
// #endregion
