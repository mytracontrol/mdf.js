/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolError';
    Error.captureStackTrace(this, ProtocolError);
  }
}

export class TypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TypeError';
    Error.captureStackTrace(this, TypeError);
  }
}

export class ConnectionError extends Error {
  public description: string;
  constructor(
    message: string,
    public condition: any,
    public connection: any
  ) {
    super(message);
    this.name = 'ConnectionError';
    this.description = message;
    Error.captureStackTrace(this, ConnectionError);
  }
  public toJSON() {
    return {
      type: this.name,
      code: this.condition,
      message: this.description,
    };
  }
}
