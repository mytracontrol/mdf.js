/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { DLNode } from '.';

/**
 * Represents a doubly linked list.
 * @remarks
 * This class provides functionality to push, shift, and iterate over
 * values in a doubly linked list.
 * @typeparam T - The type of elements stored in the list.
 */
export class DLList<T> {
  /** The function to increment the list counter. */
  private incr: () => void;
  /** The function to decrement the list counter. */
  private decr: () => void;
  /** The first node of the list */
  private _first: DLNode<T> | null;
  /** The last node of the list */
  private _last: DLNode<T> | null;
  /** The number of elements in the list */
  private _length: number;

  /**
   * Creates a new instance of the DLList class that represents a doubly linked list.
   * @param incr - The function to increment the list counter.
   * @param decr - The function to decrement the list counter.
   */
  constructor(incr: () => void, decr: () => void) {
    this.incr = incr;
    this.decr = decr;
    this._first = null;
    this._last = null;
    this._length = 0;
  }

  /**
   * Adds a value to the end of the list.
   * @param value - The value to add to the list.
   */
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

  /**
   * Removes and returns the first value from the list.
   * @returns The first value in the list, or null if the list is empty.
   */
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

  /**
   * Returns the first value in the list without removing it.
   * @returns The first value in the list, or null if the list is empty.
   */
  public first(): T | null {
    if (this._first != null) {
      return this._first.value;
    }
    return null;
  }

  /**
   * Returns an array containing all the values in the list.
   * @returns An array of values in the list.
   */
  public getArray(): T[] {
    let node: DLNode<T> | null = this._first;
    const results: T[] = [];
    while (node != null) {
      results.push(node.value);
      node = node.next;
    }
    return results;
  }

  /**
   * Iterates over each value in the list, removing and invoking a callback function for each value.
   * @param cb - The callback function to invoke for each value.
   */
  public forEachShift(cb: (value: T) => void): void {
    let nodeValue: T | null = this.shift();
    while (nodeValue != null) {
      cb(nodeValue);
      nodeValue = this.shift();
    }
  }

  /**
   * Returns a debug representation of the list.
   * @returns An array of objects containing the value, previous value, and next value for each
   * node in the list.
   */
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

  /*
   * ---------------------------------------------------------------------------------------------
   * GETTERS
   * ---------------------------------------------------------------------------------------------
   */
  /** Return the length of the list */
  public get length(): number {
    return this._length;
  }
}
