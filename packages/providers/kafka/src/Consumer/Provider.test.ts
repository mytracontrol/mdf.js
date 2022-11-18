/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { Crash } from '@mdf.js/crash';
import { LoggerInstance, Provider } from '@mdf.js/provider';
import { undoMocks } from '@mdf.js/utils';
import { Factory } from './Factory';
import { Port } from './Port';
import { Config } from './types';

const DEFAULT_CONFIG: Config = {
  client: {
    brokers: ['localhost:9092'],
    clientId: 'mdfjs',
  },
  consumer: {
    groupId: 'mdfjs',
  },
};
const KAFKA_RESPONSE_TOPICS_METADATA = {
  topics: [
    {
      name: 'my-topic',
      partitions: [
        {
          partitionErrorCode: 0,
          partitionId: 0,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 2,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 1,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
      ],
    },
    {
      name: '__consumer_offsets',
      partitions: [
        {
          partitionErrorCode: 0,
          partitionId: 0,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 10,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 20,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 40,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 30,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 9,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 11,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 31,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 39,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 13,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 18,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 22,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 8,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 32,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 43,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 29,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 34,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 1,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 6,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 41,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 27,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 48,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 5,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 15,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 35,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 25,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 46,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 26,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 36,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 44,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 16,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 37,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 17,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 45,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 3,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 24,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 38,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 33,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 23,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 28,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 2,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 12,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 19,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 14,
          leader: 3,
          replicas: [3, 1, 2],
          isr: [3, 1, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 4,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 47,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 49,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 42,
          leader: 1,
          replicas: [1, 2, 3],
          isr: [1, 2, 3],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 7,
          leader: 2,
          replicas: [2, 3, 1],
          isr: [2, 3, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 21,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
      ],
    },
  ],
};
const KAFKA_RESPONSE_LIST_GROUPS = {
  groups: [
    {
      groupId: 'my-group',
      protocolType: 'consumer',
    },
  ],
};
const KAFKA_RESPONSE_DESCRIBE_GROUPS = {
  groups: [
    {
      errorCode: 0,
      groupId: 'my-group',
      state: 'Stable',
      protocolType: 'consumer',
      protocol: 'RoundRobinAssigner',
      members: [
        {
          memberId: 'devCenter-72390ea8-5854-404c-8286-8deab369e0bf',
          clientId: 'devCenter',
          clientHost: '/172.19.0.1',
          memberMetadata: new Uint8Array([
            0, 0, 0, 0, 0, 1, 0, 8, 109, 121, 45, 116, 111, 112, 105, 99, 0, 0, 0, 0,
          ]),
          memberAssignment: new Uint8Array([
            0, 0, 0, 0, 0, 1, 0, 8, 109, 121, 45, 116, 111, 112, 105, 99, 0, 0, 0, 3, 0, 0, 0, 0, 0,
            0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0,
          ]),
        },
      ],
    },
  ],
};
const OBSERVED_VALUE = {
  topics: [
    {
      name: 'my-topic',
      partitions: [
        {
          partitionErrorCode: 0,
          partitionId: 0,
          leader: 1,
          replicas: [1, 3, 2],
          isr: [1, 3, 2],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 2,
          leader: 3,
          replicas: [3, 2, 1],
          isr: [3, 2, 1],
          offlineReplicas: [],
        },
        {
          partitionErrorCode: 0,
          partitionId: 1,
          leader: 2,
          replicas: [2, 1, 3],
          isr: [2, 1, 3],
          offlineReplicas: [],
        },
      ],
    },
  ],
  groups: [
    {
      errorCode: 0,
      groupId: 'my-group',
      state: 'Stable',
      protocolType: 'consumer',
      protocol: 'RoundRobinAssigner',
      members: [
        {
          memberId: 'devCenter-72390ea8-5854-404c-8286-8deab369e0bf',
          clientId: 'devCenter',
          clientHost: '/172.19.0.1',
        },
      ],
    },
  ],
};
class FakeLogger {
  public entry?: string;
  public debug(value: string): void {
    this.entry = value;
  }
  public info(value: string): void {
    this.entry = value;
  }
  public error(value: string): void {
    this.entry = value;
  }
  public crash(error: Crash): void {
    this.entry = error.message;
  }
  public warn(value: string): void {
    this.entry = value;
  }
  public silly(value: string): void {
    this.entry = value;
  }
}
describe('#Port #Kafka #Consumer', () => {
  describe('#Happy path', () => {
    afterEach(() => {
      undoMocks();
      jest.clearAllMocks();
    });
    it('Should create provider using the factory instance with default configuration', () => {
      const provider = Factory.create();
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.client).toBeDefined();
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeTruthy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'kafka:status': [
          {
            componentId: checks['kafka:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['kafka:status'][0].time,
          },
        ],
      });
    }, 300);
    it('Should create provider using the factory instance with a configuration', () => {
      const provider = Factory.create({
        useEnvironment: false,
        name: 'kafka',
        logger: new FakeLogger() as LoggerInstance,
        config: {
          client: { brokers: ['localhost:9092'] },
          consumer: { groupId: 'test' },
        },
      });
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(Provider.Manager);
      expect(provider.state).toEqual('stopped');
      //@ts-ignore - Test environment
      expect(provider.options.useEnvironment).toBeFalsy();
      const checks = provider.checks;
      expect(checks).toEqual({
        'kafka:status': [
          {
            componentId: checks['kafka:status'][0].componentId,
            componentType: 'service',
            observedValue: 'stopped',
            output: undefined,
            status: 'warn',
            time: checks['kafka:status'][0].time,
          },
        ],
      });
    }, 300);
    it(`Should create a valid instance`, () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.state).toBeFalsy();
      expect(port.checks).toEqual({});
      //@ts-ignore - Test environment
      expect(port.instance.consumerOptions.retry).toBeDefined();
    }, 300);
    it(`Should start and stop the port properly and fullfil the checks with responses from kafka`, done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      expect(port.state).toBeFalsy();
      // @ts-ignore - Test environment
      expect(port.instance.healthy).toBeFalsy();
      // @ts-ignore - Test environment
      expect(port.instance.isFirstCheck).toBeTruthy();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'disconnect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'disconnect').mockResolvedValue();
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'fetchTopicMetadata')
        .mockResolvedValue(KAFKA_RESPONSE_TOPICS_METADATA);
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'listGroups').mockResolvedValue(KAFKA_RESPONSE_LIST_GROUPS);
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'describeGroups')
        //@ts-ignore - Test environment
        .mockResolvedValue(KAFKA_RESPONSE_DESCRIBE_GROUPS);
      // @ts-ignore - Test environment
      expect(port.instance.listeners('error').length).toEqual(1);
      // @ts-ignore - Test environment
      expect(port.instance.listeners('status').length).toEqual(1);
      // @ts-ignore - Test environment
      expect(port.instance.listeners('healthy').length).toEqual(0);
      // @ts-ignore - Test environment
      expect(port.instance.listeners('unhealthy').length).toEqual(0);
      port
        .start()
        .then(() => port.start())
        //@ts-ignore - Test environment
        .then(() => port.instance.start())
        .then(() => {
          // @ts-ignore - Test environment
          expect(port.instance.timeInterval).toBeDefined();
          // @ts-ignore - Test environment
          expect(port.instance.connected).toBeTruthy();
          const checks = port.checks;
          expect(checks).toEqual({
            topics: [
              {
                componentId: checks['topics'][0].componentId,
                observedUnit: 'topics',
                observedValue: OBSERVED_VALUE,
                output: undefined,
                status: 'pass',
                time: checks['topics'][0].time,
              },
            ],
          });
          // @ts-ignore - Test environment
          expect(port.instance.listeners('error').length).toEqual(1);
          // @ts-ignore - Test environment
          expect(port.instance.listeners('status').length).toEqual(1);
          // @ts-ignore - Test environment
          expect(port.instance.listeners('healthy').length).toEqual(1);
          // @ts-ignore - Test environment
          expect(port.instance.listeners('unhealthy').length).toEqual(1);
          // @ts-ignore - Test environment
          expect(port.instance.isFirstCheck).toBeFalsy();
        })
        .then(() => port.close())
        .then(() => {
          // @ts-ignore - Test environment
          expect(port.instance.listeners('error').length).toEqual(1);
          // @ts-ignore - Test environment
          expect(port.instance.listeners('status').length).toEqual(1);
          // @ts-ignore - Test environment
          expect(port.instance.listeners('healthy').length).toEqual(0);
          // @ts-ignore - Test environment
          expect(port.instance.listeners('unhealthy').length).toEqual(0);
          // @ts-ignore - Test environment
          expect(port.instance.timeInterval).toBeUndefined();
          // @ts-ignore - Test environment
          expect(port.instance.connected).toBeFalsy();
        })
        .then(() => port.close())
        //@ts-ignore - Test environment
        .then(() => port.instance.stop())
        .then(() => done());
    }, 300);
  });
  describe('#Sad path', () => {
    it(`Should start and stop the port properly and fullfil the checks with error if artemis check fails`, done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'disconnect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'disconnect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'fetchTopicMetadata').mockRejectedValue(new Error('myError'));
      port.on('error', (error: Crash) => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Error checking the system: myError');
        expect(error.cause?.message).toEqual('myError');
        const checks = port.checks;
        expect(checks).toEqual({
          topics: [
            {
              componentId: checks['topics'][0].componentId,
              observedUnit: 'topics',
              observedValue: undefined,
              output: 'No topics available',
              status: 'fail',
              time: checks['topics'][0].time,
            },
          ],
        });
        done();
      });
      port.start().then(() => port.close());
    }, 300);
    it(`Should start and stop the port properly and emit error the first time the check fails, unhealthy the second, and healthy them if fix`, done => {
      const port = new Port(
        { ...DEFAULT_CONFIG, interval: 50 },
        new FakeLogger() as LoggerInstance
      );
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'disconnect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'disconnect').mockResolvedValue();
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'fetchTopicMetadata')
        .mockRejectedValueOnce(new Error('myError'))
        .mockRejectedValueOnce(new Error('myError'))
        .mockResolvedValueOnce(KAFKA_RESPONSE_TOPICS_METADATA);
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'listGroups').mockResolvedValue(KAFKA_RESPONSE_LIST_GROUPS);
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'describeGroups')
        //@ts-ignore - Test environment
        .mockResolvedValue(KAFKA_RESPONSE_DESCRIBE_GROUPS);
      let step = 0;
      port.on('error', (error: Crash) => {
        expect(port.state).toBeFalsy();
        expect(step).toEqual(0);
        step++;
        expect(error).toBeDefined();
        expect(error.message).toEqual('Error checking the system: myError');
        expect(error.cause?.message).toEqual('myError');
        const checks = port.checks;
        expect(checks).toEqual({
          topics: [
            {
              componentId: checks['topics'][0].componentId,
              observedUnit: 'topics',
              observedValue: undefined,
              output: 'No topics available',
              status: 'fail',
              time: checks['topics'][0].time,
            },
          ],
        });
      });
      port.on('unhealthy', (error: Crash) => {
        expect(port.state).toBeFalsy();
        expect(step).toEqual(1);
        step++;
        expect(error).toBeDefined();
        expect(error.message).toEqual('Error checking the system: myError');
        expect(error.cause?.message).toEqual('myError');
        const checks = port.checks;
        expect(checks).toEqual({
          topics: [
            {
              componentId: checks['topics'][0].componentId,
              observedUnit: 'topics',
              observedValue: undefined,
              output: 'No topics available',
              status: 'fail',
              time: checks['topics'][0].time,
            },
          ],
        });
      });
      port.on('healthy', () => {
        expect(port.state).toBeTruthy();
        expect(step).toEqual(2);
        step++;
        const checks = port.checks;
        expect(checks).toEqual({
          topics: [
            {
              componentId: checks['topics'][0].componentId,
              observedUnit: 'topics',
              observedValue: OBSERVED_VALUE,
              output: undefined,
              status: 'pass',
              time: checks['topics'][0].time,
            },
          ],
        });
        port.close().then(() => done());
      });
      port.start().then();
    }, 300);
    it(`Should emit a error if the consumer transmit an error to start if admin client rejects`, done => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      port.on('error', error => {
        expect(error).toBeDefined();
        expect(error.message).toEqual('Fixable error in Kafka interface: myError');
        expect(error.cause?.message).toEqual('myError');
        done();
      });
      //@ts-ignore - Test environment
      port.instance.onCrashEvent({ payload: { error: new Error('myError') } });
    }, 300);
    it(`Should reject to start if admin client rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockRejectedValue(new Error('myError'));
      try {
        await port.start();
        throw new Error('Should not be here');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error in port initialization: Error in initial connection process: Error setting the monitoring client: myError'
        );
        expect(error.cause.message).toEqual(
          'Error in initial connection process: Error setting the monitoring client: myError'
        );
        expect(error.cause.cause.message).toEqual('Error setting the monitoring client: myError');
        expect(error.cause.cause.cause.message).toEqual('myError');
      }
    }, 300);
    it(`Should reject to start if consumer rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockRejectedValue(new Error('myError'));
      try {
        await port.start();
        throw new Error('Should not be here');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error in port initialization: Error in initial connection process: Error setting the monitoring client: myError'
        );
        expect(error.cause.message).toEqual(
          'Error in initial connection process: Error setting the monitoring client: myError'
        );
        expect(error.cause.cause.message).toEqual('Error setting the monitoring client: myError');
        expect(error.cause.cause.cause.message).toEqual('myError');
      }
    }, 300);
    it(`Should reject to stop if admin rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'disconnect').mockRejectedValue(new Error('myError'));
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'fetchTopicMetadata')
        .mockResolvedValue(KAFKA_RESPONSE_TOPICS_METADATA);
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'listGroups').mockResolvedValue(KAFKA_RESPONSE_LIST_GROUPS);
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'describeGroups')
        //@ts-ignore - Test environment
        .mockResolvedValue(KAFKA_RESPONSE_DESCRIBE_GROUPS);
      await port.start();
      try {
        await port.close();
        throw new Error('Should have failed');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error in port disconnection: Error in disconnection process: Error in disconnection process of monitor client: myError'
        );
        expect(error.cause.message).toEqual(
          'Error in disconnection process: Error in disconnection process of monitor client: myError'
        );
        expect(error.cause.cause.message).toEqual(
          'Error in disconnection process of monitor client: myError'
        );
        expect(error.cause.cause.cause.message).toEqual('myError');
      }
    }, 300);
    it(`Should reject to stop if consumer rejects`, async () => {
      const port = new Port(DEFAULT_CONFIG, new FakeLogger() as LoggerInstance);
      expect(port).toBeDefined();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'connect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'disconnect').mockResolvedValue();
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.client, 'disconnect').mockRejectedValue(new Error('myError'));
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'fetchTopicMetadata')
        .mockResolvedValue(KAFKA_RESPONSE_TOPICS_METADATA);
      //@ts-ignore - Test environment
      jest.spyOn(port.instance.admin, 'listGroups').mockResolvedValue(KAFKA_RESPONSE_LIST_GROUPS);
      jest
        //@ts-ignore - Test environment
        .spyOn(port.instance.admin, 'describeGroups')
        //@ts-ignore - Test environment
        .mockResolvedValue(KAFKA_RESPONSE_DESCRIBE_GROUPS);
      await port.start();
      try {
        await port.close();
        throw new Error('Should have failed');
      } catch (error: any) {
        expect(error.message).toEqual(
          'Error in port disconnection: Error in disconnection process: myError'
        );
        expect(error.cause.message).toEqual('Error in disconnection process: myError');
        expect(error.cause.cause.message).toEqual('myError');
      }
    }, 300);
  });
});
