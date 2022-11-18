/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import { Boom, BoomHelpers, Crash, Multi } from '@mdf.js/crash';
import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { Registry as StandAloneRegister } from 'prom-client';
import request from 'supertest';
import { v4 } from 'uuid';
import { Aggregator } from '../Aggregator';
import { Router } from './metrics.router';
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const app = express();
const aggregator = new Aggregator(new StandAloneRegister());
const metricsRouteAppCluster = new Router(aggregator, true, '/metricsCluster');
const metricsRoute = new Router(aggregator);
app.use(metricsRoute.router);
app.use(metricsRouteAppCluster.router);
const errorHandler: ErrorRequestHandler = (
  error: Error | Crash | Multi,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const requestId: string = request.uuid || (request.headers['x-request-id'] as string) || v4();
  let boomError: Boom;
  if (error instanceof Boom) {
    boomError = error;
  } else if ('isMulti' in error) {
    boomError = BoomHelpers.badRequest(error.message, requestId, {
      source: {
        pointer: request.path,
        parameter: { body: request.body, query: request.query },
      },
      cause: error,
      name: error.name,
      info: { ...error.trace() },
    });
  } else {
    boomError = BoomHelpers.internalServerError(`${error.name}: ${error.message}`, requestId);
  }
  response.status(boomError.status).json(boomError);
};
app.use(errorHandler);

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Component #metrics', () => {
  describe('#Happy path', () => {
    it(`Should response 200 and a string when a GET request is performed over /metrics allowing any content-type in regular mode`, done => {
      request(app)
        .get('/metrics')
        .set('Content-Type', 'text/plain')
        .set('Accept', '*/*')
        .expect('Content-Type', /text\/plain/)
        .expect(200)
        .then(response => {
          expect(typeof response.text).toEqual('string');
          done();
        })
        .catch(error => {
          fail(error.message);
        });
    }, 300);
    it(`Should response 200 and a JSON body when a GET request is performed over /metrics allowing any content-type but with json flag in query in regular mode`, done => {
      request(app)
        .get('/metrics?json=true')
        .set('Content-Type', 'text/plain')
        .set('Accept', '*/*')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(typeof response.body).toEqual('object');
          done();
        })
        .catch(error => {
          fail(error.message);
        });
    }, 300);
    it(`Should response 200 and a string when a GET request is performed over /metrics allowing only text/plain content type in regular mode`, done => {
      request(app)
        .get('/metrics')
        .set('Content-Type', 'text/plain')
        .set('Accept', 'text/plain')
        .expect('Content-Type', /text\/plain/)
        .expect(200)
        .then(response => {
          expect(typeof response.text).toEqual('string');
          done();
        })
        .catch(error => {
          fail(error.message);
        });
    }, 300);
    it(`Should response 200 and a JSON body when a GET request is performed over /metrics allowing only json/application content/type in regular mode`, done => {
      request(app)
        .get('/metrics')
        .set('Content-Type', 'text/plain')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
          expect(typeof response.body).toEqual('object');
          done();
        })
        .catch(error => {
          fail(error.message);
        });
    }, 300);
    it(`Should response 200 and a string when a GET request is performed over /metrics allowing only text/plain content type in cluster mode`, done => {
      request(app)
        .get('/metricsCluster')
        .set('Content-Type', 'text/plain')
        .set('Accept', 'text/plain')
        .expect('Content-Type', /text\/plain/)
        .expect(200)
        .then(response => {
          expect(typeof response.text).toEqual('string');
          done();
        })
        .catch(error => {
          fail(error.message);
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should response 400 as bad request error when a GET request is performed and the query has not the correct mode`, done => {
      request(app)
        .get('/metrics?json=3')
        .set('Content-Type', 'text/plain')
        .set('Accept', 'text/plain')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(response => {
          expect(response.body.status).toEqual(400);
          expect(response.body.code).toEqual('ValidationError');
          expect(response.body.title).toEqual('Bad Request');
          expect(response.body.detail).toEqual('Errors during the schema validation process');
          expect(response.body.source).toEqual({
            pointer: '/metrics',
            parameter: {
              query: {
                json: '3',
              },
            },
          });
          expect(response.body.meta).toEqual({
            '0': 'ValidationError: Should be a boolean - Path: [/json] - Value: [3]',
          });
          done();
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 406 as not acceptable request error when a GET request is performed and text/plain or application/json are not allowed in regular mode`, done => {
      request(app)
        .get('/metrics')
        .set('Content-Type', 'text/plain')
        .set('Accept', 'other/other')
        .expect('Content-Type', /json/)
        .expect(406)
        .then(response => {
          expect(response.body.status).toEqual(406);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Not Acceptable');
          expect(response.body.detail).toEqual(
            'Not valid formats for metrics endpoint are aceptable by the client'
          );
          expect(response.body.source).toEqual({
            pointer: '/metrics',
            parameter: {
              query: {},
            },
          });
          done();
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 406 as not acceptable request error when a GET request is performed and text/plain is not allowed in cluster mode`, done => {
      request(app)
        .get('/metricsCluster')
        .set('Content-Type', 'text/plain')
        .set('Accept', 'other/other')
        .expect('Content-Type', /json/)
        .expect(406)
        .then(response => {
          expect(response.body.status).toEqual(406);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Not Acceptable');
          expect(response.body.detail).toEqual(
            'Not valid formats for metrics endpoint are aceptable by the client'
          );
          expect(response.body.source).toEqual({
            pointer: '/metricsCluster',
            parameter: {
              query: {},
            },
          });
          done();
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
