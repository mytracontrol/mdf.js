/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
// *************************************************************************************************
// #region Arrange
import { defaultConfig } from './default';
import { CONFIG_PROVIDER_BASE_NAME, nodeToNodes, selectAuth } from './utils';
// #endregion
// *************************************************************************************************
// #region Redis config
describe(`#Config #${CONFIG_PROVIDER_BASE_NAME.toLocaleUpperCase()}`, () => {
  describe('#Happy path', () => {
    it(`Should has a default config`, () => {
      expect(defaultConfig).toMatchObject({
        maxRetries: 5,
        name: 'mdf-elastic',
        nodes: ['http://localhost:9200'],
        pingTimeout: 3000,
        requestTimeout: 30000,
        resurrectStrategy: 'ping',
      });
    }, 300);
    it(`Should return an array of one position if only node is configured`, () => {
      expect(nodeToNodes('hi')).toEqual(['hi']);
    }, 300);
    it(`Should return an array with nodes if node and nodes is configured`, () => {
      expect(nodeToNodes('hi', 'bye')).toEqual(['bye']);
    }, 300);
    it(`Should return an array with nodes if only nodes is configured`, () => {
      expect(nodeToNodes(undefined, 'bye')).toEqual(['bye']);
    }, 300);
    it(`Should return undefined if none of them  are configured`, () => {
      expect(nodeToNodes()).toBeUndefined();
    }, 300);
    it(`Should return auth, only if username and password are configured`, () => {
      expect(selectAuth()).toBeUndefined();
      expect(selectAuth('a')).toBeUndefined();
      expect(selectAuth(undefined, 'b')).toBeUndefined();
      expect(selectAuth('a', 'b')).toMatchObject({ username: 'a', password: 'b' });
    }, 300);
  });
});

// #endregion
