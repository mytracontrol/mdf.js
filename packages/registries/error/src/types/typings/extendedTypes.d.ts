/**
 * Copyright 2024 Mytra Control S.L. All rights reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be found in the LICENSE file
 * or at https://opensource.org/licenses/MIT.
 */

declare namespace Express {
  interface Request {
    uuid: string;
    user: string;
    role: string;
  }
}
