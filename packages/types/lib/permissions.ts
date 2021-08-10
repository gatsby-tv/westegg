export enum AdminPermissions {}

export enum VideoPermissions {}

export enum ShowPermissions {}

export enum PlaylistPermissions {}

export type ContentPermissions =
  | VideoPermissions
  | ShowPermissions
  | PlaylistPermissions;
