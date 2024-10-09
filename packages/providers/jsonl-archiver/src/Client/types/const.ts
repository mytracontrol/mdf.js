/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import { ArchiveOptions } from './ArchiveOptions.i';
import { FileStats } from './FileStats.i';

/** Default base filename for the files */
export const DEFAULT_BASE_FILENAME = 'file';

/** Default ArchiveOptions */
export const DEFAULT_ARCHIVE_OPTIONS: ArchiveOptions = {
  separator: '\n',
  propertyData: undefined,
  propertyFileName: undefined,
  propertySkip: undefined,
  propertySkipValue: undefined,
  defaultBaseFilename: DEFAULT_BASE_FILENAME,
  workingFolderPath: './data/working',
  archiveFolderPath: './data/archive',
  createFolders: true,
  inactiveTimeout: undefined,
  fileEncoding: 'utf-8',
  rotationInterval: undefined,
  rotationSize: undefined,
  rotationLines: undefined,
  retryOptions: {
    attempts: 3,
    timeout: 3000,
    waitTime: 1000,
    maxWaitTime: 10000,
  },
};

/** Default FileStats */
export const DEFAULT_STATS: FileStats = {
  handler: '',
  fileName: '',
  filePath: '',
  isActive: false,
  onError: false,
  creationTimestamp: '',
  lastModifiedTimestamp: '',
  lastRotationTimestamp: '',
  currentSize: 0,
  numberLines: 0,
  appendSuccesses: 0,
  appendErrors: 0,
  rotationCount: 0,
};
