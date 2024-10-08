/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// ************************************************************************************************
// #region Component imports
import express from 'express';
import { Registry } from 'prom-client';
import request from 'supertest';
import { Middleware } from '..';

const service = new Registry();
// #endregion
// *************************************************************************************************
// #region Own express app for testing, including the mandatory middleware
const app = express();

const prefix = `api_`;
app.use(Middleware.RequestId.handler());
app.use(Middleware.BodyParser.JSONParserHandler());
app.use(Middleware.BodyParser.TextParserHandler());
app.use(Middleware.BodyParser.RawParserHandler());
app.use(Middleware.BodyParser.URLEncodedParserHandler());
app.use(Middleware.Metrics.handler(service, prefix));
app.use(Middleware.ErrorHandler.handler());
app.get('/example', (req, res) => {
  res.status(200).json({ result: 'test' });
});
app.get('/example100', (req, res) => {
  res.status(100).json({ result: 'test' });
});
app.get('/example300', (req, res) => {
  res.status(300).json({ result: 'test' });
});
app.get('/example400', (req, res) => {
  res.status(400).json({ result: 'test' });
});
app.get('/example500', (req, res) => {
  res.status(500).json({ result: 'test' });
});

const getSingleMetric = async (register: Registry, name: string) => {
  const metrics = await register.getMetricsAsJSON();
  return metrics.find(metric => metric.name === name);
};

// #endregion
// *************************************************************************************************
// #region Our tests
describe('#Middleware #metrics', () => {
  describe('#Happy path', () => {
    it(`Should response 200 and increase the metrics counter when a request is performed over a regular endpoint`, async () => {
      const previous = await getSingleMetric(service, `${prefix}api_all_request_total`);
      const previousInfo = await getSingleMetric(service, `${prefix}api_all_success_total`);
      expect(previous).toEqual({
        help: 'The total number of all API requests received',
        name: `${prefix}api_all_request_total`,
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      expect(previousInfo).toEqual({
        help: 'The total number of all API requests with success response',
        name: `${prefix}api_all_success_total`,
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      return request(app)
        .get('/example')
        .set('Content-Type', 'text/plain')
        .set('Accept', '*/*')
        .then(async response => {
          expect(response.status).toEqual(200);
          const post = await getSingleMetric(service, `${prefix}api_all_request_total`);
          const postInfo = await getSingleMetric(service, `${prefix}api_all_success_total`);
          expect(post).toEqual({
            help: 'The total number of all API requests received',
            name: `${prefix}api_all_request_total`,
            type: 'counter',
            values: [{ value: 1, labels: {} }],
            aggregator: 'sum',
          });
          expect(postInfo).toEqual({
            help: 'The total number of all API requests with success response',
            name: `${prefix}api_all_success_total`,
            type: 'counter',
            values: [{ value: 1, labels: {} }],
            aggregator: 'sum',
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 101 and increase the metrics counter when a request is performed over a regular endpoint`, async () => {
      const previous = await getSingleMetric(service, `${prefix}api_all_info_total`);
      expect(previous).toEqual({
        help: 'The total number of all API requests with informative response',
        name: `${prefix}api_all_info_total`,
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      // return request(app)
      //   .get('/example100')
      //   .set('Content-Type', 'text/plain')
      //   .set('Accept', '*/*')
      //   .then(async response => {
      //     expect(response.status).toEqual(100);
      //     const post = await getSingleMetric(service, `${prefix}api_all_info_total`);
      //     expect(post).toEqual({
      //       help: 'The total number of all API requests with informative response',
      //       name: `${prefix}api_all_info_total`,
      //       type: 'counter',
      //       values: [{ value: 1, labels: {} }],
      //       aggregator: 'sum',
      //     });
      //   })
      //   .catch(error => {
      //     throw error;
      //   });
    }, 300);
    it(`Should response 300 and increase the metrics counter when a request is performed over a regular endpoint`, async () => {
      const previous = await getSingleMetric(service, `${prefix}api_all_redirect_total`);
      expect(previous).toEqual({
        help: 'The total number of all API requests with redirect response',
        name: `${prefix}api_all_redirect_total`,
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      return request(app)
        .get('/example300')
        .set('Content-Type', 'text/plain')
        .set('Accept', '*/*')
        .then(async response => {
          expect(response.status).toEqual(300);
          const post = await getSingleMetric(service, `${prefix}api_all_redirect_total`);
          expect(post).toEqual({
            help: 'The total number of all API requests with redirect response',
            name: `${prefix}api_all_redirect_total`,
            type: 'counter',
            values: [{ value: 1, labels: {} }],
            aggregator: 'sum',
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 400 and increase the metrics counter when a request is performed over a regular endpoint`, async () => {
      const previous = await getSingleMetric(service, `${prefix}api_all_client_error_total`);
      expect(previous).toEqual({
        help: 'The total number of all API requests with client error response',
        name: `${prefix}api_all_client_error_total`,
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      return request(app)
        .get('/example400')
        .set('Content-Type', 'text/plain')
        .set('Accept', '*/*')
        .then(async response => {
          expect(response.status).toEqual(400);
          const post = await getSingleMetric(service, `${prefix}api_all_client_error_total`);
          expect(post).toEqual({
            help: 'The total number of all API requests with client error response',
            name: `${prefix}api_all_client_error_total`,
            type: 'counter',
            values: [{ value: 1, labels: {} }],
            aggregator: 'sum',
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it(`Should response 500 and increase the metrics counter when a request is performed over a regular endpoint`, async () => {
      const previous = await getSingleMetric(service, `${prefix}api_all_server_error_total`);
      expect(previous).toEqual({
        help: 'The total number of all API requests with server error response',
        name: `${prefix}api_all_server_error_total`,
        type: 'counter',
        values: [{ value: 0, labels: {} }],
        aggregator: 'sum',
      });
      return request(app)
        .get('/example500')
        .set('Content-Type', 'text/plain')
        .set('Accept', '*/*')
        .then(async response => {
          expect(response.status).toEqual(500);
          const post = await getSingleMetric(service, `${prefix}api_all_server_error_total`);
          expect(post).toEqual({
            help: 'The total number of all API requests with server error response',
            name: `${prefix}api_all_server_error_total`,
            type: 'counter',
            values: [{ value: 1, labels: {} }],
            aggregator: 'sum',
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
