/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import type { ChokidarOptions } from 'chokidar';
import { v4 } from 'uuid';
import type { InternalWatcherOptions } from './WatcherOptions.i';

/** Default watcher options */
export const DEFAULT_WATCHER_OPTIONS: InternalWatcherOptions = {
  /** Watcher name */
  name: 'watcher',
  /** Component identifier */
  componentId: v4(),
  /** Watch folder */
  watchPath: './data/archive',
  /** Base path */
  cwd: undefined,
  /** Max number of errors to store */
  maxErrors: 10,
};

/** Default fs watcher options */
export const DEFAULT_FS_WATCHER_OPTIONS: ChokidarOptions = {
  persistent: true,
  ignored: undefined,
  ignoreInitial: false,
  followSymlinks: true,
  cwd: undefined,
  usePolling: false,
  alwaysStat: false,
  depth: undefined,
  awaitWriteFinish: {
    stabilityThreshold: 10000,
    pollInterval: 1000,
  },
  ignorePermissionErrors: false,
  atomic: true,
};
