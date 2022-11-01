/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */
import Joi from 'joi';
import { v4 } from 'uuid';
import { BoomOptions } from '../types';
import { Boom } from './BoomError';
import * as BoomHelpers from './BoomHelpers';
const uuidTest = v4();
const testError = new SyntaxError('Syntax');
const optionsTest: BoomOptions = {
  links: {
    self: '/link/test',
  },
  source: {
    pointer: '/this/point',
    parameter: { myParameter: 'test2' },
  },
  cause: testError,
  info: {
    a: 2,
  },
};
const msg = 'Detailed error';
describe('In #Boom class the ', () => {
  describe('constructor ', () => {
    it('should throw an error if code is not a number', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Boom('Boom', uuidTest, 'code');
      };
      expect(test).toThrowError('Code must be a number');
    });
    it('should throw an error if option.links.self is not a string', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Boom(msg, uuidTest, 500, { links: { self: 7 } });
      };
      expect(test).toThrowError('Links and source must be strings');
    });
    it('should throw an error if option.links.related.href is not a string', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Boom(msg, uuidTest, 500, { links: { related: { href: 7 } } });
      };
      expect(test).toThrowError('Links and source must be strings');
    });
    it('should throw an error if option.source.parameter without pointer', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Boom(msg, uuidTest, 500, { source: { parameter: '../' } });
      };
      expect(test).toThrowError('Links and source must be strings');
    });
    it('should throw an error if option.source.pointer is not a string', () => {
      const test = () => {
        //@ts-ignore - Test environment
        new Boom(msg, uuidTest, 500, { source: { pointer: 7 } });
      };
      expect(test).toThrowError('Links and source must be strings');
    });
    it('should create an error with default value 500', () => {
      const error = new Boom(msg, uuidTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON()).toHaveProperty('links', undefined);
      expect(error.toJSON()).toHaveProperty('status', 500);
      expect(error.toJSON()).toHaveProperty('code', 'HTTP');
      expect(error.toJSON()).toHaveProperty('title', 'Internal Server Error');
      expect(error.toJSON()).toHaveProperty('detail', msg);
      expect(error.toJSON()).toHaveProperty('source', undefined);
      expect(error.toJSON()).toHaveProperty('meta', undefined);
    });
    it('should create an error with not defined code', () => {
      const error = new Boom(msg, uuidTest, 625);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON()).toHaveProperty('links', undefined);
      expect(error.toJSON()).toHaveProperty('status', 625);
      expect(error.toJSON()).toHaveProperty('code', 'HTTP');
      expect(error.toJSON()).toHaveProperty('title', 'Undefined error');
      expect(error.toJSON()).toHaveProperty('detail', msg);
      expect(error.toJSON()).toHaveProperty('source', undefined);
      expect(error.toJSON()).toHaveProperty('meta', undefined);
    });
  });
  describe('helpers ', () => {
    it('should create an error from helper badRequest()', () => {
      const error = BoomHelpers.badRequest('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 400);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Bad Request');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper unauthorized()', () => {
      const error = BoomHelpers.unauthorized('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 401);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Unauthorized');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper paymentRequired()', () => {
      const error = BoomHelpers.paymentRequired('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 402);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Payment Required');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper forbidden()', () => {
      const error = BoomHelpers.forbidden('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 403);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Forbidden');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper notFound()', () => {
      const error = BoomHelpers.notFound('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 404);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Not Found');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper methodNotAllowed()', () => {
      const error = BoomHelpers.methodNotAllowed('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 405);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Method Not Allowed');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper notAcceptable()', () => {
      const error = BoomHelpers.notAcceptable('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 406);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Not Acceptable');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper proxyAuthRequired()', () => {
      const error = BoomHelpers.proxyAuthRequired('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 407);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Proxy Authentication Required');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper requestTimeout()', () => {
      const error = BoomHelpers.requestTimeout('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 408);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Request Time-out');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper conflict()', () => {
      const error = BoomHelpers.conflict('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 409);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Conflict');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper gone()', () => {
      const error = BoomHelpers.gone('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 410);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Gone');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper lengthRequired()', () => {
      const error = BoomHelpers.lengthRequired('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 411);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Length Required');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper preconditionFailed()', () => {
      const error = BoomHelpers.preconditionFailed('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 412);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Precondition Failed');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper payloadTooLarge()', () => {
      const error = BoomHelpers.payloadTooLarge('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 413);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Request Entity Too Large');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper uriTooLong()', () => {
      const error = BoomHelpers.uriTooLong('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 414);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Request-URI Too Large');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper unsupportedMediaType()', () => {
      const error = BoomHelpers.unsupportedMediaType('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 415);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Unsupported Media Type');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper rangeNotSatisfiable()', () => {
      const error = BoomHelpers.rangeNotSatisfiable('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 416);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Requested Range Not Satisfiable');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper expectationFailed()', () => {
      const error = BoomHelpers.expectationFailed('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 417);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Expectation Failed');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper teapot()', () => {
      const error = BoomHelpers.teapot('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 418);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', "I'm a teapot");
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper locked()', () => {
      const error = BoomHelpers.locked('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 423);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Locked');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper failedDependency()', () => {
      const error = BoomHelpers.failedDependency('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 424);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Failed Dependency');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper tooEarly()', () => {
      const error = BoomHelpers.tooEarly('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 425);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Too Early');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper preconditionRequired()', () => {
      const error = BoomHelpers.preconditionRequired('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 428);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Precondition Required');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper tooManyRequests()', () => {
      const error = BoomHelpers.tooManyRequests('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 429);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Too Many Requests');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper illegal()', () => {
      const error = BoomHelpers.illegal('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 451);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Unavailable For Legal Reasons');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper internalServerError()', () => {
      const error = BoomHelpers.internalServerError('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 500);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Internal Server Error');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper notImplemented()', () => {
      const error = BoomHelpers.notImplemented('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 501);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Not Implemented');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper badGateway()', () => {
      const error = BoomHelpers.badGateway('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 502);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Bad Gateway');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper serverUnavailable()', () => {
      const error = BoomHelpers.serverUnavailable('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 503);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Service Unavailable');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
    it('should create an error from helper gatewayTimeout()', () => {
      const error = BoomHelpers.gatewayTimeout('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
      expect(error.toJSON()).toHaveProperty('uuid', uuidTest);
      expect(error.toJSON().links).toEqual(optionsTest.links);
      expect(error.toJSON()).toHaveProperty('status', 504);
      expect(error.toJSON()).toHaveProperty('code', 'SyntaxError');
      expect(error.toJSON()).toHaveProperty('title', 'Gateway Time-out');
      expect(error.toJSON()).toHaveProperty('detail', 'detail');
      expect(error.toJSON().source).toEqual(optionsTest.source);
      expect(error.toJSON().meta).toEqual(optionsTest.info);
    });
  });
  describe('method ', () => {
    it('status should return the status', () => {
      const error = BoomHelpers.badRequest('detail', uuidTest, optionsTest);
      expect(error.status).toEqual(400);
    });
    it('links should return the links', () => {
      const error = BoomHelpers.badRequest('detail', uuidTest, optionsTest);
      expect(error.links).toEqual(optionsTest.links);
    });
    it('source should return the source', () => {
      const error = BoomHelpers.badRequest('detail', uuidTest, optionsTest);
      expect(error.source).toEqual(optionsTest.source);
    });
    it('isBoom should return true', () => {
      const error = BoomHelpers.badRequest('detail', uuidTest, optionsTest);
      expect(error.isBoom).toEqual(true);
    });
    it('cause return undefined if there is no cause', () => {
      const errorTest = new Boom('Example', uuidTest);
      expect(errorTest.cause).toBeUndefined();
    });
    it('cause return an Error if there is the cause is an error', () => {
      const errorCause = new Error('Cause');
      const errorTest = new Boom('Example', uuidTest, 500, { cause: errorCause });
      expect(errorTest.cause).toBeInstanceOf(Error);
      expect(errorTest.cause?.name).toEqual('Error');
      expect(errorTest.cause?.message).toEqual('Cause');
    });
    it('Boomify should return a Boom error with Multi from a Joi validation Error', () => {
      const schema = Joi.object({
        imagination: Joi.number().min(5).max(20).default(4).messages({
          'number.base': 'Imagination should be a number',
          'number.max': 'Imagination should be between 5 and 20',
          'number.min': 'Imagination should be between 5 and 20',
        }),
        magicWords: Joi.array()
          .items(
            Joi.string().min(5).messages({
              'string.base': 'Magic words should be strings',
              'string.min': 'Magic words should have at least 5 characters',
            })
          )
          .min(1)
          .max(5)
          .required()
          .messages({
            'any.required': 'Magic works are necessary to perform magic',
            'array.base': 'Magic works should be an array of words',
            'array.min': 'We need at least one magic word',
            'array.max': 'More than 5 magic words will invoque Voldemort',
          }),
      });
      const magicValidation = schema.validate(
        {
          imagination: 21,
          magicWords: ['a', 'b', 'c', 'h', 'i', 'ooo'],
        },
        { abortEarly: false }
      );
      if (magicValidation.error) {
        const error = new Boom(magicValidation.error.message, uuidTest, 400, {
          name: 'Validation Error',
        });
        error.Boomify(magicValidation.error);
        expect(error.status).toEqual(400);
        //@ts-ignore - Test environment
        expect(error.cause.isMulti).toBeTruthy();
        //@ts-ignore - Test environment
        expect(error.cause.causes[0].message).toEqual('Imagination should be between 5 and 20');
        //@ts-ignore - Test environment
        expect(error.cause.causes[1].message).toEqual(
          'Magic words should have at least 5 characters'
        );
        //@ts-ignore - Test environment
        expect(error.cause.causes[2].message).toEqual(
          'Magic words should have at least 5 characters'
        );
        //@ts-ignore - Test environment
        expect(error.cause.causes[3].message).toEqual(
          'Magic words should have at least 5 characters'
        );
        //@ts-ignore - Test environment
        expect(error.cause.causes[4].message).toEqual(
          'Magic words should have at least 5 characters'
        );
        //@ts-ignore - Test environment
        expect(error.cause.causes[5].message).toEqual(
          'Magic words should have at least 5 characters'
        );
        //@ts-ignore - Test environment
        expect(error.cause.causes[6].message).toEqual(
          'Magic words should have at least 5 characters'
        );
        //@ts-ignore - Test environment
        expect(error.cause.causes[7].message).toEqual(
          'More than 5 magic words will invoque Voldemort'
        );
      } else {
        throw new Error('Hapi/Joi should produce an error in the validation');
      }
    });
    it('Boomify should return a Boom error with Crash from a Joi validation Error', () => {
      const schema = Joi.object({
        imagination: Joi.number().min(5).max(20).default(4).messages({
          'number.base': 'Imagination should be a number',
          'number.max': 'Imagination should be between 5 and 20',
          'number.min': 'Imagination should be between 5 and 20',
        }),
        magicWords: Joi.array()
          .items(
            Joi.string().min(5).messages({
              'string.base': 'Magic words should be strings',
              'string.min': 'Magic words should have at least 5 characters',
            })
          )
          .min(1)
          .max(5)
          .required()
          .messages({
            'any.required': 'Magic works are necessary to perform magic',
            'array.base': 'Magic works should be an array of words',
            'array.min': 'We need at least one magic word',
            'array.max': 'More than 5 magic words will invoque Voldemort',
          }),
      });
      const magicValidation = schema.validate(
        {
          imagination: 21,
          magicWords: ['abcde', 'abcde', 'abcde', 'abcde', 'abcde'],
        },
        { abortEarly: false }
      );
      if (magicValidation.error) {
        const error = new Boom(magicValidation.error.message, uuidTest, 400, {
          name: 'Validation Error',
        });
        error.Boomify(magicValidation.error);
        expect(error.status).toEqual(400);
        //@ts-ignore - Test environment
        expect(error.cause.isCrash).toBeTruthy();
        //@ts-ignore - Test environment
        expect(error.cause.message).toEqual('Imagination should be between 5 and 20');
      } else {
        throw new Error('Hapi/Joi should produce an error in the validation');
      }
    });
  });
});
