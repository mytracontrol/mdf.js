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
import { SettingsManager } from '..';
import { CONFIG_SERVICE_NAME } from '../types';
import { Router } from './config.router';
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const app = express();
const manager = new SettingsManager(
  {
    loadPackage: true,
    loadReadme: true,
  },
  {
    configLoaderOptions: {
      configFiles: [`${__dirname}/../../__mocks__/*.*`],
      presetFiles: [`${__dirname}/../../__mocks__/presets/*.*`],
      schemaFiles: [`${__dirname}/../../__mocks__/schemas/*.*`],
      schema: 'final',
      preset: 'preset1',
      envPrefix: 'MY_PREFIX_A_',
    },
  },
  {}
);
const configRouter = new Router(manager);
app.use(configRouter.router);

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Component #service-setup', () => {
  describe('#Happy path', () => {
    it(`Should response 200 and json object with all the presets when a GET request is performed over /${CONFIG_SERVICE_NAME}/presets`, done => {
      request(app)
        .get(`/${CONFIG_SERVICE_NAME}/presets`)
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
    it(`Should response 200 and json object with all the presets when a GET request is performed over /${CONFIG_SERVICE_NAME}/config`, done => {
      request(app)
        .get(`/${CONFIG_SERVICE_NAME}/config`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(response.body).toEqual({
            metadata: {
              name: '@mdf.js/service-registry',
              description: 'MMS - API - Service Registry',
              instanceId: expect.any(String),
              release: '0.0.1',
              version: '0',
              tags: ['NodeJS', 'MMS', 'API', 'APP'],
            },
            loggerOptions: {
              console: {
                enabled: true,
                level: 'info',
              },
              file: {
                enabled: false,
                level: 'info',
              },
            },
            observabilityOptions: {
              clusterUpdateInterval: 10000,
              host: 'localhost',
              includeStack: false,
              isCluster: false,
              maxSize: 100,
              primaryPort: 9081,
            },
            retryOptions: {
              attempts: 3,
              maxWaitTime: 10000,
              timeout: 5000,
              waitTime: 1000,
            },
            config: {
              test: 2,
            },
            configLoaderOptions: {
              configFiles: [expect.stringContaining('/../../__mocks__/*.*')],
              presetFiles: [expect.stringContaining('/../../__mocks__/presets/*.*')],
              schemaFiles: [expect.stringContaining('/../../__mocks__/schemas/*.*')],
              schema: 'final',
              preset: 'preset1',
              envPrefix: 'MY_PREFIX_A_',
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
    it(`Should response 200 and html text when a GET request is performed over /${CONFIG_SERVICE_NAME}/readme`, done => {
      request(app)
        .get(`/${CONFIG_SERVICE_NAME}/readme`)
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
    it(`Should response 404 when a GET request is performed over /${CONFIG_SERVICE_NAME}/unknown`, done => {
      request(app)
        .get(`/${CONFIG_SERVICE_NAME}/unknown`)
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
