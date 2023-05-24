/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Mocha, chai and sinon imports (Testing engine)
process.env['CONFIG_CACHE_HEADERS_BLACK_LIST'] = 'test,test2';
process.env['CONFIG_CACHE_STATUS_CODES_EXCLUDED'] = '10,20';
process.env['CONFIG_CACHE_STATUS_CODES_INCLUDED'] = '30,40';
import { Crash } from '@mdf.js/crash';
import logger from '@mdf.js/logger';
import { Redis } from '@mdf.js/redis-provider';
import { mockProperty, undoMocks } from '@mdf.js/utils';
// #endregion
// ************************************************************************************************
// #region Middleware imports
import express from 'express';
import request from 'supertest';
import { Middleware } from '..';
logger.setConfig('myLogger', { console: { enabled: true } });

const cache = Redis.Factory.create();
const FAKE_UUID = '213d630f-7517-4370-baae-d0a5862799f5';
const instance = Middleware.Cache.instance(cache.client);
// #endregion
// *************************************************************************************************
// #region Build my own Express app for testing, including the mandatory middleware
const app = express();
app.use(Middleware.RequestId.handler());
app.use(Middleware.Logger.handler(logger));
app.use(Middleware.BodyParser.JSONParserHandler());
app.get(
  '/example',
  Middleware.NoCache.handler(),
  instance.handler({
    duration: 10,
    statusCodes: { include: [200], exclude: [201] },
  }),
  (req, res) => {
    res.status(200).send({ respond: 'fresh' });
  }
);
app.post(
  '/example_with_body',
  Middleware.NoCache.handler(),
  instance.handler({
    duration: 10,
    useBody: true,
  }),
  (req, res) => {
    res.status(200).send({ respond: 'fresh' });
  }
);
app.get(
  '/no_cached_for_toggle',
  Middleware.Cache.handler(cache.client, { toggle: () => false }),
  (req, res) => {
    res.status(200).send({ respond: 'fresh' });
  }
);
app.use(Middleware.ErrorHandler.handler(logger));
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #cache', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
    });
    it('Should response a fresh respond if the request has not been cached previously', async () => {
      //@ts-ignore - Test environment
      mockProperty(instance, 'repository', {
        getPath: () => Promise.resolve(null),
        setPath: () => Promise.resolve(),
      });
      await request(app)
        .get('/example')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect('Cache-Control', 'max-age=10')
        .then(response => {
          expect(response.body).toEqual({ respond: 'fresh' });
        });
    }, 300);
    it('Should response an old respond if the request has been cached previously', async () => {
      const result = JSON.stringify({
        headers: {},
        status: 200,
        body: { respond: 'old' },
        date: new Date().getTime(),
        duration: 10,
      });
      //@ts-ignore - Test environment
      mockProperty(instance, 'repository', {
        getPath: () => Promise.resolve(JSON.parse(result)),
      });
      await request(app)
        .get('/example')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then(response => {
          expect(response.header).toHaveProperty('cache-control');
          expect(response.header['cache-control']).toMatch(/max-age=[\d]*/);
          expect(response.body).toEqual({ respond: 'old' });
        });
    }, 300);
    it('Should response an old respond if the request has been cached previously using the body', async () => {
      const result = JSON.stringify({
        headers: {},
        status: 200,
        body: { respond: 'old' },
        date: new Date().getTime(),
        duration: 10,
      });
      //@ts-ignore - Test environment
      mockProperty(instance, 'repository', {
        getPath: (path: string) => {
          expect(path).toEqual(
            'api:cache:/example_with_body:6763d0490d971e89790eb635cf3600f96ccd4239'
          );
          return Promise.resolve(JSON.parse(result));
        },
      });
      await request(app)
        .post('/example_with_body')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ myProperty: 'value' })
        //.expect(200)
        .then(response => {
          expect(response.header).toHaveProperty('cache-control');
          expect(response.body).toEqual({ respond: 'old' });
        });
    }, 300);
    it('Should response a fresh respond if the request has been cached previously but "x-cache-bypass" header is set', async () => {
      const result = JSON.stringify({
        headers: {},
        status: 200,
        body: { respond: 'old' },
        date: new Date().getTime(),
        duration: 10,
      });
      //@ts-ignore - Test environment
      mockProperty(instance, 'repository', {
        getPath: () => Promise.resolve(JSON.parse(result)),
      });
      await request(app)
        .get('/example')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('X-Cache-Bypass', 'true')
        .expect(200)
        .then(response => {
          expect(response.header).toHaveProperty('cache-control');
          expect(response.body).toEqual({ respond: 'fresh' });
        });
    }, 300);
    it('Should response a fresh respond if the request is not cached due to toggle', async () => {
      await request(app)
        .get('/no_cached_for_toggle')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .then(response => {
          expect(response.header).not.toHaveProperty('cache-control');
          expect(response.body).toEqual({ respond: 'fresh' });
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should response a fresh respond if the cache repository fails to get the cached version', async () => {
      //@ts-ignore - Test environment
      mockProperty(instance, 'repository', {
        getPath: () => Promise.reject(new Crash('MyError', FAKE_UUID)),
      });
      await request(app)
        .get('/example')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .then(response => {
          expect(response.body).toEqual({ respond: 'fresh' });
        });
    }, 300);
    it('Should response a fresh respond if the cache repository fails to set the cached version', async () => {
      //@ts-ignore - Test environment
      mockProperty(instance, 'repository', {
        getPath: () => Promise.resolve(null),
        setPath: () => Promise.reject(new Crash('MyError', FAKE_UUID)),
      });
      await request(app)
        .get('/example')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .then(response => {
          expect(response.body).toEqual({ respond: 'fresh' });
        });
    }, 300);
  });
});
// #endregion
