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
  private _length: number;
  constructor(incr: () => void, decr: () => void) {
    this.incr = incr;
    this.decr = decr;
    this._first = null;
    this._last = null;
    this._length = 0;
  }
  public push(value: T): void {
    this._length++;

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
  public shift(): T | null {
    if (this._first == null) {
      return null;
    } else {
      this._length--;

      if (typeof this.decr === 'function') {
        this.decr();
      }

      const value = this._first.value;
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

  public first(): T | null {
    if (this._first != null) {
      return this._first.value;
    }
    return null;
  }

  public getArray(): T[] {
    let node: DLNode<T> | null = this._first;
    const results: T[] = [];
    while (node != null) {
      results.push(node.value);
      node = node.next;
    }
    return results;
  }

  public forEachShift(cb: (value: T) => void): void {
    let nodeValue: T | null = this.shift();
    while (nodeValue != null) {
      cb(nodeValue);
      nodeValue = this.shift();
    }
  }

  public debug(): { value: T; prev: T | null; next: T | null }[] {
    let node: DLNode<T> | null = this._first;
    const results: { value: T; prev: T | null; next: T | null }[] = [];
    while (node != null) {
      results.push({
        value: node.value,
        prev: node.prev != null ? node.prev.value : null,
        next: node.next != null ? node.next.value : null,
      });
      node = node.next;
    }
    return results;
  }

  // -------------- GETTERS --------------------
  public get length(): number {
    return this._length;
  }
}
