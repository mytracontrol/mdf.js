/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

import fs from 'fs';

/** Represents the available read flags for file system operations */
export type ReadFlag = 'r' | 'rs' | 'r+' | 'rs+';
/** * Represents the available copy modes for the file system manager */
export type CopyMode =
  | typeof fs.constants.COPYFILE_EXCL
  | typeof fs.constants.COPYFILE_FICLONE
  | typeof fs.constants.COPYFILE_FICLONE_FORCE;

/** Represents the options for reading a file */
export interface ReadOptions {
  encoding?: BufferEncoding;
  flag?: ReadFlag;
}
/** Represents the options for copying a file */
export interface CopyOptions {
  mode?: CopyMode;
}
/** Represents the options for writing a file. See Node fs WriteFileOptions */
export type WriteOptions = fs.WriteFileOptions;

/** Represents the options for reading a directory */
export interface ReadDirOptions {
  encoding?: BufferEncoding;
  recursive?: boolean;
}

/** Represents the options for the FileSystemManager */
export interface FileSystemManagerOptions {
  readOptions: ReadOptions;
  writeOptions: WriteOptions;
  copyOptions: CopyOptions;
  readDirOptions: ReadDirOptions;
}
