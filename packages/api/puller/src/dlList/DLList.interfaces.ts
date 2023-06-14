/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

export interface DLNode<T> {
  value: T;
  prev: DLNode<T> | null;
  next: DLNode<T> | null;
}
