/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */

// *************************************************************************************************
// #region Build my own Express app for testing, including the mandatory middleware
import logger from '@mdf/logger';
import express from 'express';
import request from 'supertest';
import { Middleware } from '..';

logger.setConfig('myLogger', { console: { enabled: true } });

const app = express();
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
app.use(Middleware.BodyParser.JSONParserHandler());
app.use(Middleware.BodyParser.TextParserHandler());
app.use(Middleware.BodyParser.RawParserHandler());
app.use(Middleware.BodyParser.URLEncodedParserHandler());
app.use(Middleware.Logger.handler(logger));
app.use(Middleware.NoCache.handler());
app.use(Middleware.Default.handler({ default: '/default' }));
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler(logger));
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #default', () => {
  describe('#Happy path', () => {
    it('Should response 404 if the user performs a request over a non existing path', () => {
      return request(app)
        .get('/non')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .then(response => {
          expect(response.body.status).toEqual(404);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Not Found');
          expect(response.body.detail).toEqual('Not Found');
          expect(response.body.source).toEqual({
            pointer: '/non',
            parameter: { body: {}, query: {} },
          });
          expect(response.body.links.default).toMatch(/http:\/\/127.0.0.1:[\d]*\/default/);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
