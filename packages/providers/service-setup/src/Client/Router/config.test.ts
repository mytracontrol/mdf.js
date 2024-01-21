/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import express from 'express';
import request from 'supertest';
import { ConfigManager } from '../ConfigManager';
import { Router } from './config.router';
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const app = express();
const manager = new ConfigManager({
  name: 'test',
  configFiles: ['src/Client/__mocks__/*.*'],
  presetFiles: ['src/Client/__mocks__/presets/*.*'],
  schemaFiles: ['src/Client/__mocks__/schemas/*.*'],
  schema: 'final',
  preset: 'preset1',
  envPrefix: 'MY_PREFIX_A_',
});
const configRouter = new Router(manager);
app.use(configRouter.router);

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Component #service-setup', () => {
  describe('#Happy path', () => {
    it(`Should response 200 and json object with all the presets when a GET request is performed over /config/presets`, done => {
      request(app)
        .get(`/config/presets`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual({
            preset1: {
              config: {
                test: 2,
              },
              otherConfig: {
                otherTest: 'a',
              },
            },
            preset2: {
              config: {
                test: 4,
              },
              otherConfig: {
                otherTest: 'b',
              },
            },
            preset3: {
              config: {
                test: 5,
              },
              otherConfig: {
                otherTest: 'j',
              },
            },
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 200 and json object with all the presets when a GET request is performed over /config/config`, done => {
      request(app)
        .get(`/config/config`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual({
            config: {
              test: 2,
            },
            otherConfig: {
              otherTest: 'a',
            },
          });
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
    it(`Should response 200 and html text when a GET request is performed over /config/readme`, done => {
      request(app)
        .get(`/config/readme`)
        .set('Content-Type', 'html/text')
        .set('Accept', 'html/text')
        .expect('Content-Type', /text/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual({});
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should response 404 when a GET request is performed over /config/unknown`, done => {
      request(app)
        .get(`/config/unknown`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .then(response => {
          expect(response.body).toEqual({});
          done();
        })
        .catch(error => {
          done(error);
        });
    }, 300);
  });
});
// #endregion
