/**
 * Copyright 2020 Netin System S.L. All rights reserved.
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
import { Crash } from '@mdf.js/crash';
import express from 'express';
import Joi from 'joi';
import request from 'supertest';
import { v4 } from 'uuid';
import { Middleware } from '..';

const UUID_FAKE = 'a1e4e76a-8e1a-425c-883d-4d75760f9cee';

const schema = Joi.object({
  number: Joi.number().positive(),
  string: Joi.string().uuid(),
});
const app = express();
app.get('/withXRequestUUID', (req, res, next) => {
  next(new Error('withXRequestUUID'));
});
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
// Include all your endpoints paths
app.get('/ConflictError', (req, res, next) => {
  next(new Crash('myConflictError', v4(), { name: 'ConflictError' }));
});
app.get('/ApplicationError', (req, res, next) => {
  next(new Crash('myApplicationError', v4(), { name: 'ApplicationError' }));
});
app.get('/NotFound', (req, res, next) => {
  next(new Crash('myNotFoundError', v4(), { name: 'NotFound' }));
});
app.get('/Another', (req, res, next) => {
  next(new Crash('myAnotherError', v4(), { name: 'Another' }));
});
app.get('/joi', (req, res, next) => {
  try {
    Joi.attempt({ number: 'number', string: 4 }, schema, { abortEarly: false });
  } catch (error) {
    next(error);
  }
});
app.get('/malFormed', (req, res, next) => {
  next(new Error('myMalformedError'));
});
let lastCrash: Crash;
let lastCrashContext: string;
// Don't forget to include the errorHandled middleware at the end
app.use(
  //@ts-ignore - Test environment
  Middleware.ErrorHandler.handler({
    crash: (error: Crash, context: string) => {
      lastCrash = error;
      lastCrashContext = context;
    },
  })
);
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #errorHandler', () => {
  describe('#Happy path', () => {
    it('Should response 500 "Internal Server Error" with the id setted in the header X-Request-ID ', async () => {
      return request(app)
        .get('/withXRequestUUID')
        .set('X-Request-ID', UUID_FAKE)
        .expect(500)
        .then(response => {
          expect(response.body.uuid).toEqual(UUID_FAKE);
          expect(lastCrash.message).toEqual('withXRequestUUID');
          expect(lastCrashContext).toEqual('errorHandler');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 409 "Conflict Error" when the returned error is a ConflictError', async () => {
      return request(app)
        .get('/ConflictError')
        .expect(409)
        .then(response => {
          expect(lastCrash.message).toEqual('myConflictError');
          expect(lastCrashContext).toEqual('errorHandler');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 500 "Internal Server Error" when the returned error is a ApplicationError', async () => {
      return request(app)
        .get('/ApplicationError')
        .expect(500)
        .then(response => {
          expect(lastCrash.message).toEqual('myApplicationError');
          expect(lastCrashContext).toEqual('errorHandler');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 404 "NotFound" when the returned error is a NotFound', async () => {
      return request(app)
        .get('/NotFound')
        .expect(404)
        .then(response => {
          expect(lastCrash.message).toEqual('myNotFoundError');
          expect(lastCrashContext).toEqual('errorHandler');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 500 "Internal Server Error" when the returned error is a Another', async () => {
      return request(app)
        .get('/Another')
        .expect(500)
        .then(response => {
          expect(lastCrash.message).toEqual('myAnotherError');
          expect(lastCrashContext).toEqual('errorHandler');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 500 "Internal Server Error" when the returned error is malformed', async () => {
      return request(app)
        .get('/malFormed')
        .expect(500)
        .then(response => {
          expect(lastCrash.message).toEqual('myMalformedError');
          expect(lastCrashContext).toEqual('errorHandler');
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 500 "Bad Request" when the returned error is a Joi.Error', async () => {
      return request(app)
        .get('/joi')
        .expect(400)
        .then(response => {
          expect(response.body.detail).toEqual(
            '"number" must be a number. "string" must be a string'
          );
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
