/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 * Note: All information contained herein is, and remains the property of Mytra Control S.L. and its
 * suppliers, if any. The intellectual and technical concepts contained herein are property of
 * Mytra Control S.L. and its suppliers and may be covered by European and Foreign patents, patents
 * in process, and are protected by trade secret or copyright.
 *
 * Dissemination of this information or the reproduction of this material is strictly forbidden
 * unless prior written permission is obtained from Mytra Control S.L.
 */

import { Crash } from '@mdf.js/crash';

export class AddressMapper {
  /** Address resolution map */
  private readonly addressMap: Map<string, string>;
  /** Reverse address resolution map */
  private readonly reverseAddressMap: Map<string, string>;
  /** Create a new instance of AddressMapper */
  constructor() {
    this.addressMap = new Map();
    this.reverseAddressMap = new Map();
  }
  /**
   * Update or create a new address entry in the map
   * @param socketId - Socket.IO to be mapped
   * @param openC2Id - OpenC2 identification to be mapped
   */
  public update(socketId: string, openC2Id: string): void {
    if (typeof socketId !== 'string' || typeof openC2Id !== 'string') {
      throw new Crash('No valid parameters, Socket.IO and OpenC2 id should be strings');
    }
    this.addressMap.set(socketId, openC2Id);
    this.reverseAddressMap.set(openC2Id, socketId);
  }
  /**
   * Delete an entry from the address map
   * @param socketId - Socket.IO id to be removed
   */
  public delete(socketId: string): void {
    if (typeof socketId !== 'string') {
      throw new Crash(`An invalid Socket.IO id was provided`);
    }
    const openC2Id = this.addressMap.get(socketId);
    if (openC2Id) {
      this.reverseAddressMap.delete(openC2Id);
      this.addressMap.delete(socketId);
    }
  }
  /**
   * Get the OpenC2 id that match with the provided Socket.IO id
   * @param socketId - socket identification to be mapped
   * @returns OpenC2 id
   * @throws if no valid URL is provided URL
   * @example
   * ```typescript
   * const mapper = new AddressMapper();
   * mapper.update('CmFw2HksBDH5Q6VMAAAC', 'myId');
   * mapper.update('mK8mSuq2R0QxLDdHAAAF', 'myOtherId');
   * mapper.getBySocketId('otherId'); // undefined
   * mapper.getBySocketId('CmFw2HksBDH5Q6VMAAAC'); // 'myId'
   * mapper.getBySocketId('mK8mSuq2R0QxLDdHAAAF'); // 'myOtherId'
   * ```
   */
  public getBySocketId(socketId: string): string | undefined {
    if (typeof socketId !== 'string') {
      throw new Crash(`An invalid Socket.IO id was provided`);
    }
    return this.addressMap.get(socketId);
  }
  /**
   * Get the Socket.IO id from the OpenC2 id
   * @param openC2Id - OpenC2 id to be mapped
   * @returns Socket.IO id
   * @throws if no valid OpenC2 id is provided
   * @example
   * ```typescript
   * const mapper = new AddressMapper();
   * mapper.update('CmFw2HksBDH5Q6VMAAAC', 'myId');
   * mapper.update('mK8mSuq2R0QxLDdHAAAF', 'myOtherId');
   * mapper.getByOpenC2Id('otherId'); // undefined
   * mapper.getByOpenC2Id('CmFw2HksBDH5Q6VMAAAC'); // 'myId'
   * mapper.getByOpenC2Id('mK8mSuq2R0QxLDdHAAAF'); // 'myOtherId'
   * ```
   */
  public getByOpenC2Id(openC2Id: string): string | undefined {
    if (typeof openC2Id !== 'string') {
      throw new Crash(`An invalid OpenC2 id was provided`);
    }
    return this.reverseAddressMap.get(openC2Id);
  }
}
