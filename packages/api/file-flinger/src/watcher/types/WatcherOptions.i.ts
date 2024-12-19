/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

/** Watcher options */
export interface WatcherOptions {
  /** The name of the watcher */
  name?: string;
  /** The component identifier */
  componentId?: string;
  /** The path to watch */
  watchPath?: string | string[];
  /** The base path to use */
  cwd?: string | undefined;
  /** Max number of errors to store */
  maxErrors?: number;
}

/** Internal watcher options */
export type InternalWatcherOptions = Required<Omit<WatcherOptions, 'cwd'>> & {
  cwd: string | undefined;
};
