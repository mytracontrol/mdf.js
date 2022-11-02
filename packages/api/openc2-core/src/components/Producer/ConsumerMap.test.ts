/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { v4 } from 'uuid';
import { Control } from '../../types';
import { ConsumerMap } from './ConsumerMap';

describe('#ConsumerMap', () => {
  describe('#Happy path', () => {
    it('Should create an instance of ConsumerMap', () => {
      const consumerMap = new ConsumerMap('myName', 10, 10);
      expect(consumerMap).toBeDefined();
      expect(consumerMap).toBeInstanceOf(ConsumerMap);
      expect(consumerMap.name).toEqual('myName');
      expect(consumerMap.nodes).toEqual([]);
      expect(consumerMap.getGroupedFeatures()).toEqual({ pairs: {}, profiles: [] });
    }, 300);
    it('Should emit events when a new node is included or updated', done => {
      const consumerMap = new ConsumerMap('myName', 10, 10);
      let events = 0;
      consumerMap.on('new', nodes => {
        events++;
        expect(nodes).toEqual(['myFrom']);
      });
      consumerMap.on('update', nodes => {
        events++;
        expect(nodes).toEqual(['myFrom']);
      });
      consumerMap.on('updated', nodes => {
        events++;
        expect(nodes).toEqual(['myFrom']);
      });
      consumerMap.on('aged', nodes => {
        consumerMap.removeAllListeners();
        consumerMap.clear();
        //@ts-ignore - Test environment
        expect(consumerMap.map.size).toEqual(0);
        done();
      });
      consumerMap.on('status', status => {
        events++;
        expect(status).toEqual('pass');
      });
      const time = new Date().getTime();
      //@ts-ignore - Test environment
      expect(consumerMap.agingTimer).toBeUndefined();
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: time,
          from: 'myFrom',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
          },
        },
      ]);
      //@ts-ignore - Test environment
      expect(consumerMap.agingTimer).toBeDefined();
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: time,
          from: 'myFrom',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
          },
        },
      ]);
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.NotFound,
          created: new Date().getTime(),
          from: 'myFrom',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.NotFound,
          },
        },
      ]);
      expect(events).toEqual(5);
    }, 300);
    it('Should return the nodes and the properties of these nodes grouped', done => {
      const consumerMap = new ConsumerMap('myName', 10, 30);
      consumerMap.on('aged', nodes => {
        consumerMap.removeAllListeners();
        consumerMap.clear();
        done();
      });
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: new Date().getTime(),
          from: 'myFrom1',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
            results: {
              pairs: {
                query: ['features'],
                delete: ['x-1:alarms', 'x-1:devices'],
                scan: ['x-1:alarms', 'x-1:devices'],
              },
              profiles: ['x-1'],
              rate_limit: 5,
              versions: ['1.0'],
            },
          },
        },
      ]);
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: new Date().getTime(),
          from: 'myFrom2',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
            results: {
              pairs: {
                query: ['features'],
                delete: ['x-1:alarms', 'x-2:devices'],
                scan: ['x-1:alarms', 'x-2:devices'],
              },
              profiles: ['x-1', 'x-2'],
              rate_limit: 5,
              versions: ['1.0'],
            },
          },
        },
      ]);
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.NotFound,
          created: new Date().getTime(),
          from: 'myFrom3',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
            results: {
              pairs: {
                query: ['features'],
                delete: ['x-2:alarms', 'x-3:devices'],
                scan: ['x-2:alarms', 'x-3:devices'],
              },
              profiles: ['x-2', 'x-3'],
              rate_limit: 5,
              versions: ['1.0'],
            },
          },
        },
      ]);
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: new Date().getTime(),
          from: 'myFrom4',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
          },
        },
      ]);
      expect(consumerMap.nodes).toEqual([
        {
          results: {
            pairs: {
              delete: ['x-1:alarms', 'x-1:devices'],
              query: ['features'],
              scan: ['x-1:alarms', 'x-1:devices'],
            },
            profiles: ['x-1'],
            rate_limit: 5,
            versions: ['1.0'],
          },
          status: 200,
        },
        {
          results: {
            pairs: {
              delete: ['x-1:alarms', 'x-2:devices'],
              query: ['features'],
              scan: ['x-1:alarms', 'x-2:devices'],
            },
            profiles: ['x-1', 'x-2'],
            rate_limit: 5,
            versions: ['1.0'],
          },
          status: 200,
        },
        {
          results: {
            pairs: {
              delete: ['x-2:alarms', 'x-3:devices'],
              query: ['features'],
              scan: ['x-2:alarms', 'x-3:devices'],
            },
            profiles: ['x-2', 'x-3'],
            rate_limit: 5,
            versions: ['1.0'],
          },
          status: 200,
        },
        { status: 200 },
      ]);
      const node1 = consumerMap.getNode('myFrom1');
      expect(node1).toEqual({
        componentId: 'myFrom1',
        componentType: 'OpenC2 Consumer',
        observedUnit: 'features',
        observedValue: {
          results: {
            pairs: {
              delete: ['x-1:alarms', 'x-1:devices'],
              query: ['features'],
              scan: ['x-1:alarms', 'x-1:devices'],
            },
            profiles: ['x-1'],
            rate_limit: 5,
            versions: ['1.0'],
          },
          status: 200,
        },
        status: 'pass',
        time: node1?.time,
      });
      expect(consumerMap.getConsumersWithPair('delete', 'x-1:alarms')).toEqual([
        'myFrom1',
        'myFrom2',
      ]);
      expect(consumerMap.getConsumersWithPair('delete', 'x-4:alarms')).toEqual([]);
      expect(consumerMap.getGroupedFeatures()).toEqual({
        pairs: {
          delete: ['x-1:alarms', 'x-1:devices', 'x-2:devices', 'x-2:alarms', 'x-3:devices'],
          query: ['features'],
          scan: ['x-1:alarms', 'x-1:devices', 'x-2:devices', 'x-2:alarms', 'x-3:devices'],
        },
        profiles: ['x-1', 'x-2', 'x-3'],
      });
    }, 300);
    it('Should emit `aged` events when an entry is aged ', done => {
      const consumerMap = new ConsumerMap('myName', 10, 30);
      let aged = false;
      consumerMap.on('aged', nodes => {
        aged = true;
        expect(nodes).toEqual(['myFrom1', 'myFrom2']);
      });
      consumerMap.on('updated', nodes => {
        if (aged) {
          expect(nodes).toEqual(['myFrom1', 'myFrom2']);
          consumerMap.removeAllListeners();
          consumerMap.clear();
          done();
        }
      });
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: new Date().getTime() - 30,
          from: 'myFrom1',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
            results: {
              pairs: {
                query: ['features'],
                delete: ['x-1:alarms', 'x-1:devices'],
                scan: ['x-1:alarms', 'x-1:devices'],
              },
              profiles: ['x-1'],
              rate_limit: 5,
              versions: ['1.0'],
            },
          },
        },
      ]);
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.OK,
          created: new Date().getTime() - 30,
          from: 'myFrom2',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
            results: {
              pairs: {
                query: ['features'],
                delete: ['x-1:alarms', 'x-2:devices'],
                scan: ['x-1:alarms', 'x-2:devices'],
              },
              profiles: ['x-1', 'x-2'],
              rate_limit: 5,
              versions: ['1.0'],
            },
          },
        },
      ]);
      consumerMap.update([
        {
          content_type: 'application/openc2',
          msg_type: Control.MessageType.Response,
          request_id: v4(),
          status: Control.StatusCode.NotFound,
          created: new Date().getTime() + 300,
          from: 'myFrom3',
          to: ['myTo'],
          content: {
            status: Control.StatusCode.OK,
            results: {
              pairs: {
                query: ['features'],
                delete: ['x-2:alarms', 'x-3:devices'],
                scan: ['x-2:alarms', 'x-3:devices'],
              },
              profiles: ['x-2', 'x-3'],
              rate_limit: 5,
              versions: ['1.0'],
            },
          },
        },
      ]);
    }, 3000000);
  });
});
