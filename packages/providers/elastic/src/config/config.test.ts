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
