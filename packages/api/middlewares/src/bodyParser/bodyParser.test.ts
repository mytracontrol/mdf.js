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
app.use(Middleware.Logger.handler(logger));
app.use(Middleware.BodyParser.JSONParserHandler());
app.use(Middleware.BodyParser.URLEncodedParserHandler());
app.use(Middleware.BodyParser.RawParserHandler());
app.use(Middleware.BodyParser.TextParserHandler());
// Include all your endpoints paths
app.get('/', (req, res) => {
  res.status(200).end();
});
app.post('/', (req, res) => {
  res.status(200).end();
});
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler());
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #bodyParser', () => {
  describe('Happy path', () => {
    it('Should response 200 OK if the user performs a request with a correct JSON body', async () => {
      await request(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          origin: '192.168.1.5',
        })
        .expect(200);
    }, 300);
    it('Should response 200 OK if the user performs a request with a correct urlencoded', async () => {
      await request(app)
        .post('/')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Accept', 'application/x-www-form-urlencoded')
        .send({
          origin: '192.168.1.5',
        })
        .expect(200);
    }, 300);
  });
  describe('Sad path', () => {
    it('Should response 400 Bad Request if the user performs a request with a bad JSON body', async () => {
      return request(app)
        .post('/')
        .send("origin: '192.168.1.5")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(400)
        .then(response => {
          expect(response.body.code).toEqual('SyntaxError');
          expect(response.body.title).toEqual('Bad Request');
          expect(response.body.detail).toEqual('Unexpected token o in JSON at position 0');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
