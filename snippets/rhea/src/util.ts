/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { cloneDeep } from 'lodash';
import { parse, stringify, v4 } from 'uuid';
import { TypeError } from './errors';

// export type generate_uuid = () => string;
// export type uuid4 = () => Buffer;
// export type uuid_to_string = (buffer: Buffer) => string;
// export type string_to_uuid = (uuid_string: string) => Buffer;
// export type clone = (o: any) => any;
// export type and = (f: Function, g: Function) => Function;
// export type is_sender = (o: any) => boolean;
// export type is_receiver = (o: any) => boolean;
// export type sender_filter = (filter: any) => Function;
// export type receiver_filter = (filter: any) => Function;
// export type is_defined = (field: any) => boolean;

export function allocate_buffer(size: number) {
  return Buffer.alloc(size);
}
export function generate_uuid(): string {
  return v4();
}
export function uuid4(): Buffer {
  const buffer = Buffer.alloc(16);
  return v4(null, buffer, 0);
}
export function string_to_uuid(uuid_string: string): Buffer {
  try {
    return Buffer.from(parse(uuid_string));
  } catch (e) {
    throw new TypeError(`Not a valid UUID string: ${uuid_string}`);
  }
}
export function uuid_to_string(buffer: Buffer): string {
  try {
    return stringify(buffer);
  } catch (e) {
    throw new TypeError('Not a UUID, expecting 16 byte buffer');
  }
}
export function clone(o: any): any {
  return cloneDeep(o);
}
export function and(f: Function, g: Function): Function {
  return (o: any) => f(o) && g(o);
}
export function is_sender(o: any): boolean {
  return o && o.is_sender;
}
export function is_receiver(o: any): boolean {
  return o && o.is_receiver;
}
export function sender_filter(filter: any): Function {
  return and(is_sender, filter);
}
export function receiver_filter(filter: any): Function {
  return and(is_receiver, filter);
}
export function is_defined(field: any): boolean {
  return field !== undefined && field !== null;
}
