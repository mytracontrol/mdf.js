/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Handler } from './Handler';

const VERSION_BUFFER = Buffer.from([0x41, 0x4d, 0x51, 0x50, 0x03, 0x01, 0x00, 0x00]);
const VERSION_FRAME = {
  name: 'AMQP',
  protocolId: 3,
  major: 1,
  minor: 0,
  revision: 0,
};
describe('#AMQP #Protocol #Frames #Version', () => {
  describe('#Happy Path', () => {
    it(`Should serialize a Version frame`, () => {
      expect(Handler.serialize(VERSION_FRAME)).toEqual(VERSION_BUFFER);
    });
    it(`Should deserialize a Version buffer`, () => {
      expect(Handler.deserialize(VERSION_BUFFER)).toEqual(VERSION_FRAME);
    });
  });
  describe('#Sad Path', () => {
    it(`Should throw an error when deserializing an invalid buffer if the size is not correct`, () => {
      expect(() =>
        Handler.deserialize(Buffer.from([0x42, 0x4d, 0x51, 0x50, 0x03, 0x01, 0x00]))
      ).toThrow(`Invalid buffer size for Version frame, expected 8 but got 7`);
    });
    it(`Should throw an error when deserializing an invalid protocol name`, () => {
      expect(() =>
        Handler.deserialize(Buffer.from([0x41, 0x4d, 0x51, 0x51, 0x03, 0x01, 0x00, 0x00]))
      ).toThrow(`Invalid protocol header for AMQP, expected 'AMQP' but got 'AMQQ'`);
    });
    it(`Should throw an error when deserializing an invalid protocol id`, () => {
      expect(() =>
        Handler.deserialize(Buffer.from([0x41, 0x4d, 0x51, 0x50, 0x04, 0x01, 0x00, 0x00]))
      ).toThrow(
        `Unsupported AMQP protocol identifier: {\"name\":\"AMQP\",\"protocolId\":4,\"major\":1,\"minor\":0,\"revision\":0}`
      );
    });
    it(`Should throw an error when deserializing an unsupported protocol version`, () => {
      expect(() =>
        Handler.deserialize(Buffer.from([0x41, 0x4d, 0x51, 0x50, 0x03, 0x02, 0x00, 0x00]))
      ).toThrow(
        `Unsupported AMQP protocol version: {\"name\":\"AMQP\",\"protocolId\":3,\"major\":2,\"minor\":0,\"revision\":0}`
      );
    });
  });
});
