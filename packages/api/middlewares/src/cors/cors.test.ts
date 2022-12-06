/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Build my own Express app for testing, including the mandatory middleware
import standardLogger from '@mdf.js/logger';
import express from 'express';
import request from 'supertest';
import { Middleware } from '..';
// #endregion
// *************************************************************************************************
// #region Creation of request handlers
import { Cors } from './cors';
let lastString: string;
const logger = {
  stream: {
    write: (message: string) => {
      lastString = message;
    },
  },
};
const FAKE_UUID = '213d630f-7517-4370-baae-d0a5862799f5';
const corsEnabled = Cors.handler({
  enabled: true,
  whitelist: ['http://test.com'],
  methods: ['GET'],
  allowAppClients: false,
});
const corsEnabledApps = Cors.handler({
  enabled: true,
  whitelist: ['http://test.com'],
  methods: ['GET'],
  allowAppClients: true,
});
const corsDisabled = Cors.handler({
  enabled: false,
  whitelist: ['http://test.com'],
  methods: ['GET'],
});
const corsAllEnabled = Cors.handler({
  enabled: true,
});
const corsStringAll = Cors.handler({
  enabled: true,
  whitelist: '*',
});
const corsStringUri = Cors.handler({
  enabled: true,
  whitelist: 'http://test.com',
});
const corsStringRegex = Cors.handler({
  enabled: true,
  whitelist: [new RegExp(/test\.com/)],
  allowAppClients: true,
});
const app = express();
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
//@ts-ignore - Test environment
app.use(Middleware.Logger.handler(logger));
app.use(Middleware.NoCache.handler());
// Include all your endpoints paths
app.get('/example', corsEnabled, (req, res) => {
  expect(req.headers['X-Request-ID']).toBeDefined();
  res.status(200).json({ result: 'test' });
});
app.get('/exampleApp', corsEnabledApps, (req, res) => {
  expect(req.headers['X-Request-ID']).toEqual(FAKE_UUID);
  res.status(200).json({ result: 'test' });
});
app.get('/exampleDisable', corsDisabled, (req, res) => {
  res.status(200).json({ result: 'test' });
});
app.get('/exampleAllEnable', corsAllEnabled, (req, res) => {
  res.status(200).json({ result: 'test' });
});
app.get('/exampleStringAll', corsStringAll, (req, res) => {
  res.status(200).json({ result: 'test' });
});
app.get('/exampleStringUri', corsStringUri, (req, res) => {
  res.status(200).json({ result: 'test' });
});
app.get('/exampleArrayRegex', corsStringRegex, (req, res) => {
  res.status(200).json({ result: 'test' });
});
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler(standardLogger));
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #CORS', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Valid domain in CORS', () => {
    it('Should response with the Access-Control-Allow-Origin header with Apps NOT allowed', async () => {
      await request(app)
        .get('/example')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://test.com');
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/example - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should response with the Access-Control-Allow-Origin header with Apps allowed', async () => {
      await request(app)
        .get('/exampleApp')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('X-Request-ID', FAKE_UUID)
        .send({})
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://test.com');
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleApp - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should response with the Access-Control-Allow-Origin header with all enabled', async () => {
      await request(app)
        .get('/exampleAllEnable')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://test.com');
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleAllEnable - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should response with the Access-Control-Allow-Origin header with whitelist "*"', async () => {
      await request(app)
        .get('/exampleStringAll')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://test.com');
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleStringAll - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should response with the Access-Control-Allow-Origin header with whitelist URI', async () => {
      await request(app)
        .get('/exampleStringUri')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://test.com');
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleStringUri - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should response with the Access-Control-Allow-Origin header with whitelist Regex', async () => {
      await request(app)
        .get('/exampleArrayRegex')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://test.com');
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleArrayRegex - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
  });
  describe('Invalid domain in CORS', () => {
    it('Should NOT response with the Access-Control-Allow-Origin header', async () => {
      await request(app)
        .get('/example')
        .set('Origin', 'http://notest.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .then(response => {
          expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/example - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should NOT response with the Access-Control-Allow-Origin header with Apps allowed', async () => {
      await request(app)
        .get('/exampleApp')
        .set('X-Request-ID', FAKE_UUID)
        .set('Origin', 'http://notest.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200)
        .then(response => {
          expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleApp - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should NOT response with the Access-Control-Allow-Origin header with whitelist URI', async () => {
      const response = await request(app)
        .get('/exampleStringUri')
        .set('Origin', 'http://notest.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleStringUri - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
    it('Should NOT response with the Access-Control-Allow-Origin header with whitelist Regex', async () => {
      const response = await request(app)
        .get('/exampleArrayRegex')
        .set('Origin', 'http://no.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleArrayRegex - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
  });
  describe('CORS Disable', () => {
    it('Should NOT response with the Access-Control-Allow-Origin header', async () => {
      const response = await request(app)
        .get('/exampleDisable')
        .set('Origin', 'http://test.com')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({})
        .expect(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"debug","status":"200","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 200 \/exampleDisable - [\d.]* ms - \d* bytes - [:\df.]{3,}/
      );
    }, 300);
  });
});
// #endregion
