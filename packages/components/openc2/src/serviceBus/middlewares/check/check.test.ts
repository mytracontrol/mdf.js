/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Boom } from '@mdf.js/crash';
import { Check } from './check';

describe('#Check #middleware', () => {
  describe('#Happy path', () => {
    it('Should check if the socket connection is correct or not', () => {
      const socket = {
        handshake: {
          auth: {
            type: 'consumer',
            nodeId: 'nodeId',
            actuators: ['actuator1', 'actuator2'],
          },
        },
        data: {
          openC2Id: undefined,
          type: undefined,
          actuators: undefined,
        },
      };
      const next = () => {};
      //@ts-ignore - We are testing the middleware
      expect(Check.handler()(socket, next)).toBeTruthy();
      expect(socket.data).toEqual({
        openC2Id: 'nodeId',
        type: 'consumer',
        actuators: ['actuator1', 'actuator2'],
      });
    });
    it('Should return an error if the socket is valid', done => {
      const socket = {
        handshake: {
          auth: {
            type: 2,
            nodeId: 'nodeId',
            actuators: ['actuator1', 'actuator2'],
          },
        },
      };
      const next = (error: Boom) => {
        expect(error.message).toEqual('Malformed request, malformed authorization token');
        done();
      };
      //@ts-ignore - We are testing the middleware
      expect(Check.handler()(socket, next)).toBeFalsy();
    });
  });
  describe('#Sad path', () => {});
});
