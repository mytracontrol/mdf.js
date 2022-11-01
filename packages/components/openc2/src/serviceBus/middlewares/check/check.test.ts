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
