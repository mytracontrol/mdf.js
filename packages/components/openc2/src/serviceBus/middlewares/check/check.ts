/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Netin System S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Netin System S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Netin System S.L.
 */
import { BoomHelpers } from '@mdf.js/crash';
import { Socket } from 'socket.io';
import { v4 } from 'uuid';
import { SocketIOMiddleware, SocketIONextFunction, transformError } from '..';

/**
 * Check the token of the request
 * @param role - role to be checked
 * @returns
 */
function check(): SocketIOMiddleware {
  return (socket: Socket, next: SocketIONextFunction) => {
    const auth = socket.handshake.auth;
    const isValidType = auth['type'] === 'producer' || auth['type'] === 'consumer';
    const isValidId = typeof auth['nodeId'] === 'string';
    let isValidActuators = true;
    if (auth['actuators']) {
      isValidActuators =
        Array.isArray(auth['actuators']) &&
        auth['actuators'].every(actuator => typeof actuator === 'string');
    }
    if (isValidType && isValidId && isValidActuators) {
      socket.data['openC2Id'] = socket.handshake.auth['nodeId'];
      socket.data['type'] = socket.handshake.auth['type'];
      if (auth['actuators']) {
        socket.data['actuators'] = auth['actuators'];
      }
      next();
    } else {
      next(
        transformError(
          BoomHelpers.badRequest(`Malformed request, malformed authorization token`, v4())
        )
      );
    }
    return isValidType && isValidId && isValidActuators;
  };
}

/** Check */
export class Check {
  /**
   * Check if the client has request the connection with valid credentials
   * @returns
   */
  public static handler(): SocketIOMiddleware {
    return check();
  }
}
