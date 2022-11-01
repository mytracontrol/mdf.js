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

import { Boom } from '@mdf/crash';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthZ } from './authz';

const secret = process.env['CONFIG_JWT_TOKEN_SECRET'] as string;
const TOKEN = jwt.sign({ user: 'myUser', role: 'myRole' }, secret);

describe('#Authz #middleware', () => {
  describe('#Happy path', () => {
    it(`Should validate a token`, done => {
      const socket = {
        handshake: {
          auth: {
            token: TOKEN,
          },
        },
      };
      const onAuthorization = (token: JwtPayload) => {
        //@ts-ignore - We are testing the middleware
        expect(token.role).toEqual('myRole');
        //@ts-ignore - We are testing the middleware
        expect(token.user).toEqual('myUser');
      };
      const next = (error: Boom) => {
        expect(error).toBeUndefined();
        done();
      };
      //@ts-ignore - We are testing the middleware
      expect(AuthZ.handler({ onAuthorization })(socket, next)).toBeUndefined();
    });
    it(`Should return an error if the token is a bad token`, done => {
      const socket = {
        handshake: {
          auth: {
            token: 'token',
          },
        },
      };
      const next = (error: Boom) => {
        expect(error.message).toEqual('No valid token: jwt malformed');
        done();
      };
      //@ts-ignore - We are testing the middleware
      expect(AuthZ.handler()(socket, next)).toBeFalsy();
    });
    it(`Should return an error if there is not a token`, done => {
      const socket = {
        handshake: {
          auth: {
            token: undefined,
          },
        },
      };
      const next = (error: Boom) => {
        expect(error.message).toEqual('No present authorization information');
        done();
      };
      //@ts-ignore - We are testing the middleware
      expect(AuthZ.handler()(socket, next)).toBeFalsy();
    });
    it(`Should return an error if there is not a valid token`, done => {
      const socket = {
        handshake: {
          auth: {
            token: 2,
          },
        },
      };
      const next = (error: Boom) => {
        expect(error.message).toEqual('Malformed authorization information');
        done();
      };
      //@ts-ignore - We are testing the middleware
      expect(AuthZ.handler({ onAuthorization: undefined })(socket, next)).toBeFalsy();
    });
    it(`Should return an error if there is a problem decoding the token`, done => {
      const socket = {
        handshake: {
          auth: {
            token: TOKEN,
          },
        },
      };
      const next = (error: Boom) => {
        expect(error.message).toEqual('Error verifying the JWT token');
        done();
      };
      jest.spyOn(jwt, 'verify').mockImplementation(
        //@ts-ignore - We are testing the middleware
        (token: any, secret: any, options: any, cb: (error: any, decoded: any) => void) => {
          cb(null, null);
        }
      );
      //@ts-ignore - We are testing the middleware
      expect(AuthZ.handler({ onAuthorization: undefined })(socket, next)).toBeFalsy();
    });
    it(`Should return an error and the result is not a string`, done => {
      const socket = {
        handshake: {
          auth: {
            token: TOKEN,
          },
        },
      };
      const next = (error: Boom) => {
        expect(error.message).toEqual('Malformed request, malformed authorization token');
        done();
      };
      jest.spyOn(jwt, 'verify').mockImplementation(
        //@ts-ignore - We are testing the middleware
        (token: any, secret: any, options: any, cb: (error: any, decoded: any) => void) => {
          cb(null, 'myToken');
        }
      );
      //@ts-ignore - We are testing the middleware
      expect(AuthZ.handler({ onAuthorization: undefined })(socket, next)).toBeFalsy();
    });
  });
  describe('#Sad path', () => {});
});
