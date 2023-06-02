/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { DLNode } from './DLList.interfaces';

export class DLList<T> {
  private incr: () => void;
  private decr: () => void;
  private _first: DLNode<T> | null;
  private _last: DLNode<T> | null;
  public length: number;
  constructor(incr: () => void, decr: () => void) {
    this.incr = incr;
    this.decr = decr;
    this._first = null;
    this._last = null;
    this.length = 0;
  }
  push(value: T): void {
    this.length++;
    if (typeof this.incr === 'function') {
      this.incr();
    }
    const node: DLNode<T> = {
      value,
      prev: this._last,
      next: null,
    };
    if (this._last != null) {
      this._last.next = node;
      this._last = node;
    } else {
      this._first = this._last = node;
    }
  }
  shift(): T | undefined {
    let value: T | undefined;
    if (this._first == null) {
      return;
    } else {
      this.length--;

      if (typeof this.decr === 'function') {
        this.decr();
      }

      value = this._first.value;
      if (this._first.next != null) {
        this._first = this._first.next;
        this._first.prev = null;
      } else {
        this._first = null;
        this._last = null;
      }

      return value;
    }
  }

  first(): T | undefined {
    if (this._first != null) {
      return this._first.value;
    }
    return undefined;
  }

  getArray(): T[] {
    let node: DLNode<T> | null = this._first;
    const results: T[] = [];
    while (node != null) {
      results.push(node.value);
      node = node.next;
    }
    return results;
  }

  forEachShift(cb: (value: T) => void): void {
    let nodeValue: T | undefined = this.shift();
    while (nodeValue != undefined) {
      cb(nodeValue);
      nodeValue = this.shift();
    }
  }

  debug(): { value: T; prev: T | undefined; next: T | undefined }[] {
    let node: DLNode<T> | null = this._first;
    const results: { value: T; prev: T | undefined; next: T | undefined }[] = [];
    while (node != null) {
      results.push({
        value: node.value,
        prev: node.prev != null ? node.prev.value : undefined,
        next: node.next != null ? node.next.value : undefined,
      });
      node = node.next;
    }
    return results;
  }
}
