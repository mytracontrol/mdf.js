/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Crash } from '@mdf.js/crash';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { Consumer, Gateway, Producer } from '.';
import {
  CommandJobHandler,
  ConsumerAdapter,
  ConsumerOptions,
  Control,
  GatewayOptions,
  OnCommandHandler,
  ProducerAdapter,
  ProducerOptions,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP: () => void = () => {};
const producerOptions: ProducerOptions = {
  id: 'myProducer',
  registerLimit: 2,
  lookupInterval: 100,
  lookupTimeout: 50,
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
const gatewayOptions: GatewayOptions = {
  id: 'myGateway',
  actionTargetPairs: {},
  profiles: [],
  registerLimit: 2,
};
class MyProducerAdapter extends EventEmitter implements ProducerAdapter {
  name = 'myAdapter';
  componentId = v4();
  checks = {};
  publish(
    message: Control.CommandMessage
  ): Promise<Control.ResponseMessage | Control.ResponseMessage[] | void> {
    this.emit('message', message);
    return Promise.resolve();
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
  stop(): Promise<void> {
    return Promise.resolve();
  }
  subcomponents = [];
  publishers = [];
  subscribers = [];
}
class MyConsumerAdapter extends EventEmitter implements ConsumerAdapter {
  name = 'myAdapter';
  componentId = v4();
  checks = {};
  handler?: OnCommandHandler;
  subscribe(handler: OnCommandHandler): Promise<void> {
    this.handler = handler;
    return Promise.resolve();
  }
  unsubscribe(handler: OnCommandHandler): Promise<void> {
    this.handler = undefined;
    return Promise.resolve();
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
  stop(): Promise<void> {
    return Promise.resolve();
  }
  subcomponents = [];
  publishers = [];
  subscribers = [];
}
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
    command_id: 'myCommandId',
    args: {
      duration: 50,
    },
  },
};
const COMMAND_QUERY: Control.CommandMessage = {
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
      response_requested: Control.ResponseType.Complete,
    },
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
const COMMAND_NO_IMPLEMENTED_TO_OTHER_TARGET: Control.CommandMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Command,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  created: 100,
  from: 'myProducer',
  to: ['otherTarget'],
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
const RESPOND_TO_ALL: Control.ResponseMessage = {
  content_type: 'application/openc2+json;version=1.0',
  msg_type: Control.MessageType.Response,
  request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
  status: 102,
  created: Date.now(),
  from: 'myId',
  to: ['myProducer', '*'],
  content: {
    status: 102,
    status_text: undefined,
    results: undefined,
  },
};
describe('#OpenC2 #Components', () => {
  describe('#Happy path', () => {
    it(`Should perform a valid lookup to several consumers`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'producer',
        lookupInterval: 100,
        lookupTimeout: 50,
      });
      producer.consumerMap.on('updated', nodes => {
        expect(nodes).toEqual(['consumer1', 'consumer2']);
        const checks = producer.checks['producer:consumers'];
        expect(checks).toEqual([
          {
            componentId: 'consumer1',
            componentType: 'OpenC2 Consumer',
            time: checks[0].time,
            status: 'pass',
            observedValue: {
              status: 200,
              status_text: undefined,
              results: {
                pairs: {
                  query: ['features', 'x-netin:alarms', 'x-netin:devices'],
                },
                rate_limit: 5,
                profiles: ['x-netin'],
                versions: ['1.0'],
              },
            },
            observedUnit: 'features',
          },
          {
            componentId: 'consumer2',
            componentType: 'OpenC2 Consumer',
            time: checks[1].time,
            status: 'pass',
            observedValue: {
              status: 200,
              status_text: undefined,
              results: {
                pairs: {
                  query: ['features', 'x-netin:alarms', 'x-netin:devices'],
                },
                rate_limit: 5,
                profiles: ['x-netin'],
                versions: ['1.0'],
              },
            },
            observedUnit: 'features',
          },
        ]);
        Promise.all([consumer1.stop(), consumer2.stop(), producer.stop()]).then();
        done();
      });
      Promise.all([consumer1.start(), consumer2.start(), producer.start()]).then();
    }, 300);
    it(`Should perform a valid command from REST interface directly over the consumer`, done => {
      const consumerAdapter = new MyConsumerAdapter();
      const consumer = new Consumer(consumerAdapter, {
        ...consumerOptions,
        id: 'consumer1',
        resolver: {
          'query:x-netin:alarms': (target: any) => {
            expect(target).toEqual({ entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' });
            return Promise.resolve(undefined);
          },
        },
      });
      const onResponse = (
        error?: Crash,
        responses?: Control.ResponseMessage | Control.ResponseMessage[]
      ) => {
        if (error) {
          throw error;
        } else if (responses) {
          const response = Array.isArray(responses) ? responses[0] : responses;
          expect(response.request_id).toEqual(COMMAND.request_id);
          Promise.all([consumer.stop()]).then();
          done();
        }
      };
      // @ts-ignore - we are testing the REST interface
      consumer._router.emit('command', COMMAND, onResponse);
    }, 300);
    it(`Should perform a valid command to several consumers, omitting responses for other providers or acks`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
            producerAdapter.emit(response.request_id, { ...response, to: ['otherTarget'] });
            producerAdapter.emit(response.request_id, { ...response, status: 102 });
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, {
        ...consumerOptions,
        id: 'consumer1',
        resolver: {
          'query:x-netin:alarms': (target: any) => {
            expect(target).toEqual({ entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' });
            return Promise.resolve(undefined);
          },
        },
      });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      const onJob = (commandJob: CommandJobHandler) => {
        expect(commandJob.data).toEqual({ ...COMMAND, created: date });
        commandJob.done();
      };
      consumer2.on('command', onJob);
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      const responses = await producer.command({ ...COMMAND, created: date });
      expect(responses).toEqual([
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[0].created,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[1].created,
          from: 'consumer2',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
      ]);
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
    }, 300);
    it(`Should perform a valid command to several consumers, omitting responses for other providers or acks when command comes from REST interface`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
            producerAdapter.emit(response.request_id, { ...response, to: ['otherTarget'] });
            producerAdapter.emit(response.request_id, { ...response, status: 102 });
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, {
        ...consumerOptions,
        id: 'consumer1',
        resolver: {
          'query:x-netin:alarms': (target: any) => {
            expect(target).toEqual({ entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' });
            return Promise.resolve(undefined);
          },
        },
      });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      const onJob = (commandJob: CommandJobHandler) => {
        expect(commandJob.data).toEqual({ ...COMMAND, created: date });
        commandJob.done();
      };
      consumer2.on('command', onJob);
      const onResponse = (error?: Crash, responses?: Control.ResponseMessage[]) => {
        if (error) {
          throw error;
        } else if (responses) {
          expect(responses).toEqual([
            {
              content_type: 'application/openc2+json;version=1.0',
              msg_type: 'response',
              request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
              status: 200,
              created: responses[0].created,
              from: 'consumer1',
              to: ['myProducer'],
              content: {
                status: 200,
                status_text: undefined,
                results: undefined,
              },
            },
            {
              content_type: 'application/openc2+json;version=1.0',
              msg_type: 'response',
              request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
              status: 200,
              created: responses[1].created,
              from: 'consumer2',
              to: ['myProducer'],
              content: {
                status: 200,
                status_text: undefined,
                results: undefined,
              },
            },
          ]);
          Promise.all([consumer1.stop(), consumer2.stop(), producer.stop()]).then(() => done());
        }
      };
      Promise.all([consumer1.start(), consumer2.start(), producer.start()]).then(() => {
        // @ts-ignore - we are testing the REST interface
        producer._router.emit('command', { ...COMMAND, created: date }, onResponse);
      });
    }, 300);
    it(`Should perform a valid command to several consumers, omitting responses for other providers or acks, with direct responses`, async () => {
      const producerAdapter = new MyProducerAdapter();
      jest.spyOn(producerAdapter, 'publish').mockResolvedValue([
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: Control.MessageType.Response,
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: 1000,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: Control.MessageType.Response,
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: 1000,
          from: 'consumer2',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
      ]);
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      await producer.start();
      const responses = await producer.command({ ...COMMAND, created: date });
      expect(responses).toEqual([
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[0].created,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[1].created,
          from: 'consumer2',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
      ]);
      await producer.stop();
      jest.clearAllMocks();
    }, 300);
    it(`Should perform a valid command to one consumer, omitting responses for other providers or acks`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, { ...response, to: ['otherTarget'] });
            producerAdapter.emit(response.request_id, { ...response, status: 102 });
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      const responses = await producer.command(
        ['consumer1'],
        COMMAND.content.action,
        COMMAND.content.target
      );
      expect(responses).toEqual([
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: responses[0].request_id,
          status: 200,
          created: responses[0].created,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
      ]);
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
    }, 300);
    it(`Should perform a valid command to one consumer, omitting responses for other providers or acks, with direct responses`, async () => {
      const producerAdapter = new MyProducerAdapter();
      jest.spyOn(producerAdapter, 'publish').mockImplementation(() => {
        return Promise.resolve({
          content_type: 'application/openc2+json;version=1.0',
          msg_type: Control.MessageType.Response,
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: 1000,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: 'Sometimes i see dead people',
            results: undefined,
          },
        });
      });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      await producer.start();
      const responses = await producer.command({ ...COMMAND, to: ['consumer1'], created: date });
      expect(responses).toEqual([
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[0].created,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: 'Sometimes i see dead people',
            results: undefined,
          },
        },
      ]);
      await producer.stop();
      jest.clearAllMocks();
    }, 300);
    it(`Should reject with a 400 status if the command is out of time`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      await consumer1.start();
      await producer.start();
      try {
        await producer.command({ ...COMMAND_QUERY_OUT_OF_TIME, to: ['consumer1'] });
      } catch (error: any) {
        expect(error.message).toEqual('Command was not fulfilled: [status 400]');
      }
      await consumer1.stop();
      await producer.stop();
    }, 300);
    it(`Should reject with a 501 status if the command is not implemented`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      await consumer1.start();
      await producer.start();
      try {
        await producer.command({ ...COMMAND_NO_IMPLEMENTED, to: ['consumer1'] });
      } catch (error: any) {
        expect(error.message).toEqual('Command was not fulfilled: [status 501]');
      }
      await consumer1.stop();
      await producer.stop();
    }, 300);
    it(`Should reject with a 400 status if the command is incorrect`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      await consumer1.start();
      await producer.start();
      try {
        await producer.command({ ...COMMAND_INVALID_QUERY, to: ['consumer1'] });
      } catch (error: any) {
        expect(error.message).toEqual('Command was not fulfilled: [status 400]');
      }
      await consumer1.stop();
      await producer.stop();
    }, 300);
    it(`Should reject with a 400 status if the command is incorrect when command comes from REST interface`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const responseHandler = (error?: Crash, responses?: Control.ResponseMessage[]) => {
        if (responses) {
          throw new Error('Should not be here');
        } else if (error) {
          expect(error.message).toEqual('Command was not fulfilled: [status 400]');
          Promise.all([consumer1.stop(), producer.stop()]).then(() => done());
        } else {
          throw new Error('Should not be here');
        }
      };
      Promise.all([consumer1.start(), producer.start()]).then(() => {
        // @ts-ignore - we are testing the REST interface
        producer._router.emit(
          'command',
          { ...COMMAND_INVALID_QUERY, to: ['consumer1'] },
          responseHandler
        );
      });
    }, 300);
    it(`Should resolve an empty array if the command does not request response`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      await consumer1.start();
      await producer.start();
      const responses = await producer.command({ ...COMMAND_WO_RESPONSE, to: ['consumer1'] });
      expect(responses).toEqual([]);
      await consumer1.stop();
      await producer.stop();
    }, 300);
    it(`Should resolve with a 102 status if the command request ack`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      await consumer1.start();
      await producer.start();
      const responses = await producer.command({ ...COMMAND_ONLY_ACK, to: ['consumer1'] });
      expect(responses).toEqual([
        {
          content: {
            results: undefined,
            status: 102,
            status_text: 'Command accepted',
          },
          content_type: 'application/openc2+json;version=1.0',
          created: responses[0].created,
          from: 'consumer1',
          msg_type: 'response',
          request_id: responses[0].request_id,
          status: 102,
          to: ['myProducer'],
        },
      ]);
      await consumer1.stop();
      await producer.stop();
    }, 300);
    it(`Should perform a valid command to one consumer, omitting responses for other providers or acks, behind a Gateway`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      const gatewayConsumer = new MyConsumerAdapter();
      const gatewayProducer = new MyProducerAdapter();

      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (gatewayConsumer.handler) {
          gatewayConsumer.handler(message, onResponse);
        }
      });
      gatewayProducer.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            gatewayProducer.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });

      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const gateway = new Gateway(gatewayConsumer, gatewayProducer, {
        ...gatewayOptions,
        bypassLookupIntervalChecks: true,
        lookupInterval: 100,
        lookupTimeout: 50,
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      gateway.consumerMap.on('updated', () => {
        producer
          .command({
            ...COMMAND,
            created: new Date().getTime(),
            to: ['myGateway'],
            content: { ...COMMAND.content, args: { duration: 30000 } },
          })
          .then(responses => {
            expect(responses).toEqual([
              {
                content_type: 'application/openc2+json;version=1.0',
                msg_type: 'response',
                request_id: responses[0].request_id,
                status: 200,
                created: responses[0].created,
                from: 'myGateway',
                to: ['myProducer'],
                content: {
                  status: 200,
                  status_text: undefined,
                  results: undefined,
                },
              },
            ]);
          })
          .then(() => Promise.all([consumer1.stop(), producer.stop(), gateway.stop()]))
          .then(() => done());
      });
      Promise.all([consumer1.start(), producer.start(), gateway.start()]).then();
    }, 300);
    it(`Should perform a valid command to several consumers, omitting responses for other providers or acks, behind a Gateway`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      const gatewayConsumer = new MyConsumerAdapter();
      const gatewayProducer = new MyProducerAdapter();

      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (gatewayConsumer.handler) {
          gatewayConsumer.handler(message, onResponse);
        }
      });
      gatewayProducer.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            gatewayProducer.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });

      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const gateway = new Gateway(gatewayConsumer, gatewayProducer, {
        ...gatewayOptions,
        bypassLookupIntervalChecks: true,
        lookupInterval: 100,
        lookupTimeout: 50,
        delay: 5,
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      gateway.consumerMap.on('updated', () => {
        producer
          .command({
            ...COMMAND,
            created: new Date().getTime(),
            to: ['*'],
            content: { ...COMMAND.content, args: { duration: 100 } },
          })
          .then(responses => {
            expect(responses).toEqual([
              {
                content_type: 'application/openc2+json;version=1.0',
                msg_type: 'response',
                request_id: responses[0].request_id,
                status: 200,
                created: responses[0].created,
                from: 'myGateway',
                to: ['myProducer'],
                content: {
                  status: 200,
                  status_text: undefined,
                  results: undefined,
                },
              },
            ]);
          })
          .then(() =>
            Promise.all([consumer1.stop(), consumer2.stop(), producer.stop(), gateway.stop()])
          )
          .then(() => done());
      });
      Promise.all([consumer1.start(), consumer2.start(), producer.start(), gateway.start()]).then();
    }, 300);
    it(`Should perform a valid command to one consumer using asset_id, omitting responses for other providers or acks, behind a Gateway`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      const gatewayConsumer = new MyConsumerAdapter();
      const gatewayProducer = new MyProducerAdapter();

      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (gatewayConsumer.handler) {
          gatewayConsumer.handler(message, onResponse);
        }
      });
      gatewayProducer.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            gatewayProducer.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });

      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const gateway = new Gateway(gatewayConsumer, gatewayProducer, {
        ...gatewayOptions,
        bypassLookupIntervalChecks: true,
        lookupInterval: 100,
        lookupTimeout: 50,
        delay: 5,
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      gateway.consumerMap.on('updated', () => {
        producer
          .command({
            ...COMMAND,
            created: new Date().getTime(),
            to: ['myGateway'],
            content: {
              ...COMMAND.content,
              args: { duration: 100 },
              actuator: {
                'x-netin': {
                  asset_id: 'consumer1',
                },
              },
            },
          })
          .then(responses => {
            expect(responses).toEqual([
              {
                content_type: 'application/openc2+json;version=1.0',
                msg_type: 'response',
                request_id: responses[0].request_id,
                status: 200,
                created: responses[0].created,
                from: 'myGateway',
                to: ['myProducer'],
                content: {
                  status: 200,
                  status_text: undefined,
                  results: undefined,
                },
              },
            ]);
          })
          .then(() =>
            Promise.all([consumer1.stop(), consumer2.stop(), producer.stop(), gateway.stop()])
          )
          .then(() => done());
      });
      Promise.all([consumer1.start(), consumer2.start(), producer.start(), gateway.start()]).then();
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should reject the command if the consumer add errors to the job`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, {
        ...consumerOptions,
        id: 'consumer1',
        resolver: {
          'query:x-netin:alarms': (target: any) => {
            expect(target).toEqual({ entity: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c' });
            return Promise.reject(new Crash(`myError`));
          },
        },
      });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      const onJob = (commandJob: CommandJobHandler) => {
        expect(commandJob.data).toEqual({ ...COMMAND, to: ['consumer1'], created: date });
        commandJob.done(new Crash(`myError`));
      };
      consumer2.on('command', onJob);
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      try {
        await producer.command({ ...COMMAND, to: ['consumer1'], created: date });
      } catch (error: any) {
        expect(error.message).toEqual(`Command was not fulfilled: [status 500]`);
      }
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
    }, 300);
    it(`Should reject the command if there is a problem in the registry and the command is not present`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      //@ts-ignore - Test environment
      jest.spyOn(consumer1.register, 'delete').mockReturnValue(undefined);
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      const onJob = (commandJob: CommandJobHandler) => {
        expect(commandJob.data).toEqual({ ...COMMAND, to: ['consumer1'], created: date });
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      try {
        await producer.command({ ...COMMAND, to: ['consumer1'], created: date });
      } catch (error: any) {
        expect(error.message).toEqual(`Command was not fulfilled: [status 500]`);
      }
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
      jest.clearAllMocks();
    }, 300);
    it(`Should reject the command if there is a problem in the command validation in the producer side`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      const onJob = (commandJob: CommandJobHandler) => {
        expect(commandJob.data).toEqual({ ...COMMAND, to: ['consumer1'], created: date });
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      producer.on('error', error => {
        expect(error.message).toEqual(`Errors during the schema validation process`);
      });
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      try {
        //@ts-ignore - Test environment
        await producer.command({});
      } catch (error: any) {
        expect(error.message).toEqual(`Errors during the schema validation process`);
      }
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
    }, 300);
    it(`Should reject the command if there is a problem in the command validation in the producer side, wrong command schema`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, { ...response, status: 'a' });
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      producer.on('error', error => {
        expect(error.message).toEqual(
          `Error processing incoming response message from control chanel: Errors during the schema validation process`
        );
      });
      Promise.all([consumer1.start(), producer.start()])
        .then(() =>
          producer.command({
            ...COMMAND,
            content: { ...COMMAND.content, args: { duration: 50 } },
            to: ['consumer1'],
          })
        )
        .then(() => {
          done(new Error('Should not be here'));
        })
        .catch(error => {
          expect(error.message).toEqual(
            `Response timeout for the command 3b6771cb-1ca6-4c1f-a06e-0b413872cd5c [query]`
          );
          Promise.all([consumer1.stop(), producer.stop()])
            .then(() => {
              producer.removeAllListeners();
              done();
            })
            .catch(error => {
              console.log(error);
            });
        });
    }, 300);
    it(`Should reject the command if there is a problem in the command validation in the consumer side`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            expect(error.message).toEqual(
              `Error processing incoming command message from control chanel: Errors during the schema validation process`
            );
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          //@ts-ignore - Test environment
          consumerAdapter1.handler({}, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      const onJob = (commandJob: CommandJobHandler) => {
        expect(commandJob.data).toEqual({ ...COMMAND, to: ['consumer1'], created: date });
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer1.on('error', error => {
        expect(error.message).toEqual(
          `Error processing incoming command message from control chanel: Errors during the schema validation process`
        );
      });
      consumer2.on('command', onJob);
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      try {
        await producer.command({ ...COMMAND, to: ['consumer1'], created: date });
        throw new Error(`Should throw an error`);
      } catch (error: any) {
        expect(error.message).toEqual(
          `Response timeout for the command 3b6771cb-1ca6-4c1f-a06e-0b413872cd5c [query]`
        );
      }
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
    }, 300);
    it(`Should emit an error if an incoming response is invalid and reject with timeout`, async () => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
            producerAdapter.emit(response.request_id, {});
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });
      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      let numberOfError = 0;
      producer.on('error', error => {
        numberOfError++;
        expect(error.message).toEqual(
          `Error processing incoming response message from control chanel: Errors during the schema validation process`
        );
      });
      await consumer1.start();
      await consumer2.start();
      await producer.start();
      const responses = await producer.command({
        ...COMMAND,
        to: ['*'],
        created: new Date().getTime(),
        content: { ...COMMAND.content, args: { duration: 50 } },
      });
      expect(responses).toEqual([
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[0].created,
          from: 'consumer1',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
        {
          content_type: 'application/openc2+json;version=1.0',
          msg_type: 'response',
          request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
          status: 200,
          created: responses[1].created,
          from: 'consumer2',
          to: ['myProducer'],
          content: {
            status: 200,
            status_text: undefined,
            results: undefined,
          },
        },
      ]);
      await consumer1.stop();
      await consumer2.stop();
      await producer.stop();
      expect(numberOfError).toEqual(2);
    }, 300);
    it(`Should reject command if the consumer return several responses to the command`, async () => {
      const producerAdapter = new MyProducerAdapter();
      jest.spyOn(producerAdapter, 'publish').mockImplementation(() => {
        return Promise.resolve([
          {
            content_type: 'application/openc2+json;version=1.0',
            msg_type: Control.MessageType.Response,
            request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
            status: 200,
            created: 1000,
            from: 'consumer1',
            to: ['myProducer'],
            content: {
              status: 200,
              status_text: 'Sometimes i see dead people',
              results: undefined,
            },
          },
          {
            content_type: 'application/openc2+json;version=1.0',
            msg_type: Control.MessageType.Response,
            request_id: '3b6771cb-1ca6-4c1f-a06e-0b413872cd5c',
            status: 200,
            created: 1000,
            from: 'consumer1',
            to: ['myProducer'],
            content: {
              status: 200,
              status_text: 'Sometimes i see dead people',
              results: undefined,
            },
          },
        ]);
      });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const date = new Date().getTime();
      await producer.start();
      try {
        await producer.command({ ...COMMAND, to: ['consumer1'], created: date });
        throw new Error(`Should throw an error`);
      } catch (error: any) {
        expect(error.message).toEqual(
          `Command to a single destination was resolved with multiple responses: 2`
        );
      }
      await producer.stop();
      jest.clearAllMocks();
    }, 300);
    it(`Should reject the command if there is not enough time to perform the command, behind a Gateway`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      const gatewayConsumer = new MyConsumerAdapter();
      const gatewayProducer = new MyProducerAdapter();

      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (gatewayConsumer.handler) {
          gatewayConsumer.handler(message, onResponse);
        }
      });
      gatewayProducer.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            gatewayProducer.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });

      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const gateway = new Gateway(gatewayConsumer, gatewayProducer, {
        ...gatewayOptions,
        bypassLookupIntervalChecks: true,
        lookupInterval: 100,
        lookupTimeout: 50,
        delay: 10000,
      });
      gateway.on('error', error => {
        expect(error.message).toEqual('No enough time to perform the forwarding of the command');
      });
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      gateway.consumerMap.on('updated', () => {
        producer
          .command({
            ...COMMAND,
            created: new Date().getTime(),
            to: ['myGateway'],
            content: {
              ...COMMAND.content,
              args: { duration: 100 },
            },
          })
          .catch(error => {
            expect(error.message).toEqual('Command was not fulfilled: [status 500]');
            Promise.all([consumer1.stop(), consumer2.stop(), producer.stop(), gateway.stop()]).then(
              () => done()
            );
          });
      });
      Promise.all([consumer1.start(), consumer2.start(), producer.start(), gateway.start()]).then();
    }, 300);
    it(`Should`, done => {
      const consumerAdapter1 = new MyConsumerAdapter();
      const consumerAdapter2 = new MyConsumerAdapter();
      const producerAdapter = new MyProducerAdapter();
      const gatewayConsumer = new MyConsumerAdapter();
      const gatewayProducer = new MyProducerAdapter();

      producerAdapter.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            producerAdapter.emit(response.request_id, response);
          }
        };
        if (gatewayConsumer.handler) {
          gatewayConsumer.handler(message, onResponse);
        }
      });
      gatewayProducer.on('message', message => {
        const onResponse = (error?: Crash | Error, response?: Control.ResponseMessage) => {
          if (error) {
            throw error;
          }
          if (response) {
            gatewayProducer.emit(response.request_id, response);
          }
        };
        if (consumerAdapter1.handler) {
          consumerAdapter1.handler(message, onResponse);
        }
        if (consumerAdapter2.handler) {
          consumerAdapter2.handler(message, onResponse);
        }
      });

      const consumer1 = new Consumer(consumerAdapter1, { ...consumerOptions, id: 'consumer1' });
      const consumer2 = new Consumer(consumerAdapter2, { ...consumerOptions, id: 'consumer2' });
      const producer = new Producer(producerAdapter, {
        ...producerOptions,
        id: 'myProducer',
        lookupInterval: 0,
        lookupTimeout: 0,
      });
      const gateway = new Gateway(gatewayConsumer, gatewayProducer, {
        ...gatewayOptions,
        bypassLookupIntervalChecks: true,
        lookupInterval: 100,
        lookupTimeout: 50,
        delay: 5,
      });
      jest.spyOn(gateway.consumerMap, 'getConsumersWithPair').mockReturnValue([]);
      const onJob = (commandJob: CommandJobHandler) => {
        commandJob.done();
      };
      consumer1.on('command', onJob);
      consumer2.on('command', onJob);
      gateway.consumerMap.on('updated', () => {
        producer
          .command({
            ...COMMAND,
            created: new Date().getTime(),
            to: ['myGateway'],
            content: {
              ...COMMAND.content,
              args: { duration: 100 },
            },
          })
          .catch(error => {
            expect(error.message).toEqual('Command was not fulfilled: [status 500]');
            Promise.all([consumer1.stop(), consumer2.stop(), producer.stop(), gateway.stop()]).then(
              () => done()
            );
          });
      });
      Promise.all([consumer1.start(), consumer2.start(), producer.start(), gateway.start()]).then();
    }, 300);
  });
});
