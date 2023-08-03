/** 
 * In this file we translate and refactor the following code from javascript to typescript
```js 
var SimpleAccessControlModel = function () {
  this.communitiesAccess = [];
  this.usersAccess = [];
};

SimpleAccessControlModel.prototype.getCommunityAccess = function (community) {
  return this.communitiesAccess.find((entry) => entry.community == community);
};

SimpleAccessControlModel.prototype.getCommunityAccessLevel = function (
  community
) {
  var communityAccessEntry = this.getCommunityAccess(community);
  return communityAccessEntry ? communityAccessEntry.level : AccessLevel.None;
};

SimpleAccessControlModel.prototype.getCommunitiesAccess = function () {
  return this.communitiesAccess;
};

SimpleAccessControlModel.prototype.setCommunityAccess = function (
  community,
  accessLevel
) {
  let accessEntry = this.getCommunityAccess(community);
  if (accessEntry) {
    accessEntry.level = accessLevel;
  } else {
    this.communitiesAccess.push({
      community: community,
      level: accessLevel,
    });
    this.communitiesAccess.sort((a, b) =>
      a.community > b.community ? 1 : -1
    );
  }
};

SimpleAccessControlModel.prototype.removeCommunityAccess = function (
  community
) {
  this.communitiesAccess.splice(
    this.communitiesAccess.findIndex((entry) => entry.community == community),
    1
  );
};

SimpleAccessControlModel.prototype.getUserAccess = function (userName) {
  return this.usersAccess.find((entry) => entry.userName == userName);
};

SimpleAccessControlModel.prototype.getUserAccessLevel = function (user) {
  var userAccessEntry = this.getUserAccess(user);
  return userAccessEntry ? userAccessEntry.level : AccessLevel.None;
};

SimpleAccessControlModel.prototype.getUsersAccess = function () {
  return this.usersAccess;
};

SimpleAccessControlModel.prototype.setUserAccess = function (
  userName,
  accessLevel
) {
  let accessEntry = this.getUserAccess(userName);
  if (accessEntry) {
    accessEntry.level = accessLevel;
  } else {
    this.usersAccess.push({
      userName: userName,
      level: accessLevel,
    });
    this.usersAccess.sort((a, b) => (a.userName > b.userName ? 1 : -1));
  }
};

SimpleAccessControlModel.prototype.removeUserAccess = function (userName) {
  this.usersAccess.splice(
    this.usersAccess.findIndex((entry) => entry.userName == userName),
    1
  );
};

SimpleAccessControlModel.prototype.isAccessAllowed = function (
  securityModel,
  securityName,
  pduType
) {
  var accessLevelConfigured;
  var accessLevelRequired;

  switch (securityModel) {
    case Version1:
    case Version2c:
      accessLevelConfigured = this.getCommunityAccessLevel(securityName);
      break;
    case Version3:
      accessLevelConfigured = this.getUserAccessLevel(securityName);
      break;
  }
  switch (pduType) {
    case PduType.SetRequest:
      accessLevelRequired = AccessLevel.ReadWrite;
      break;
    case PduType.GetRequest:
    case PduType.GetNextRequest:
    case PduType.GetBulkRequest:
      accessLevelRequired = AccessLevel.ReadOnly;
      break;
    default:
      accessLevelRequired = AccessLevel.None;
      break;
  }
  switch (accessLevelRequired) {
    case AccessLevel.ReadWrite:
      return accessLevelConfigured == AccessLevel.ReadWrite;
    case AccessLevel.ReadOnly:
      return (
        accessLevelConfigured == AccessLevel.ReadWrite ||
        accessLevelConfigured == AccessLevel.ReadOnly
      );
    case AccessLevel.None:
      return true;
    default:
      return false;
  }
};
```
*/

import { AccessLevel } from '../constants';

export interface CommunityAccess {
  community: string;
  level: AccessLevel;
}
export interface UserAccess {
  userName: string;
  level: AccessLevel;
}

export class SimpleAccessControlModel {
  private _communitiesAccess: CommunityAccess[];
  private _usersAccess: UserAccess[];

  constructor() {
    this._communitiesAccess = [];
    this._usersAccess = [];
  }

  public getCommunityAccess(community: string): CommunityAccess | undefined {
    return this._communitiesAccess.find(entry => entry.community == community);
  }

  public getCommunityAccessLevel(community: string): AccessLevel {
    const communityAccessEntry = this.getCommunityAccess(community);
    return communityAccessEntry ? communityAccessEntry.level : AccessLevel.None;
  }

  public getCommunitiesAccess() {
    return this._communitiesAccess;
  }

  public setCommunityAccess(community: string, accessLevel: AccessLevel): void {
    const accessEntry = this.getCommunityAccess(community);
    if (accessEntry) {
      accessEntry.level = accessLevel;
    } else {
      const newAccessEntry: CommunityAccess = {
        community: community,
        level: accessLevel,
      };
      this._communitiesAccess.push(newAccessEntry);
      this._communitiesAccess.sort((a, b) => (a.community > b.community ? 1 : -1));
    }
  }

  public removeCommunityAccess(community: string): void {
    this._communitiesAccess.splice(
      this._communitiesAccess.findIndex(entry => entry.community == community),
      1
    );
  }

  public getUserAccess(userName: string): UserAccess | undefined {
    return this._usersAccess.find(entry => entry.userName == userName);
  }

  public getUserAccessLevel(user: string): AccessLevel {
    const userAccessEntry = this.getUserAccess(user);
    return userAccessEntry ? userAccessEntry.level : AccessLevel.None;
  }

  public getUsersAccess() {
    return this._usersAccess;
  }

  public setUserAccess(userName: string, accessLevel: AccessLevel): void {
    const accessEntry = this.getUserAccess(userName);
    if (accessEntry) {
      accessEntry.level = accessLevel;
    } else {
      const newAccessEntry: UserAccess = {
        userName: userName,
        level: accessLevel,
      };
      this._usersAccess.push(newAccessEntry);
      this._usersAccess.sort((a, b) => (a.userName > b.userName ? 1 : -1));
    }
  }

  public removeUserAccess(userName: string): void {
    this._usersAccess.splice(
      this._usersAccess.findIndex(entry => entry.userName == userName),
      1
    );
  }

  public isAccessAllowed(securityModel: number, securityName: string, pduType: number): boolean {
    let accessLevelConfigured: AccessLevel | undefined;
    let accessLevelRequired: AccessLevel;

    switch (securityModel) {
      case 0:
      case 1:
        accessLevelConfigured = this.getCommunityAccessLevel(securityName);
        break;
      case 3:
        accessLevelConfigured = this.getUserAccessLevel(securityName);
        break;
    }

    switch (pduType) {
      case 3:
        accessLevelRequired = AccessLevel.ReadWrite;
        break;
      case 0:
      case 1:
      case 4:
      case 5:
        accessLevelRequired = AccessLevel.ReadOnly;
        break;
      default:
        accessLevelRequired = AccessLevel.None;
        break;
    }

    switch (accessLevelRequired) {
      case AccessLevel.ReadWrite:
        return accessLevelConfigured == AccessLevel.ReadWrite;
      case AccessLevel.ReadOnly:
        return (
          accessLevelConfigured == AccessLevel.ReadWrite ||
          accessLevelConfigured == AccessLevel.ReadOnly
        );
      case AccessLevel.None:
        return true;
      default:
        return false;
    }
  }
}
