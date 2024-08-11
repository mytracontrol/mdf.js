/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { deCycle, retroCycle } from './cycle';
describe('cycle', () => {
  describe('#Happy path', () => {
    it('should deCycle and retroCycle an object', () => {
      const obj = {
        a: 1,
        b: 2,
        c: {
          d: 3,
          e: 4,
          f: {
            g: 5,
            h: 6,
          },
        },
      };
      const deCycled = deCycle(obj);
      const retroCycled = retroCycle(deCycled);
      expect(retroCycled).toStrictEqual(obj);
    });
    it('should deCycle and retroCycle an circular reference object in array', () => {
      const a: any[] = [];
      a[0] = a;

      const deCycled = deCycle(a);
      expect(deCycled).toStrictEqual([{ $ref: '$' }]);
      const retroCycled = retroCycle(deCycled);
      expect(retroCycled).toStrictEqual(a);
    });
    it('should deCycle and retroCycle an circular reference object in object', () => {
      const a: any = {
        a: 3,
        b: 4,
        c: {
          d: 5,
          e: 6,
        },
        h: {
          i: 7,
          j: 8,
        },
      };
      a.c.f = a;
      a.h.k = a.c;
      const deCycled = deCycle(a);
      expect(deCycled).toStrictEqual({
        a: 3,
        b: 4,
        c: {
          d: 5,
          e: 6,
          f: {
            $ref: '$',
          },
        },
        h: {
          i: 7,
          j: 8,
          k: {
            $ref: '$["c"]',
          },
        },
      });
      const retroCycled = retroCycle(deCycled);
      expect(retroCycled).toStrictEqual(a);
    });
  });
});
