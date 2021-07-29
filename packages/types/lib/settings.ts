import { AdminPermissions, ContentPermissions } from "@lib/permissions";

export enum UserSettings {}

export enum ChannelSettings {}

export type AdminSettings = {
  [user: string]: {
    permissions: Array<AdminPermissions>;
  };
};

export type ModerationSettings<T extends ContentPermissions | null = null> = {
  [content: string]: Array<
    T extends ContentPermissions ? T : ContentPermissions
  >;
};

export type ModeratorSettings<T extends ContentPermissions | null = null> = {
  [user: string]: {
    moderations: ModerationSettings<T>;
  };
};
