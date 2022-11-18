/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Control } from '../types';
import { Accessors } from './Accessors';

const COMMAND: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Query,
    target: {
      'x-netin:alarms': { entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' },
    },
    actuator: {
      'x-netin': { asset_id: 'myConsumer1' },
    },
    command_id: 'myCommandId',
    args: {
      duration: 50,
    },
  },
};
const RESPONSE: Control.ResponseMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Response,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myConsumer',
  to: ['myProducer'],
  status: Control.StatusCode.OK,
  content: {
    status: Control.StatusCode.OK,
    results: {},
  },
};
describe('#Accessors', () => {
  describe('#Happy path', () => {
    it('Should return the target of the actual message', () => {
      const target = Accessors.getTargetFromCommandMessage(COMMAND);
      expect(target).toEqual('x-netin:alarms');
    }, 300);
    it('Should return the target of the actual command', () => {
      const target = Accessors.getTargetFromCommand(COMMAND.content);
      expect(target).toEqual('x-netin:alarms');
    }, 300);
    it('Should return the action of the actual message', () => {
      const action = Accessors.getActionFromCommandMessage(COMMAND);
      expect(action).toEqual(Control.Action.Query);
    }, 300);
    it('Should return the action of the actual command', () => {
      const action = Accessors.getActionFromCommand(COMMAND.content);
      expect(action).toEqual(Control.Action.Query);
    }, 300);
    it('Should return the actuator of the actual message', () => {
      const actuator = Accessors.getActuatorsFromCommandMessage(COMMAND);
      expect(actuator).toEqual(['x-netin']);
    }, 300);
    it('Should return the actuator of the actual command', () => {
      const actuator = Accessors.getActuatorsFromCommand(COMMAND.content);
      expect(actuator).toEqual(['x-netin']);
    }, 300);
    it('Should return the asset_id of the actual command', () => {
      expect(Accessors.getActuatorAssetId(COMMAND.content, 'x-netin')).toEqual('myConsumer1');
      //@ts-ignore - Test environment
      expect(Accessors.getActuatorAssetId(COMMAND.content, undefined)).toBeUndefined();
    }, 300);
    it('Should return the delay of the actual message', () => {
      expect(Accessors.getDelayFromCommandMessage(COMMAND)).toEqual(50);
      expect(
        Accessors.getDelayFromCommandMessage({
          ...COMMAND,
          content: {
            ...COMMAND.content,
            args: {
              stop_time: Date.now() + 50,
            },
          },
        })
      ).toBeLessThanOrEqual(50);
      expect(
        Accessors.getDelayFromCommandMessage({
          ...COMMAND,
          content: {
            ...COMMAND.content,
            args: {
              start_time: Date.now(),
              duration: 50,
            },
          },
        })
      ).toBeLessThanOrEqual(50);
      expect(
        Accessors.getDelayFromCommandMessage({
          ...COMMAND,
          content: {
            ...COMMAND.content,
            args: {
              start_time: Date.now() - 100,
              duration: 1,
            },
          },
        })
      ).toEqual(30000);
    }, 300);
    it('Should return the delay of the actual command', () => {
      const delay = Accessors.getDelayFromCommand(COMMAND.content);
      expect(delay).toEqual(50);
    }, 300);
    it('Should return the status of the actual message', () => {
      expect(Accessors.getStatusFromResponseMessage(RESPONSE)).toEqual('pass');
      expect(
        Accessors.getStatusFromResponseMessage({
          ...RESPONSE,
          status: Control.StatusCode.InternalError,
        })
      ).toEqual('fail');
      expect(
        Accessors.getStatusFromResponseMessage({
          ...RESPONSE,
          status: Control.StatusCode.Processing,
        })
      ).toEqual('warn');
    }, 300);
  });
  describe('#Sad path', () => {});
});
