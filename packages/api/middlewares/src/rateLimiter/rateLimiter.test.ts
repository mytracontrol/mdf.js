/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Build my own Express app for testing, including the mandatory middleware
import logger from '@mdf.js/logger';
import express from 'express';
import request from 'supertest';
import { Middleware } from '..';
// #endregion
// *************************************************************************************************
// #region Creation of request handlers
import { RateLimiter } from './rateLimiter';
logger.setConfig('myLogger', { console: { enabled: true } });

const limiter = new RateLimiter({
  enabled: true,
  rates: [{ example: { maxRequests: 2, timeWindow: 1 } }],
});
const empty = new RateLimiter({ enabled: false, rates: [] });
const app = express();
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
app.use(Middleware.Logger.handler(logger));
// Include all your endpoints paths
app.get('/example', limiter.get('example'), (req, res) => {
  res.status(200).end();
});
app.get('/noExample', limiter.get('empty'), (req, res) => {
  res.status(200).end();
});
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler());
// #endregion
// *************************************************************************************************
// #region Request resume
const r = (path: string) => {
  return request(app)
    .get(path)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send({});
};
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #rateLimiter', () => {
  describe('Happy path', () => {
    it('Should response 429 Too Many Requests when we get the limit', () => {
      return r('/example')
        .then(() => r('/example'))
        .then(() => r('/example'))
        .then(response => {
          expect(response.statusCode).toBe(429);
          expect(response.body).toHaveProperty('code', 'HTTP');
          expect(response.body).toHaveProperty('title', 'Too Many Requests');
          expect(response.body).toHaveProperty(
            'detail',
            'Too many requests, please try again later'
          );
          expect(response.body.source).toEqual({
            pointer: '/example',
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should NO response 429 Too Many Requests when there is no limit', () => {
      return r('/noExample')
        .then(() => r('/noExample'))
        .then(() => r('/noExample'))
        .then(response => {
          expect(response.statusCode).toBe(200);
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
