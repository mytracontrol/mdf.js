/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

// ************************************************************************************************
// #region Set the logger for test proposal
// #endregion
// *************************************************************************************************
// #region Build my own Express app for testing, including the mandatory middleware
import express from 'express';
import request from 'supertest';
import { Middleware } from '..';

const app = express();
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
app.use(Middleware.NoCache.handler());
app.use(Middleware.Security.handler());
app.use(Middleware.Security.handler(false));
// Include all your endpoints paths
app.get('/', (req, res) => {
  res.status(200).end();
});
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler());
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #nocache', () => {
  describe('#Happy path', () => {
    it('Should response 200 OK if the user performs a request with a correct JSON body', () => {
      return request(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          origin: '192.168.1.5',
        })
        .expect(200)
        .expect('Expires', '-1')
        .expect('Surrogate-Control', 'no-store')
        .expect('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        .expect('Pragma', 'no-cache')
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
