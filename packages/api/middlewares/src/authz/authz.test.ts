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
import mylogger from '@mdf.js/logger';
import express from 'express';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { v4 } from 'uuid';
import { Middleware } from '..';
const secret = v4();
const TOKEN = jwt.sign({ user: 'myUser', role: 'myRole' }, secret);
const BAD_TOKEN = jwt.sign({ user: 'myUser', role: 'myRole' }, 'badPass');
let lastString: string;
const logger = {
  stream: {
    write: (message: string) => {
      lastString = message;
    },
  },
};

const app = express();
// Main middleware function: uuid and bodyParser
app.use(Middleware.RequestId.handler());
//@ts-ignore - Test environment
app.use(Middleware.Logger.handler(logger));
app.use(Middleware.BodyParser.JSONParserHandler());
app.use(Middleware.BodyParser.URLEncodedParserHandler());
app.use(Middleware.BodyParser.TextParserHandler());
// Include all your endpoints paths
app.get('/test', Middleware.AuthZ.handler({ role: 'myRole', secret }), (req, res, next) => {
  res.status(200).send();
});
app.get('/test2', Middleware.AuthZ.handler({ secret }), (req, res, next) => {
  res.status(200).send();
});
app.get('/test3', Middleware.AuthZ.handler({ role: ['myRole'], secret }), (req, res, next) => {
  res.status(200).send();
});
//@ts-ignore - Test environment
app.get('/wrongTest', Middleware.AuthZ.handler(true), (req, res, next) => {
  res.status(200).send();
});
//@ts-ignore - Test environment
app.get('/wrongTest2', Middleware.AuthZ.handler(['myRole', true]), (req, res, next) => {
  res.status(200).send();
});
app.get('/fail', Middleware.AuthZ.handler({ role: 'otherRole', secret }), (req, res, next) => {
  res.status(200).send();
});
// Don't forget to include the errorHandled middleware at the end
app.use(Middleware.ErrorHandler.handler(mylogger));
const request = supertest(app);
// #endregion
// *************************************************************************************************
// #region Test
describe('#Middleware #authz', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('Should response 500 if there is an error in the handler config - single wrong role', async () => {
      const response = await request
        .get('/wrongTest')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(500);
      expect(response.body.detail).toEqual('Internal Server Error');
      expect(response.body.code).toEqual('CrashError');
      expect(response.body.title).toEqual('Internal Server Error');
      expect(response.body.status).toEqual(500);
      expect(response.body.uuid).toBeDefined();
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"error","status":"500","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 500 \/wrongTest - [\d.]* ms - \d* bytes - [:\df.]*/
      );
    }, 300);
    it('Should response 500 if there is an error in the handler config - array wrong role', async () => {
      const response = await request
        .get('/wrongTest2')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(500);
      expect(response.body.detail).toEqual('Internal Server Error');
      expect(response.body.code).toEqual('CrashError');
      expect(response.body.title).toEqual('Internal Server Error');
      expect(response.body.status).toEqual(500);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 200 if the role is correct as string', async () => {
      const response = await request
        .get('/test')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(200);
      expect(response.body).toEqual({});
    }, 300);
    it('Should response 200 if the role is correct as string array', async () => {
      const response = await request
        .get('/test3')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(200);
      expect(response.body).toEqual({});
    }, 300);
    it('Should response 200 if the role is correct as undefined', async () => {
      const response = await request
        .get('/test2')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(200);
      expect(response.body).toEqual({});
    }, 300);
    it('Should response 401 if the role is not correct', async () => {
      const response = await request
        .get('/fail')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(401);
      expect(response.body.detail).toEqual('Not authorized');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Unauthorized');
      expect(response.body.status).toEqual(401);
      expect(response.body.uuid).toBeDefined();
      expect(lastString).toMatch(/"uuid":"[\da-f-]*"/);
      expect(lastString).toMatch(/"level":"warn","status":"401","timestamp"/);
      expect(lastString).toMatch(
        /"context":"express","message":"HTTP\/1.1 GET 401 \/fail - [\d.]* ms - \d* bytes - [:\df.]*/
      );
    }, 300);
    it('Should response 401 if the token not match (is not verified)', async () => {
      const response = await request
        .get('/test')
        .set('Authorization', `Bearer ${BAD_TOKEN}`)
        .expect(401);
      expect(response.body.detail).toEqual('No valid token');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Unauthorized');
      expect(response.body.status).toEqual(401);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 401 if the token is not a valid token', async () => {
      const response = await request.get('/test').set('Authorization', `Bearer token`).expect(401);
      expect(response.body.detail).toEqual('No valid token');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Unauthorized');
      expect(response.body.status).toEqual(401);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 400 if there is not a token', async () => {
      const response = await request.get('/test').expect(400);
      expect(response.body.detail).toEqual('No present authorization information');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Bad Request');
      expect(response.body.status).toEqual(400);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 400 if the token is not a valid token, malformed string', async () => {
      const response = await request.get('/test').set('Authorization', `bad_token`).expect(400);
      expect(response.body.detail).toEqual('Malformed request, malformed authorization token');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Bad Request');
      expect(response.body.status).toEqual(400);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 500 if there is an error decoding the token', async () => {
      const mock = (token: any, secret: any, options: any) => {
        return;
      };
      jest.spyOn(jwt, 'verify').mockImplementation(mock);
      const response = await request
        .get('/test')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(500);
      expect(response.body.detail).toEqual('Internal Server Error');
      expect(response.body.code).toEqual('CrashError');
      expect(response.body.title).toEqual('Internal Server Error');
      expect(response.body.status).toEqual(500);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 500 if there is not a valid user in the token', async () => {
      const mock = (token: any, secret: any, options: any) => {
        return { user: undefined, role: 'myRole' };
      };
      jest.spyOn(jwt, 'verify').mockImplementation(mock);
      const response = await request
        .get('/test')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(400);
      expect(response.body.detail).toEqual('Malformed request, malformed authorization token');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Bad Request');
      expect(response.body.status).toEqual(400);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 500 if there is not a valid role in the token', async () => {
      const mock = (token: any, secret: any, options: any) => {
        return { user: 'myUser', role: undefined };
      };
      jest.spyOn(jwt, 'verify').mockImplementation(mock);
      const response = await request
        .get('/test')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(400);
      expect(response.body.detail).toEqual('Malformed request, malformed authorization token');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Bad Request');
      expect(response.body.status).toEqual(400);
      expect(response.body.uuid).toBeDefined();
    }, 300);
    it('Should response 400 if the token is decoded as a string', async () => {
      const mock = (token: any, secret: any, options: any) => {
        return 'decoded';
      };
      jest.spyOn(jwt, 'verify').mockImplementation(mock);
      const response = await request
        .get('/test')
        .set('Authorization', `Bearer ${TOKEN}`)
        .expect(400);
      expect(response.body.detail).toEqual('Malformed request, malformed authorization token');
      expect(response.body.code).toEqual('HTTP');
      expect(response.body.title).toEqual('Bad Request');
      expect(response.body.status).toEqual(400);
      expect(response.body.uuid).toBeDefined();
    }, 300);
  });
});
// #endregion
