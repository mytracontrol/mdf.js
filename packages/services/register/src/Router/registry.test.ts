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
      const myError = new Crash('my error', { cause: new Crash(`my other error`) });
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
  });
});
// #endregion
