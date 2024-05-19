/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { Types } from '../../types';
import { Constructors } from './Constructors';
import { Parser } from './Parser';

const SASLMechanismsBuffer = [
  0x00, 0x53, 0x40, 0xc0, 0x15, 0x01, 0xe0, 0x12, 0x02, 0xa3, 0x05, 0x50, 0x4c, 0x41, 0x49, 0x4e,
  0x09, 0x41, 0x4e, 0x4f, 0x4e, 0x59, 0x4d, 0x4f, 0x55, 0x53,
];
const SASLMechanismsUndecoded: Types.Unencoded<Types.Primitive.LIST8, Types.Primitive.SMALL_ULONG> =
  {
    type: Types.Primitive.LIST8,
    descriptor: {
      type: Types.Primitive.SMALL_ULONG,
      descriptor: null,
      value: 64,
    },
    value: [
      {
        type: Types.Primitive.ARRAY8,
        descriptor: null,
        value: [
          {
            type: Types.Primitive.SYM8,
            descriptor: null,
            value: 'PLAIN',
          },
          {
            type: Types.Primitive.SYM8,
            descriptor: null,
            value: 'ANONYMOUS',
          },
        ],
      },
    ],
  };
const SASLInitBuffer = [
  0x00, 0x53, 0x41, 0xd0, 0x00, 0x00, 0x00, 0x33, 0x00, 0x00, 0x00, 0x03, 0xa3, 0x05, 0x50, 0x4c,
  0x41, 0x49, 0x4e, 0xa0, 0x19, 0x00, 0x6e, 0x65, 0x74, 0x69, 0x6e, 0x2d, 0x61, 0x64, 0x6d, 0x69,
  0x6e, 0x00, 0x5a, 0x58, 0x70, 0x74, 0x65, 0x2e, 0x75, 0x66, 0x57, 0x79, 0x4c, 0x6b, 0xa1, 0x0b,
  0x31, 0x30, 0x2e, 0x31, 0x30, 0x2e, 0x32, 0x30, 0x2e, 0x34, 0x31,
];
const SASLInitUndecoded: Types.Unencoded<Types.Primitive.LIST32, Types.Primitive.SMALL_ULONG> = {
  type: Types.Primitive.LIST32,
  descriptor: {
    type: Types.Primitive.SMALL_ULONG,
    descriptor: null,
    value: 65,
  },
  value: [
    {
      type: Types.Primitive.SYM8,
      descriptor: null,
      value: 'PLAIN',
    },
    {
      type: Types.Primitive.VBIN8,
      descriptor: null,
      value: Buffer.from(
        new Uint8Array([
          0, 110, 101, 116, 105, 110, 45, 97, 100, 109, 105, 110, 0, 90, 88, 112, 116, 101, 46, 117,
          102, 87, 121, 76, 107,
        ])
      ),
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: '10.10.20.41',
    },
  ],
};
const FrameOpenBuffer = [
  0x00, 0x53, 0x10, 0xc0, 0xa1, 0x0a, 0xa1, 0x08, 0x4e, 0x65, 0x74, 0x69, 0x6e, 0x41, 0x4d, 0x51,
  0x40, 0x70, 0x00, 0x02, 0x00, 0x00, 0x60, 0xff, 0xff, 0x70, 0x00, 0x00, 0x75, 0x30, 0x40, 0x40,
  0xe0, 0x4d, 0x04, 0xa3, 0x1d, 0x73, 0x6f, 0x6c, 0x65, 0x2d, 0x63, 0x6f, 0x6e, 0x6e, 0x65, 0x63,
  0x74, 0x69, 0x6f, 0x6e, 0x2d, 0x66, 0x6f, 0x72, 0x2d, 0x63, 0x6f, 0x6e, 0x74, 0x61, 0x69, 0x6e,
  0x65, 0x72, 0x10, 0x44, 0x45, 0x4c, 0x41, 0x59, 0x45, 0x44, 0x5f, 0x44, 0x45, 0x4c, 0x49, 0x56,
  0x45, 0x52, 0x59, 0x0b, 0x53, 0x48, 0x41, 0x52, 0x45, 0x44, 0x2d, 0x53, 0x55, 0x42, 0x53, 0x0f,
  0x41, 0x4e, 0x4f, 0x4e, 0x59, 0x4d, 0x4f, 0x55, 0x53, 0x2d, 0x52, 0x45, 0x4c, 0x41, 0x59, 0x40,
  0xc1, 0x34, 0x04, 0xa3, 0x07, 0x70, 0x72, 0x6f, 0x64, 0x75, 0x63, 0x74, 0xa1, 0x17, 0x61, 0x70,
  0x61, 0x63, 0x68, 0x65, 0x2d, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0x6d, 0x71, 0x2d, 0x61, 0x72,
  0x74, 0x65, 0x6d, 0x69, 0x73, 0xa3, 0x07, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0xa1, 0x06,
  0x32, 0x2e, 0x33, 0x31, 0x2e, 0x32,
];
const FrameOpenUndecoded: Types.Unencoded<Types.Primitive.LIST8, Types.Primitive.SMALL_ULONG> = {
  type: Types.Primitive.LIST8,
  descriptor: {
    type: Types.Primitive.SMALL_ULONG,
    descriptor: null,
    value: 16,
  },
  value: [
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'NetinAMQ',
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.UINT,
      descriptor: null,
      value: 131072,
    },
    {
      type: Types.Primitive.USHORT,
      descriptor: null,
      value: 65535,
    },
    {
      type: Types.Primitive.UINT,
      descriptor: null,
      value: 30000,
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.ARRAY8,
      descriptor: null,
      value: [
        {
          type: Types.Primitive.SYM8,
          descriptor: null,
          value: 'sole-connection-for-container',
        },
        {
          type: Types.Primitive.SYM8,
          descriptor: null,
          value: 'DELAYED_DELIVERY',
        },
        {
          type: Types.Primitive.SYM8,
          descriptor: null,
          value: 'SHARED-SUBS',
        },
        {
          type: Types.Primitive.SYM8,
          descriptor: null,
          value: 'ANONYMOUS-RELAY',
        },
      ],
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.MAP8,
      descriptor: null,
      value: [
        {
          type: Types.Primitive.SYM8,
          descriptor: null,
          value: 'product',
        },
        {
          type: Types.Primitive.STR8,
          descriptor: null,
          value: 'apache-activemq-artemis',
        },
        {
          type: Types.Primitive.SYM8,
          descriptor: null,
          value: 'version',
        },
        {
          type: Types.Primitive.STR8,
          descriptor: null,
          value: '2.31.2',
        },
      ],
    },
  ],
};
const TransferBuffer = [
  0x00, 0x53, 0x14, 0xc0, 0x08, 0x05, 0x43, 0x43, 0xa0, 0x01, 0x00, 0x43, 0x42, 0x00, 0x53, 0x70,
  0xd0, 0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x03, 0x40, 0x40, 0x40, 0x00, 0x53, 0x73, 0xd0,
  0x00, 0x00, 0x00, 0x3b, 0x00, 0x00, 0x00, 0x03, 0xa1, 0x24, 0x64, 0x31, 0x64, 0x37, 0x36, 0x38,
  0x61, 0x33, 0x2d, 0x30, 0x36, 0x31, 0x34, 0x2d, 0x34, 0x65, 0x31, 0x30, 0x2d, 0x39, 0x66, 0x39,
  0x34, 0x2d, 0x33, 0x30, 0x33, 0x32, 0x37, 0x63, 0x38, 0x39, 0x36, 0x31, 0x34, 0x63, 0x40, 0xa1,
  0x0e, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x2e, 0x64, 0x65, 0x76, 0x69, 0x63, 0x65, 0x73, 0x00,
  0x53, 0x74, 0xd1, 0x00, 0x00, 0x00, 0x61, 0x00, 0x00, 0x00, 0x06, 0xa1, 0x07, 0x6a, 0x6f, 0x62,
  0x54, 0x79, 0x70, 0x65, 0xa1, 0x06, 0x64, 0x65, 0x76, 0x69, 0x63, 0x65, 0xa1, 0x08, 0x64, 0x65,
  0x76, 0x69, 0x63, 0x65, 0x49, 0x64, 0xa1, 0x20, 0x65, 0x61, 0x63, 0x34, 0x65, 0x63, 0x35, 0x65,
  0x35, 0x39, 0x66, 0x65, 0x33, 0x31, 0x33, 0x31, 0x36, 0x34, 0x62, 0x65, 0x30, 0x37, 0x36, 0x35,
  0x66, 0x33, 0x62, 0x61, 0x63, 0x35, 0x37, 0x63, 0xa1, 0x0a, 0x74, 0x65, 0x6d, 0x70, 0x6c, 0x61,
  0x74, 0x65, 0x49, 0x64, 0xa1, 0x12, 0x4e, 0x65, 0x74, 0x69, 0x6e, 0x20, 0x49, 0x43, 0x4d, 0x50,
  0x20, 0x44, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x00, 0x53, 0x77, 0xb1, 0x00, 0x00, 0x03, 0xfc,
  0x7b, 0x22, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x22, 0x3a, 0x31, 0x37, 0x31,
  0x35, 0x35, 0x32, 0x37, 0x38, 0x30, 0x37, 0x38, 0x34, 0x35, 0x2c, 0x22, 0x6c, 0x6f, 0x63, 0x61,
  0x74, 0x69, 0x6f, 0x6e, 0x22, 0x3a, 0x5b, 0x22, 0x4d, 0x79, 0x74, 0x72, 0x61, 0x22, 0x2c, 0x22,
  0x4c, 0x61, 0x62, 0x6f, 0x72, 0x61, 0x74, 0x6f, 0x72, 0x69, 0x6f, 0x22, 0x5d, 0x2c, 0x22, 0x6c,
  0x6f, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x49, 0x64, 0x22, 0x3a, 0x22, 0x64, 0x37, 0x62, 0x35,
  0x38, 0x33, 0x65, 0x36, 0x2d, 0x32, 0x31, 0x61, 0x36, 0x2d, 0x35, 0x32, 0x32, 0x61, 0x2d, 0x39,
  0x33, 0x36, 0x35, 0x2d, 0x62, 0x63, 0x66, 0x31, 0x63, 0x37, 0x66, 0x33, 0x38, 0x65, 0x32, 0x35,
  0x22, 0x2c, 0x22, 0x64, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x22, 0x3a,
  0x22, 0x4e, 0x65, 0x74, 0x69, 0x6e, 0x20, 0x49, 0x43, 0x4d, 0x50, 0x20, 0x44, 0x65, 0x66, 0x61,
  0x75, 0x6c, 0x74, 0x20, 0x74, 0x65, 0x6d, 0x70, 0x6c, 0x61, 0x74, 0x65, 0x22, 0x2c, 0x22, 0x64,
  0x65, 0x76, 0x69, 0x63, 0x65, 0x49, 0x64, 0x22, 0x3a, 0x22, 0x65, 0x61, 0x63, 0x34, 0x65, 0x63,
  0x35, 0x65, 0x35, 0x39, 0x66, 0x65, 0x33, 0x31, 0x33, 0x31, 0x36, 0x34, 0x62, 0x65, 0x30, 0x37,
  0x36, 0x35, 0x66, 0x33, 0x62, 0x61, 0x63, 0x35, 0x37, 0x63, 0x22, 0x2c, 0x22, 0x65, 0x6e, 0x74,
  0x69, 0x74, 0x79, 0x22, 0x3a, 0x22, 0x31, 0x37, 0x64, 0x36, 0x31, 0x31, 0x31, 0x30, 0x2d, 0x63,
  0x30, 0x32, 0x65, 0x2d, 0x35, 0x35, 0x63, 0x33, 0x2d, 0x39, 0x66, 0x64, 0x35, 0x2d, 0x61, 0x63,
  0x30, 0x37, 0x61, 0x38, 0x66, 0x37, 0x35, 0x35, 0x65, 0x65, 0x22, 0x2c, 0x22, 0x65, 0x6e, 0x74,
  0x69, 0x74, 0x79, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x6e, 0x65, 0x74, 0x69, 0x6e, 0x2d,
  0x64, 0x73, 0x2d, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x22, 0x2c, 0x22, 0x6f, 0x72, 0x69, 0x67, 0x69,
  0x6e, 0x22, 0x3a, 0x22, 0x31, 0x30, 0x2e, 0x31, 0x30, 0x2e, 0x32, 0x30, 0x2e, 0x32, 0x33, 0x35,
  0x22, 0x2c, 0x22, 0x74, 0x65, 0x6d, 0x70, 0x6c, 0x61, 0x74, 0x65, 0x49, 0x64, 0x22, 0x3a, 0x22,
  0x4e, 0x65, 0x74, 0x69, 0x6e, 0x20, 0x49, 0x43, 0x4d, 0x50, 0x20, 0x44, 0x65, 0x66, 0x61, 0x75,
  0x6c, 0x74, 0x22, 0x2c, 0x22, 0x64, 0x65, 0x76, 0x69, 0x63, 0x65, 0x49, 0x6e, 0x66, 0x6f, 0x22,
  0x3a, 0x7b, 0x22, 0x64, 0x65, 0x76, 0x69, 0x63, 0x65, 0x53, 0x74, 0x61, 0x74, 0x65, 0x22, 0x3a,
  0x7b, 0x22, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a, 0x22, 0x4f, 0x6b, 0x22, 0x2c, 0x22, 0x64,
  0x61, 0x74, 0x61, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x53, 0x54, 0x52, 0x49, 0x4e, 0x47,
  0x22, 0x2c, 0x22, 0x72, 0x61, 0x77, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a, 0x22, 0x4f, 0x6b,
  0x22, 0x2c, 0x22, 0x72, 0x61, 0x77, 0x44, 0x61, 0x74, 0x61, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a,
  0x22, 0x53, 0x54, 0x52, 0x49, 0x4e, 0x47, 0x22, 0x2c, 0x22, 0x73, 0x65, 0x76, 0x65, 0x72, 0x69,
  0x74, 0x79, 0x22, 0x3a, 0x30, 0x2c, 0x22, 0x71, 0x75, 0x61, 0x6c, 0x69, 0x74, 0x79, 0x22, 0x3a,
  0x22, 0x67, 0x6f, 0x6f, 0x64, 0x22, 0x2c, 0x22, 0x71, 0x75, 0x61, 0x6c, 0x69, 0x74, 0x79, 0x54,
  0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x67, 0x6f, 0x6f, 0x64, 0x22, 0x2c, 0x22, 0x74, 0x65, 0x78,
  0x74, 0x22, 0x3a, 0x22, 0x22, 0x2c, 0x22, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70,
  0x22, 0x3a, 0x31, 0x37, 0x31, 0x35, 0x35, 0x32, 0x37, 0x38, 0x30, 0x37, 0x38, 0x35, 0x30, 0x2c,
  0x22, 0x6f, 0x72, 0x69, 0x67, 0x69, 0x6e, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x6e, 0x65,
  0x74, 0x69, 0x6e, 0x2d, 0x64, 0x73, 0x2d, 0x7a, 0x61, 0x76, 0x6f, 0x64, 0x22, 0x7d, 0x2c, 0x22,
  0x64, 0x65, 0x76, 0x69, 0x63, 0x65, 0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x69, 0x6f,
  0x6e, 0x22, 0x3a, 0x7b, 0x22, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a, 0x22, 0x49, 0x43, 0x4d,
  0x50, 0x5f, 0x44, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x22, 0x2c, 0x22, 0x64, 0x61, 0x74, 0x61,
  0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x53, 0x54, 0x52, 0x49, 0x4e, 0x47, 0x22, 0x2c, 0x22,
  0x72, 0x61, 0x77, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a, 0x22, 0x49, 0x43, 0x4d, 0x50, 0x5f,
  0x44, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x22, 0x2c, 0x22, 0x72, 0x61, 0x77, 0x44, 0x61, 0x74,
  0x61, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x53, 0x54, 0x52, 0x49, 0x4e, 0x47, 0x22, 0x2c,
  0x22, 0x73, 0x65, 0x76, 0x65, 0x72, 0x69, 0x74, 0x79, 0x22, 0x3a, 0x2d, 0x31, 0x2c, 0x22, 0x71,
  0x75, 0x61, 0x6c, 0x69, 0x74, 0x79, 0x22, 0x3a, 0x22, 0x67, 0x6f, 0x6f, 0x64, 0x22, 0x2c, 0x22,
  0x71, 0x75, 0x61, 0x6c, 0x69, 0x74, 0x79, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x67, 0x6f,
  0x6f, 0x64, 0x22, 0x2c, 0x22, 0x74, 0x65, 0x78, 0x74, 0x22, 0x3a, 0x22, 0x22, 0x2c, 0x22, 0x74,
  0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x22, 0x3a, 0x31, 0x37, 0x31, 0x35, 0x33, 0x36,
  0x37, 0x30, 0x34, 0x35, 0x38, 0x33, 0x39, 0x2c, 0x22, 0x6f, 0x72, 0x69, 0x67, 0x69, 0x6e, 0x54,
  0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x6e, 0x65, 0x74, 0x69, 0x6e, 0x2d, 0x64, 0x73, 0x2d, 0x7a,
  0x61, 0x76, 0x6f, 0x64, 0x22, 0x7d, 0x2c, 0x22, 0x64, 0x65, 0x76, 0x69, 0x63, 0x65, 0x41, 0x64,
  0x64, 0x72, 0x65, 0x73, 0x73, 0x22, 0x3a, 0x7b, 0x22, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a,
  0x22, 0x31, 0x30, 0x2e, 0x31, 0x30, 0x2e, 0x32, 0x30, 0x2e, 0x32, 0x33, 0x35, 0x22, 0x2c, 0x22,
  0x64, 0x61, 0x74, 0x61, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x53, 0x54, 0x52, 0x49, 0x4e,
  0x47, 0x22, 0x2c, 0x22, 0x72, 0x61, 0x77, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x22, 0x3a, 0x22, 0x31,
  0x30, 0x2e, 0x31, 0x30, 0x2e, 0x32, 0x30, 0x2e, 0x32, 0x33, 0x35, 0x22, 0x2c, 0x22, 0x72, 0x61,
  0x77, 0x44, 0x61, 0x74, 0x61, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x53, 0x54, 0x52, 0x49,
  0x4e, 0x47, 0x22, 0x2c, 0x22, 0x73, 0x65, 0x76, 0x65, 0x72, 0x69, 0x74, 0x79, 0x22, 0x3a, 0x2d,
  0x31, 0x2c, 0x22, 0x71, 0x75, 0x61, 0x6c, 0x69, 0x74, 0x79, 0x22, 0x3a, 0x22, 0x67, 0x6f, 0x6f,
  0x64, 0x22, 0x2c, 0x22, 0x71, 0x75, 0x61, 0x6c, 0x69, 0x74, 0x79, 0x54, 0x79, 0x70, 0x65, 0x22,
  0x3a, 0x22, 0x67, 0x6f, 0x6f, 0x64, 0x22, 0x2c, 0x22, 0x74, 0x65, 0x78, 0x74, 0x22, 0x3a, 0x22,
  0x22, 0x2c, 0x22, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x22, 0x3a, 0x31, 0x37,
  0x31, 0x35, 0x33, 0x36, 0x37, 0x30, 0x34, 0x35, 0x38, 0x34, 0x33, 0x2c, 0x22, 0x6f, 0x72, 0x69,
  0x67, 0x69, 0x6e, 0x54, 0x79, 0x70, 0x65, 0x22, 0x3a, 0x22, 0x6e, 0x65, 0x74, 0x69, 0x6e, 0x2d,
  0x64, 0x73, 0x2d, 0x7a, 0x61, 0x76, 0x6f, 0x64, 0x22, 0x7d, 0x7d, 0x7d,
];
const TransferUndecodedArguments: Types.Unencoded<
  Types.Primitive.LIST8,
  Types.Primitive.SMALL_ULONG
> = {
  type: Types.Primitive.LIST8,
  descriptor: {
    type: Types.Primitive.SMALL_ULONG,
    descriptor: null,
    value: 20,
  },
  value: [
    {
      type: Types.Primitive.UNIT0,
      descriptor: null,
      value: 0,
    },
    {
      type: Types.Primitive.UNIT0,
      descriptor: null,
      value: 0,
    },
    {
      type: Types.Primitive.VBIN8,
      descriptor: null,
      value: Buffer.from(new Uint8Array([0])),
    },
    {
      type: Types.Primitive.UNIT0,
      descriptor: null,
      value: 0,
    },
    {
      type: Types.Primitive.FALSE,
      descriptor: null,
      value: false,
    },
  ],
};
const TransferUndecodedHeader: Types.Unencoded<
  Types.Primitive.LIST32,
  Types.Primitive.SMALL_ULONG
> = {
  type: Types.Primitive.LIST32,
  descriptor: {
    type: Types.Primitive.SMALL_ULONG,
    descriptor: null,
    value: 112,
  },
  value: [
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
  ],
};
const TransferUndecodedMessageProperties: Types.Unencoded<
  Types.Primitive.LIST32,
  Types.Primitive.SMALL_ULONG
> = {
  type: Types.Primitive.LIST32,
  descriptor: {
    type: Types.Primitive.SMALL_ULONG,
    descriptor: null,
    value: 115,
  },
  value: [
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'd1d768a3-0614-4e10-9f94-30327c89614c',
    },
    {
      type: Types.Primitive.NULL,
      descriptor: null,
      value: null,
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'stream.devices',
    },
  ],
};
const TransferUndecodedApplicationProperties: Types.Unencoded<
  Types.Primitive.MAP32,
  Types.Primitive.SMALL_ULONG
> = {
  type: Types.Primitive.MAP32,
  descriptor: {
    type: Types.Primitive.SMALL_ULONG,
    descriptor: null,
    value: 116,
  },
  value: [
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'jobType',
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'device',
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'deviceId',
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'eac4ec5e59fe313164be0765f3bac57c',
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'templateId',
    },
    {
      type: Types.Primitive.STR8,
      descriptor: null,
      value: 'Netin ICMP Default',
    },
  ],
};
const TransferUndecodedValue: Types.Unencoded<Types.Primitive.STR32, Types.Primitive.SMALL_ULONG> =
  {
    type: Types.Primitive.STR32,
    descriptor: {
      type: Types.Primitive.SMALL_ULONG,
      descriptor: null,
      value: 119,
    },
    value:
      '{"timestamp":1715527807845,"location":["Mytra","Laboratorio"],"locationId":"d7b583e6-21a6-522a-9365-bcf1c7f38e25","description":"Netin ICMP Default template","deviceId":"eac4ec5e59fe313164be0765f3bac57c","entity":"17d61110-c02e-55c3-9fd5-ac07a8f755ee","entityType":"netin-ds-agent","origin":"10.10.20.235","templateId":"Netin ICMP Default","deviceInfo":{"deviceState":{"value":"Ok","dataType":"STRING","rawValue":"Ok","rawDataType":"STRING","severity":0,"quality":"good","qualityType":"good","text":"","timestamp":1715527807850,"originType":"netin-ds-zavod"},"deviceDescription":{"value":"ICMP_Default","dataType":"STRING","rawValue":"ICMP_Default","rawDataType":"STRING","severity":-1,"quality":"good","qualityType":"good","text":"","timestamp":1715367045839,"originType":"netin-ds-zavod"},"deviceAddress":{"value":"10.10.20.235","dataType":"STRING","rawValue":"10.10.20.235","rawDataType":"STRING","severity":-1,"quality":"good","qualityType":"good","text":"","timestamp":1715367045843,"originType":"netin-ds-zavod"}}}',
  };

const BigArrayOfNulls: Types.Unencoded<Types.Primitive.ARRAY32> = {
  type: Types.Primitive.ARRAY32,
  descriptor: null,
  value: new Array(256).fill({
    type: Types.Primitive.NULL,
    descriptor: null,
    value: null,
  }),
};
const BigArrayOfNullsBuffer = Buffer.from([
  0xf0, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x01, 0x00, 0x40,
]);
const BigArrayOfOnes: Types.Unencoded<Types.Primitive.ARRAY32> = {
  type: Types.Primitive.ARRAY32,
  descriptor: null,
  value: new Array(256).fill({
    type: Types.Primitive.UBYTE,
    descriptor: null,
    value: 1,
  }),
};
const BigArrayOfOnesBuffer = Buffer.concat([
  Buffer.from([0xf0, 0x00, 0x00, 0x01, 0x05, 0x00, 0x00, 0x01, 0x00, 0x50]),
  Buffer.from(new Uint8Array(new Array(256).fill(1))),
]);
describe('#AMQP #Protocol #Types #Deserializer', () => {
  describe('#Happy Path', () => {
    it(`Should be able to encode a SASL Mechanisms to a buffer`, () => {
      const buffer = Constructors.encode(SASLMechanismsUndecoded);
      expect(buffer).toEqual(Buffer.from(SASLMechanismsBuffer));
    });
    it(`Should be able to encode a SASL Init to a buffer`, () => {
      const buffer = Constructors.encode(SASLInitUndecoded);
      expect(buffer).toEqual(Buffer.from(SASLInitBuffer));
    });
    it(`Should be able to encode a Frame Open to a buffer`, () => {
      const buffer = Constructors.encode(FrameOpenUndecoded);
      expect(buffer).toEqual(Buffer.from(FrameOpenBuffer));
    });
    it(`Should be able to encode a Frame Begin to a buffer`, () => {
      const args = Constructors.encode(TransferUndecodedArguments);
      const header = Constructors.encode(TransferUndecodedHeader);
      const messageProperties = Constructors.encode(TransferUndecodedMessageProperties);
      const applicationProperties = Constructors.encode(TransferUndecodedApplicationProperties);
      const value = Constructors.encode(TransferUndecodedValue);
      const buffer = Buffer.concat([args, header, messageProperties, applicationProperties, value]);
      expect(buffer).toEqual(Buffer.from(TransferBuffer));
    });
    it(`Should be able to encode a Big Array of Nulls to a buffer`, () => {
      const buffer = Constructors.encode(BigArrayOfNulls);
      expect(buffer).toEqual(Buffer.from(BigArrayOfNullsBuffer));
    });
    it(`Should be able to encode a Big Array of Ones to a buffer`, () => {
      const buffer = Constructors.encode(BigArrayOfOnes);
      expect(buffer).toEqual(Buffer.from(BigArrayOfOnesBuffer));
    });
    it(`Should return the correct fixed data width for all the options`, () => {
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.EMPTY)).toBe(0);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.FIXED_ONE)).toBe(0);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.FIXED_TWO)).toBe(0);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.FIXED_FOUR)).toBe(0);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.FIXED_EIGHT)).toBe(0);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.FIXED_SIXTEEN)).toBe(0);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.ARRAY_FOUR)).toBe(4);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.ARRAY_ONE)).toBe(1);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.COMPOUND_FOUR)).toBe(4);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.COMPOUND_ONE)).toBe(1);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.VARIABLE_FOUR)).toBe(4);
      // @ts-expect-error - Testing private method
      expect(Constructors.getSubcategoryWidth(Types.Subcategory.VARIABLE_ONE)).toBe(1);
    });
    it(`Should parse properly all the different types of primitives`, () => {
      expect(Parser.parse(undefined, Types.Primitive.TRUE)).toEqual(Buffer.alloc(0));
      expect(Parser.parse(undefined, Types.Primitive.FALSE)).toEqual(Buffer.alloc(0));
      expect(Parser.parse(undefined, Types.Primitive.NULL)).toEqual(Buffer.alloc(0));
      expect(Parser.parse(undefined, Types.Primitive.UNIT0)).toEqual(Buffer.alloc(0));
      expect(Parser.parse(undefined, Types.Primitive.ULONG0)).toEqual(Buffer.alloc(0));
      expect(Parser.parse(undefined, Types.Primitive.LIST0)).toEqual(Buffer.alloc(0));

      expect(() => Parser.parse(null, Types.Primitive.BOOLEAN)).toThrow('Expected a boolean, got');
      expect(Parser.parse(true, Types.Primitive.BOOLEAN)).toEqual(
        Buffer.from([Types.Primitive.TRUE])
      );
      expect(Parser.parse(false, Types.Primitive.BOOLEAN)).toEqual(
        Buffer.from([Types.Primitive.FALSE])
      );

      expect(() => Parser.parse(null, Types.Primitive.SMALL_UINT)).toThrow(
        'Expected a number, got'
      );
      expect(() => Parser.parse(800, Types.Primitive.SMALL_UINT)).toThrow(
        'Expected a number between 0 and 255,'
      );
      expect(Parser.parse(0, Types.Primitive.UBYTE)).toEqual(Buffer.from([0]));
      expect(Parser.parse(0, Types.Primitive.SMALL_UINT)).toEqual(Buffer.from([0]));
      expect(Parser.parse(0, Types.Primitive.SMALL_ULONG)).toEqual(Buffer.from([0]));

      expect(() => Parser.parse(null, Types.Primitive.USHORT)).toThrow('Expected a number, got');
      expect(() => Parser.parse(-1, Types.Primitive.USHORT)).toThrow(
        'Expected a number between 0 and 65535,'
      );
      expect(Parser.parse(0, Types.Primitive.USHORT)).toEqual(Buffer.from([0x00, 0x00]));

      expect(() => Parser.parse(null, Types.Primitive.UINT)).toThrow('Expected a number, got');
      expect(() => Parser.parse(-1, Types.Primitive.UINT)).toThrow(
        'Expected a number between 0 and 4294967295,'
      );
      expect(Parser.parse(0, Types.Primitive.UINT)).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x00]));

      expect(() => Parser.parse(null, Types.Primitive.ULONG)).toThrow(
        'Expected a number or bigint, got'
      );
      expect(() => Parser.parse(-1, Types.Primitive.ULONG)).toThrow(
        'Expected a positive number, got'
      );
      expect(Parser.parse(0, Types.Primitive.ULONG)).toEqual(
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      );
      expect(Parser.parse(BigInt(0), Types.Primitive.ULONG)).toEqual(
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      );

      expect(() => Parser.parse(null, Types.Primitive.SMALL_INT)).toThrow('Expected a number, got');
      expect(() => Parser.parse(800, Types.Primitive.SMALL_INT)).toThrow(
        'Expected a number between -128 and 127,'
      );
      expect(Parser.parse(0, Types.Primitive.BYTE)).toEqual(Buffer.from([0]));
      expect(Parser.parse(0, Types.Primitive.SMALL_INT)).toEqual(Buffer.from([0]));
      expect(Parser.parse(0, Types.Primitive.SMALL_LONG)).toEqual(Buffer.from([0]));

      expect(() => Parser.parse(null, Types.Primitive.SHORT)).toThrow('Expected a number, got');
      expect(() => Parser.parse(-32769, Types.Primitive.SHORT)).toThrow(
        'Expected a number between -32768 and 32767,'
      );
      expect(Parser.parse(0, Types.Primitive.SHORT)).toEqual(Buffer.from([0x00, 0x00]));

      expect(() => Parser.parse(null, Types.Primitive.INT)).toThrow('Expected a number, got');
      expect(() => Parser.parse(-2147483649, Types.Primitive.INT)).toThrow(
        'Expected a number between -2147483648 and 2147483647,'
      );
      expect(Parser.parse(0, Types.Primitive.INT)).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x00]));

      expect(() => Parser.parse(null, Types.Primitive.LONG)).toThrow(
        'Expected a number or bigint, got'
      );
      expect(Parser.parse(0, Types.Primitive.LONG)).toEqual(
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      );
      expect(Parser.parse(BigInt(0), Types.Primitive.LONG)).toEqual(
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      );

      expect(() => Parser.parse(null, Types.Primitive.FLOAT)).toThrow('Expected a number, got');
      expect(() => Parser.parse(1, Types.Primitive.FLOAT)).toThrow('Expected a float number, got');
      expect(Parser.parse(1.1, Types.Primitive.FLOAT)).toEqual(Buffer.from([63, 140, 204, 205]));

      expect(() => Parser.parse(null, Types.Primitive.DOUBLE)).toThrow('Expected a number, got');
      expect(() => Parser.parse(1, Types.Primitive.DOUBLE)).toThrow('Expected a float number, got');
      expect(Parser.parse(1.1, Types.Primitive.DOUBLE)).toEqual(
        Buffer.from([63, 241, 153, 153, 153, 153, 153, 154])
      );
      expect(() => Parser.parse(null, Types.Primitive.DECIMAL32)).toThrow(
        `Decoder for DECIMAL32 is not implemented`
      );
      expect(() => Parser.parse(null, Types.Primitive.DECIMAL64)).toThrow(
        `Decoder for DECIMAL64 is not implemented`
      );
      expect(() => Parser.parse(null, Types.Primitive.DECIMAL128)).toThrow(
        `Decoder for DECIMAL128 is not implemented`
      );

      expect(() => Parser.parse(null, Types.Primitive.CHAR)).toThrow('Expected a string, got');
      expect(() => Parser.parse('ab', Types.Primitive.CHAR)).toThrow(
        'Expected a string with a maximum length of 1, got'
      );
      expect(Parser.parse('a', Types.Primitive.CHAR)).toEqual(Buffer.from([0, 0, 0, 97]));

      expect(() => Parser.parse(null, Types.Primitive.TIMESTAMP)).toThrow('Expected a date, got');
      expect(Parser.parse(new Date(0), Types.Primitive.TIMESTAMP)).toEqual(
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])
      );

      expect(() => Parser.parse(null, Types.Primitive.UUID)).toThrow('Expected a string, got');
      expect(() =>
        Parser.parse('9131e924-5073-4abf-b72f-cbb8d35dc582s', Types.Primitive.UUID)
      ).toThrow('Expected a string with a maximum length of 36, got');
      expect(Parser.parse('9131e924-5073-4abf-b72f-cbb8d35dc582', Types.Primitive.UUID)).toEqual(
        Buffer.from([
          0x91, 0x31, 0xe9, 0x24, 0x50, 0x73, 0x4a, 0xbf, 0xb7, 0x2f, 0xcb, 0xb8, 0xd3, 0x5d, 0xc5,
          0x82,
        ])
      );

      expect(() => Parser.parse(null, Types.Primitive.VBIN8)).toThrow('Expected a buffer, got');
      expect(() => Parser.parse(Buffer.from(Array(256).fill('a')), Types.Primitive.VBIN8)).toThrow(
        'Expected a buffer with a maximum length of 255, got'
      );
      expect(Parser.parse(Buffer.from([1, 2]), Types.Primitive.VBIN8)).toEqual(
        Buffer.from([2, 1, 2])
      );
      expect(() => Parser.parse(null, Types.Primitive.VBIN32)).toThrow('Expected a buffer, got');
      expect(Parser.parse(Buffer.from([1, 2]), Types.Primitive.VBIN32)).toEqual(
        Buffer.from([0, 0, 0, 2, 1, 2])
      );

      expect(() => Parser.parse(null, Types.Primitive.STR8)).toThrow('Expected a string, got');
      expect(() => Parser.parse(''.padEnd(256, 'a'), Types.Primitive.STR8)).toThrow(
        'Expected a string with a maximum length of 255, got'
      );
      expect(Parser.parse('aa', Types.Primitive.STR8)).toEqual(Buffer.from([2, 97, 97]));
      expect(() => Parser.parse(null, Types.Primitive.STR32)).toThrow('Expected a string, got');
      expect(Parser.parse('aa', Types.Primitive.STR32)).toEqual(Buffer.from([0, 0, 0, 2, 97, 97]));

      expect(() => Parser.parse(null, Types.Primitive.SYM8)).toThrow('Expected a string, got');
      expect(() => Parser.parse(''.padEnd(256, 'a'), Types.Primitive.SYM8)).toThrow(
        'Expected a string with a maximum length of 255, got'
      );
      expect(Parser.parse('aa', Types.Primitive.SYM8)).toEqual(Buffer.from([2, 97, 97]));
      expect(() => Parser.parse(null, Types.Primitive.SYM32)).toThrow('Expected a string, got');
      expect(Parser.parse('aa', Types.Primitive.SYM32)).toEqual(Buffer.from([0, 0, 0, 2, 97, 97]));

      expect(() => Parser.parse(null, Types.Primitive.LIST8)).toThrow('Not parsable code [0x');
    });
  });
  describe('#Sad Path', () => {
    it(`Should fail when trying to encode an invalid Primitive`, () => {
      const invalid: any = {
        type: 'INVALID',
        descriptor: null,
        value: 'INVALID',
      };
      expect(() => Constructors.encode(invalid)).toThrow(
        `Invalid primitive, expected one of supported primitive but got [DESCRIPTOR]/[0]`
      );
    });
    it(`Should fail if try to encode as an descriptor a non descriptor primitive`, () => {
      const invalid: any = {
        type: Types.Primitive.NULL,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.descriptor(invalid)).toThrow(
        `Invalid primitive, expected a DESCRIPTOR but got a primitive without a descriptor [64]`
      );
    });
    it(`Should fail if try to encode as an fixedWidth a non fixedWidth primitive`, () => {
      const invalid: any = {
        type: Types.Primitive.VBIN32,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.fixedWidth(invalid)).toThrow(
        `Invalid primitive, expected a fixed width but got [VARIABLE_FOUR]/[b]`
      );
    });
    it(`Should fail if try to encode as an variableWidth a non variableWidth primitive`, () => {
      const invalid: any = {
        type: Types.Primitive.UBYTE,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.variableWidth(invalid)).toThrow(
        `Invalid primitive, expected VARIABLE_ONE or VARIABLE_FOUR but got [FIXED_ONE]/[5]`
      );
    });
    it(`Should fail if try to encode as an compound a non compound primitive`, () => {
      const invalid: any = {
        type: Types.Primitive.UBYTE,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.compound(invalid)).toThrow(
        `Invalid primitive, expected COMPOUND_ONE or COMPOUND_FOUR but got [FIXED_ONE]/[5]`
      );
      const nonArray: any = {
        type: Types.Primitive.LIST8,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.compound(nonArray)).toThrow(
        `Invalid compound value, expected an array`
      );
    });
    it(`Should fail if try to encode as an array a non array primitive`, () => {
      const invalid: any = {
        type: Types.Primitive.UBYTE,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.array(invalid)).toThrow(
        `Invalid primitive, expected ARRAY_ONE or ARRAY_FOUR but got [FIXED_ONE]/[5]`
      );
      const nonArray: any = {
        type: Types.Primitive.ARRAY8,
        descriptor: null,
        value: null,
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.array(nonArray)).toThrow(`Invalid array value, expected an array`);

      const nonSameTypeArray: any = {
        type: Types.Primitive.ARRAY8,
        descriptor: null,
        value: [
          { type: Types.Primitive.UBYTE, descriptor: null, value: 0 },
          { type: Types.Primitive.NULL, descriptor: null, value: null },
        ],
      };
      // @ts-expect-error - Testing private method
      expect(() => Constructors.array(nonSameTypeArray)).toThrow(
        `Invalid array value, all elements must have the same type`
      );
    });
  });
});
