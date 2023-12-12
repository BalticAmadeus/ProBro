export interface IUserStorageService {
  globalKeys(): readonly string[];
  globalGet<T>(key: string): T | undefined;
  globalGetOrDefault<T>(key: string, defaultValue: T): T;
  globalUpdate(key: string, value: any): Thenable<void>;
  workspaceKeys(): readonly string[];
  workspaceGet<T>(key: string): T | undefined;
  workspaceGetOrDefault<T>(key: string, defaultValue: T): T;
  workspaceUpdate(key: string, value: any): Thenable<void>;
}
