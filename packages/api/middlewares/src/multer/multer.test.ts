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
import fs from 'fs';
import request from 'supertest';
import { Middleware } from '..';

const app = express();
const audit = Middleware.Audit.instance(logger);
const instance = Middleware.Multer.Instance();
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
app.use(audit.handler({ area: 'myArea', category: 'access', details: 'myDetails' }));
app.use(Middleware.BodyParser.JSONParserHandler());
// Include all your endpoints paths
app.post(
  '/single',
  Middleware.Multer.SingleHandler('attachment', undefined, 'image/png'),
  (req, res) => {
    if (req.file) {
      res.status(200).json();
    } else {
      res.status(500).send();
    }
  }
);
app.post('/singleInstance', instance.single('image/png'), (req, res) => {
  if (req.file) {
    res.status(200).json();
  } else {
    res.status(500).send();
  }
});
app.post('/array', Middleware.Multer.ArrayHandler('attachment'), (req, res) => {
  if (req.files) {
    res.status(200).json();
  }
});
app.post('/arrayInstance', instance.array('attachment'), (req, res) => {
  if (req.files) {
    res.status(200).json();
  }
});
app.post('/arrayMax', Middleware.Multer.ArrayHandler('attachment', 2), (req, res) => {
  if (req.files) {
    res.status(200).json();
  }
});
app.post('/arrayMaxInstance', instance.array('attachment', 2), (req, res) => {
  if (req.files) {
    res.status(200).json();
  }
});
app.post(
  '/fields',
  Middleware.Multer.FieldsHandler([{ name: 'attachment', maxCount: 2 }, { name: 'adjuntos' }]),
  (req, res) => {
    if (req.files) {
      res.status(200).json();
    }
  }
);
app.post(
  '/fieldsInstance',
  instance.fields([{ name: 'attachment', maxCount: 2 }, { name: 'adjuntos' }]),
  (req, res) => {
    if (req.files) {
      res.status(200).json();
    }
  }
);
app.post('/none', Middleware.Multer.NoneHandler(), (req, res) => {
  if (!req.file) {
    res.status(200).json();
  }
});
app.post('/noneInstance', instance.none(), (req, res) => {
  if (!req.file) {
    res.status(200).json();
  }
});
app.post('/any', instance.any(), (req, res) => {
  if (req.files) {
    res.status(200).json();
  }
});
app.post('/anyInstance', Middleware.Multer.AnyHandler(), (req, res) => {
  if (req.files) {
    res.status(200).json();
  }
});
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler());
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #multer', () => {
  describe('#Happy path', () => {
    it('Should response 200 OK when a request is performed with a single file and the mime types are limited', () => {
      return request(app)
        .post('/single')
        .set('Content-Type', 'multipart/form-data')
        .attach('attachment', fs.readFileSync(`${__dirname}/test/image.png`), {
          filename: 'image.png',
          contentType: 'image/png',
        })
        .expect(200)
        .catch(error => {
          throw error;
        });
    }, 300);
  });
  describe('#Sad path', () => {
    it('Should response 415 as unsupported media type when a POST request is performed with a single file with a wrong mime type', () => {
      return request(app)
        .post('/single')
        .set('Content-Type', 'multipart/form-data')
        .attach('attachment', fs.readFileSync(`${__dirname}//test/image.jpg`), {
          filename: 'image.jpg',
          contentType: 'image/jpg',
        })
        .expect(415)
        .expect('content-type', 'application/json; charset=utf-8')
        .then(response => {
          expect(response.body.status).toEqual(415);
          expect(response.body.code).toEqual('HTTP');
          expect(response.body.title).toEqual('Unsupported Media Type');
          expect(response.body.detail).toEqual(
            `Unsupported media type: [image/jpg]. Supported types: [image/png]`
          );
          expect(response.body.source).toEqual({
            pointer: '/single',
            parameter: {
              body: {},
              query: {},
            },
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
    it('Should response 400 as bad request error when a POST request is performed exceeding the length of the filename', () => {
      return request(app)
        .post('/single')
        .set('Content-Type', 'multipart/form-data')
        .attach('attachment', fs.readFileSync(`${__dirname}/test/big.png`), {
          filename: 'big.jpg',
          contentType: 'image/png',
        })
        .expect(400)
        .expect('content-type', 'application/json; charset=utf-8')
        .then(response => {
          expect(response.body.status).toEqual(400);
          expect(response.body.code).toEqual('ValidationError');
          expect(response.body.title).toEqual('Bad Request');
          expect(response.body.detail).toEqual(`Errors during form processing`);
          expect(response.body.source).toEqual({
            pointer: '/single',
            parameter: {
              body: {},
              query: {},
            },
          });
          expect(response.body.meta).toEqual({
            '0': 'ValidationError: Form error: File too large',
          });
        })
        .catch(error => {
          throw error;
        });
    }, 300);
  });
});
// #endregion
