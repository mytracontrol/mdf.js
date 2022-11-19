/**
 * Copyright 2022 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */
import { CreateCollectionOptions, IndexDescription, MongoClientOptions } from 'mongodb';

export interface Collections {
  [key: string]: {
    options: CreateCollectionOptions;
    indexes: IndexDescription[];
  };
}
export interface Config extends MongoClientOptions {
  /** Mongo database connection string */
  url?: string;
  /** Mongo database collections */
  collections?: Collections;
}
