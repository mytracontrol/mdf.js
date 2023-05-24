/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ConsumerOptions, Control } from '../types';
import { Checkers } from './Checkers';

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
const COMMAND_QUERY_OUT_OF_TIME: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Query,
    target: {
      features: [
        Control.Features.Pairs,
        Control.Features.Profiles,
        Control.Features.RateLimit,
        Control.Features.Versions,
      ],
    },
    command_id: 'myCommandId',
    args: {
      start_time: 0,
      duration: 30000,
      response_requested: Control.ResponseType.Complete,
    },
  },
};
const COMMAND_INVALID_QUERY: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Query,
    target: {
      features: [
        Control.Features.Pairs,
        Control.Features.Profiles,
        Control.Features.RateLimit,
        Control.Features.Versions,
      ],
    },
    command_id: 'myCommandId',
    args: {
      response_requested: Control.ResponseType.ACK,
    },
  },
};
const COMMAND_WO_RESPONSE: Control.CommandMessage = {
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
    args: {
      response_requested: Control.ResponseType.None,
    },
    command_id: 'myCommandId',
  },
};
const COMMAND_ONLY_ACK: Control.CommandMessage = {
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
    args: {
      response_requested: Control.ResponseType.ACK,
    },
    command_id: 'myCommandId',
  },
};
const COMMAND_NO_IMPLEMENTED: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['*'],
  content: {
    action: Control.Action.Delete,
    target: {
      'x-netin:alarms': { entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' },
    },
    args: {
      response_requested: Control.ResponseType.Complete,
    },
    command_id: 'myCommandId',
  },
};
const consumerOptions: ConsumerOptions = {
  id: 'myId',
  actionTargetPairs: {
    query: ['features', 'x-netin:alarms', 'x-netin:devices'],
  },
  profiles: ['x-netin'],
  actuator: ['myActuator'],
  registerLimit: 2,
};
describe('#Checkers', () => {
  describe('#Happy path', () => {
    it('Should not throw if the message is valid', () => {
      expect(Checkers.isValidMessageSync(COMMAND, COMMAND.request_id)).toEqual(COMMAND);
    }, 300);
    it('Should not reject if the message is valid', async () => {
      expect(await Checkers.isValidMessage(COMMAND, COMMAND.request_id)).toEqual(COMMAND);
    }, 300);
    it('Should not throw if the command is valid', () => {
      expect(Checkers.isValidCommandSync(COMMAND, COMMAND.request_id)).toEqual(COMMAND);
    }, 300);
    it('Should not reject if the command is valid', async () => {
      expect(await Checkers.isValidCommand(COMMAND, COMMAND.request_id)).toEqual(COMMAND);
    }, 300);
    it('Should not throw if the response is valid', () => {
      expect(Checkers.isValidResponseSync(RESPONSE, RESPONSE.request_id)).toEqual(RESPONSE);
    }, 300);
    it('Should not reject if the response is valid', async () => {
      expect(await Checkers.isValidResponse(RESPONSE, RESPONSE.request_id)).toEqual(RESPONSE);
    }, 300);
    it('Should return a bad request response if the command is out of time', () => {
      const response = Checkers.hasDefaultResponse(COMMAND_QUERY_OUT_OF_TIME, consumerOptions);
      expect(response?.status).toEqual(Control.StatusCode.BadRequest);
      expect(response?.content?.status_text).toEqual('Command is out of time');
    }, 300);
    it('Should return a bad request response if the command is a invalid query features', () => {
      const response = Checkers.hasDefaultResponse(COMMAND_INVALID_QUERY, consumerOptions);
      expect(response?.status).toEqual(Control.StatusCode.BadRequest);
      expect(response?.content?.status_text).toEqual('Invalid Query Features');
    }, 300);
    it('Should return a not implemented response if the command is not supported', () => {
      const response = Checkers.hasDefaultResponse(COMMAND_NO_IMPLEMENTED, consumerOptions);
      expect(response?.status).toEqual(Control.StatusCode.NotImplemented);
      expect(response?.content?.status_text).toEqual('Command not supported');
    }, 300);
    it('Should return true if the command is for this instance', () => {
      expect(Checkers.isCommandToInstance(COMMAND, 'myInstance')).toEqual(true);
      expect(
        Checkers.isCommandToInstance({ ...COMMAND, to: ['myInstance'] }, 'myInstance')
      ).toEqual(true);
      expect(
        Checkers.isCommandToInstance(
          //@ts-ignore - Test environment
          { ...COMMAND, msg_type: Control.MessageType.Response },
          'myInstance'
        )
      ).toEqual(false);
      expect(
        Checkers.isCommandToInstance(
          //@ts-ignore - Test environment
          { ...COMMAND, from: 'myInstance' },
          'myInstance'
        )
      ).toEqual(false);
    }, 300);
    it('Should return true if the response is for this instance', () => {
      expect(Checkers.isResponseToInstance(RESPONSE, 'myProducer', RESPONSE.request_id)).toEqual(
        true
      );
      expect(
        Checkers.isResponseToInstance({ ...RESPONSE, to: ['*'] }, 'myProducer', RESPONSE.request_id)
      ).toEqual(true);
      expect(Checkers.isResponseToInstance({ ...RESPONSE, to: ['*'] }, '*', 'other')).toEqual(
        false
      );
      expect(
        Checkers.isResponseToInstance(
          //@ts-ignore - Test environment
          { ...RESPONSE, msg_type: Control.MessageType.Command },
          'myProducer',
          RESPONSE.request_id
        )
      ).toEqual(false);
    }, 300);
    it('Should check if the command is on timeout', () => {
      expect(Checkers.isOnTime(COMMAND)).toEqual(true);
      expect(
        Checkers.isOnTime({
          ...COMMAND,
          content: {
            ...COMMAND.content,
            args: {
              start_time: 100,
              stop_time: 200,
              duration: 100,
            },
          },
        })
      ).toEqual(false);
      const date = Date.now() - 1;
      expect(
        Checkers.isOnTime({
          ...COMMAND,
          content: {
            ...COMMAND.content,
            args: {
              stop_time: date,
              duration: 100,
            },
          },
        })
      ).toEqual(false);
    });
    it('Should check if the command request a supported action', () => {
      expect(Checkers.isSupportedAction(COMMAND, consumerOptions.actionTargetPairs)).toEqual(true);
      expect(
        Checkers.isSupportedAction(COMMAND_NO_IMPLEMENTED, consumerOptions.actionTargetPairs)
      ).toEqual(false);
    });
    it('Should check if the command request has a defined delay', () => {
      expect(
        Checkers.isDelayDefinedOnCommand({
          ...COMMAND.content,
          args: { start_time: 10, duration: 10 },
        })
      ).toEqual(true);
      expect(
        Checkers.isDelayDefinedOnCommand({
          ...COMMAND.content,
          args: { stop_time: 10 },
        })
      ).toEqual(true);
      expect(
        Checkers.isDelayDefinedOnCommand({
          ...COMMAND.content,
          args: { start_time: 10 },
        })
      ).toEqual(false);
      expect(
        Checkers.isDelayDefinedOnCommand({
          ...COMMAND.content,
          args: { start_time: 10, duration: 10, stop_time: 10 },
        })
      ).toEqual(false);
      expect(
        Checkers.isDelayDefinedOnCommand({
          ...COMMAND.content,
          args: {},
        })
      ).toEqual(false);
      expect(
        Checkers.isDelayDefinedOnCommand({
          ...COMMAND.content,
          args: { start_time: 10, stop_time: 10 },
        })
      ).toEqual(true);
    });
  });
  describe('#Sad path', () => {});
});
