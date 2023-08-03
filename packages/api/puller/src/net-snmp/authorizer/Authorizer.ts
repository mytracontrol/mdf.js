import { AccessControlModelType, AccessLevel } from '../constants';
import { User } from '../user.interface';
import { SimpleAccessControlModel } from './SimpleAccessControlModel';

/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var Authorizer = function (options) {
  this.communities = [];
  this.users = [];
  this.disableAuthorization = options.disableAuthorization;
  this.accessControlModelType =
    options.accessControlModelType || AccessControlModelType.None;

  if (this.accessControlModelType == AccessControlModelType.None) {
    this.accessControlModel = null;
  } else if (this.accessControlModelType == AccessControlModelType.Simple) {
    this.accessControlModel = new SimpleAccessControlModel();
  }
};

Authorizer.prototype.addCommunity = function (community) {
  if (this.getCommunity(community)) {
    return;
  } else {
    this.communities.push(community);
    if (this.accessControlModelType == AccessControlModelType.Simple) {
      this.accessControlModel.setCommunityAccess(
        community,
        AccessLevel.ReadOnly
      );
    }
  }
};

Authorizer.prototype.getCommunity = function (community) {
  return (
    this.communities.filter(
      (localCommunity) => localCommunity == community
    )[0] || null
  );
};

Authorizer.prototype.getCommunities = function () {
  return this.communities;
};

Authorizer.prototype.deleteCommunity = function (community) {
  var index = this.communities.indexOf(community);
  if (index > -1) {
    this.communities.splice(index, 1);
  }
};

Authorizer.prototype.addUser = function (user) {
  if (this.getUser(user.name)) {
    this.deleteUser(user.name);
  }
  this.users.push(user);
  if (this.accessControlModelType == AccessControlModelType.Simple) {
    this.accessControlModel.setUserAccess(user.name, AccessLevel.ReadOnly);
  }
};

Authorizer.prototype.getUser = function (userName) {
  return (
    this.users.filter((localUser) => localUser.name == userName)[0] || null
  );
};

Authorizer.prototype.getUsers = function () {
  return this.users;
};

Authorizer.prototype.deleteUser = function (userName) {
  var index = this.users.findIndex((localUser) => localUser.name == userName);
  if (index > -1) {
    this.users.splice(index, 1);
  }
};

Authorizer.prototype.getAccessControlModelType = function () {
  return this.accessControlModelType;
};

Authorizer.prototype.getAccessControlModel = function () {
  return this.accessControlModel;
};

Authorizer.prototype.isAccessAllowed = function (
  securityModel,
  securityName,
  pduType
) {
  if (this.accessControlModel) {
    return this.accessControlModel.isAccessAllowed(
      securityModel,
      securityName,
      pduType
    );
  } else {
    return true;
  }
};
```
*/
export interface AuthorizerOptions {
  disableAuthorization: boolean;
  accessControlModelType?: AccessControlModelType;
}

export class Authorizer {
  public communities: string[];
  public users: User[];
  public disableAuthorization: boolean;
  private _accessControlModelType: AccessControlModelType;
  private _accessControlModel: SimpleAccessControlModel | null;

  constructor(options: AuthorizerOptions) {
    this.communities = [];
    this.users = [];
    this.disableAuthorization = options.disableAuthorization;
    this._accessControlModelType = options.accessControlModelType || AccessControlModelType.None;

    if (this._accessControlModelType == AccessControlModelType.None) {
      this._accessControlModel = null;
    } else if (this._accessControlModelType == AccessControlModelType.Simple) {
      this._accessControlModel = new SimpleAccessControlModel();
    }
  }

  public addCommunity(community: string): void {
    if (this.getCommunity(community)) {
      return;
    } else {
      this.communities.push(community);
      if (
        this._accessControlModelType == AccessControlModelType.Simple &&
        this._accessControlModel
      ) {
        this._accessControlModel.setCommunityAccess(community, AccessLevel.ReadOnly);
      }
    }
  }

  public getCommunity(community: string): string | null {
    // TODO: Could be replaced by a contains() and return the same community string
    return this.communities.filter(localCommunity => localCommunity == community)[0] || null;
  }

  public getCommunities(): string[] {
    return this.communities;
  }

  public deleteCommunity(community: string): void {
    const index = this.communities.indexOf(community);
    if (index > -1) {
      this.communities.splice(index, 1);
    }
  }

  public addUser(user: User): void {
    if (this.getUser(user.name)) {
      this.deleteUser(user.name);
    }

    this.users.push(user);
    if (this._accessControlModelType == AccessControlModelType.Simple && this._accessControlModel) {
      this._accessControlModel.setUserAccess(user.name, AccessLevel.ReadOnly);
    }
  }
  public getUser(userName: string): User | null {
    // TODO: Could be replaced by find()
    return this.users.filter(localUser => localUser.name == userName)[0] || null;
  }

  public getUsers(): User[] {
    return this.users;
  }

  public deleteUser(userName: string): void {
    const index = this.users.findIndex(localUser => localUser.name == userName);
    if (index > -1) {
      this.users.splice(index, 1);
    }
  }

  public getAccessControlModelType(): AccessControlModelType {
    return this._accessControlModelType;
  }

  public getAccessControlModel(): SimpleAccessControlModel | null {
    return this._accessControlModel;
  }

  public isAccessAllowed(securityModel: number, securityName: string, pduType: number): boolean {
    if (this._accessControlModel) {
      return this._accessControlModel.isAccessAllowed(securityModel, securityName, pduType);
    } else {
      return true;
    }
  }
}
