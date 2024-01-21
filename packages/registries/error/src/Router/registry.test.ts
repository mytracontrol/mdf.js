/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { Middleware } from '@mdf.js/middlewares';
import express from 'express';
import request from 'supertest';
import { StandaloneRegistry } from '../Registries';
// #endregion
// ************************************************************************************************
// #region Component imports
import { Router } from './registry.router';
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const app = express();
const persistence = new StandaloneRegistry();
const router = new Router(persistence);
app.use(Middleware.RequestId.handler());
app.use(Middleware.BodyParser.JSONParserHandler());
app.use(router.router);
app.use(Middleware.ErrorHandler.handler());
const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';
// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Component #Register', () => {
  describe('#Happy path', () => {
    it(`Should response 204 and an empty response when a GET request is performed over /registers and there aren't data`, () => {
      return request(app)
        .get(`/registers`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(204)
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 200 and an the last conflicts when a GET request is performed over /registers`, () => {
      const myError = new Crash('my error', UUID_FAKE, { cause: new Crash(`my other error`) });
      persistence.push(myError);
      return request(app)
        .get(`/registers`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(typeof response.body).toEqual('object');
          expect(Array.isArray(response.body)).toBeTruthy();
          expect(response.body.length).toEqual(1);
          expect(response.body[0]).toEqual(myError.toJSON());
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 200 and an the last conflicts when a GET request is performed over /registers if the error has circular references`, () => {
      const test: Record<string, any> = { test: 'test' };
      test['otherTest'] = test;
      const ownError = new Crash(`myMessage`, UUID_FAKE, {
        name: 'myError',
        cause: new Crash(`other error`),
        info: { test },
      });
      persistence.push(ownError);
      return request(app)
        .get(`/registers`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(typeof response.body).toEqual('object');
          expect(Array.isArray(response.body)).toBeTruthy();
          expect(response.body.length).toEqual(2);
          expect(response.body).toEqual([
            {
              name: 'CrashError',
              message: 'my error',
              uuid: 'a1e4e76a-8e1a-425c-883d-4d75760f9cee',
              timestamp: response.body[0].timestamp,
              subject: 'common',
              trace: ['CrashError: my error', 'caused by CrashError: my other error'],
            },
            {
              name: 'myError',
              message: 'myMessage',
              uuid: 'a1e4e76a-8e1a-425c-883d-4d75760f9cee',
              timestamp: response.body[1].timestamp,
              subject: 'common',
              info: {
                test: {
                  test: 'test',
                  otherTest: {
                    $ref: '$[\'1\']["info"]["test"]',
                  },
                },
              },
              trace: ['myError: myMessage', 'caused by CrashError: other error'],
            },
          ]);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
