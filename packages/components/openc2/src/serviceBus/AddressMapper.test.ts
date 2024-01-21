/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { AddressMapper } from './AddressMapper';

describe('#AddressMapper', () => {
  describe('#Happy path', () => {
    it('Should create an instance of AddressMapper', () => {
      const addressMapper = new AddressMapper();
      expect(addressMapper).toBeDefined();
      expect(addressMapper).toBeInstanceOf(AddressMapper);
    });
    it('Should allow to update the map with new entries and get it by Socket.IO id and OpenC2 id', () => {
      const addressMapper = new AddressMapper();
      addressMapper.update('mK8mSuq2R0QxLDdHAAAF', 'id1');
      addressMapper.update('CmFw2HksBDH5Q6VMAAAC', 'id2');
      expect(addressMapper.getBySocketId('mK8mSuq2R0QxLDdHAAAF')).toEqual('id1');
      expect(addressMapper.getBySocketId('CmFw2HksBDH5Q6VMAAAC')).toEqual('id2');
      expect(addressMapper.getBySocketId('http://localhost:8083')).toBeUndefined();
      expect(addressMapper.getByOpenC2Id('id1')).toEqual('mK8mSuq2R0QxLDdHAAAF');
      expect(addressMapper.getByOpenC2Id('id2')).toEqual('CmFw2HksBDH5Q6VMAAAC');
      expect(addressMapper.getByOpenC2Id('id4')).toBeUndefined();
      addressMapper.delete('mK8mSuq2R0QxLDdHAAAF');
      expect(addressMapper.getBySocketId('mK8mSuq2R0QxLDdHAAAF')).toBeUndefined();
      expect(addressMapper.getByOpenC2Id('id1')).toBeUndefined();
    });
  });
  describe('#Sad path', () => {
    it('Should throw an error when try to get a Socket.IO id and pass and invalid OpenC2 id', () => {
      const addressMapper = new AddressMapper();
      //@ts-ignore - Test environment
      expect(() => addressMapper.getByOpenC2Id(2)).toThrowError(
        `An invalid OpenC2 id was provided`
      );
    });
    it('Should throw an error when try to get an OpenC2 id and pass and invalid URL', () => {
      const addressMapper = new AddressMapper();
      //@ts-ignore - Test environment
      expect(() => addressMapper.getBySocketId(2)).toThrowError(
        `An invalid Socket.IO id was provided`
      );
    });
    it('Should throw an error when try to update the map and pass an non-string Socket.IO or OpenC2 id', () => {
      const addressMapper = new AddressMapper();
      //@ts-ignore - Test environment
      expect(() => addressMapper.update(2, 'id1')).toThrowError(
        `No valid parameters, Socket.IO and OpenC2 id should be strings`
      );
      //@ts-ignore - Test environment
      expect(() => addressMapper.update('mK8mSuq2R0QxLDdHAAAF', 2)).toThrowError(
        `No valid parameters, Socket.IO and OpenC2 id should be strings`
      );
    });
    it('Should throw an error when try to delete and pass an non-string Socket.IO', () => {
      const addressMapper = new AddressMapper();
      //@ts-ignore - Test environment
      expect(() => addressMapper.delete(2)).toThrowError(`An invalid Socket.IO id was provided`);
    });
  });
});
