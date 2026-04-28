export type TokenCacheEntry = {
  accessToken: string;
  cacheKey: string;
  expiresAt: number;
};

export type FolderTargetCacheEntry = {
  driveId: string;
  itemId: string;
  shareUrl: string;
};

export type SharePointConfig =
  | {
      authMode: "client_credentials";
      clientId: string;
      clientSecret: string;
      scopes: string;
      shareUrl: string;
      tenantId: string;
    }
  | {
      authMode: "ropc";
      clientId: string;
      clientSecret?: string;
      password: string;
      scopes: string;
      shareUrl: string;
      tenantId: string;
      username: string;
    };

export type GraphTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number | string;
  expires_on?: number | string;
};

export type SharedDriveItemResponse = {
  id?: string;
  name?: string;
  parentReference?: {
    driveId?: string;
  };
  remoteItem?: {
    id?: string;
    parentReference?: {
      driveId?: string;
    };
  };
};

export type SharePointSyncResult =
  | {
      skipped: true;
      synced: false;
    }
  | {
      synced: true;
    };

