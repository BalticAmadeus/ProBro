import { Memento } from "vscode";
import { IUserStorageService } from "../interfaces/IUserStorageService";

export class UserStorageProxy implements IUserStorageService {
  private workspaceState: Memento;
  private globalState: Memento;

  public constructor(workspaceState: Memento, globalState: Memento) {
    this.workspaceState = workspaceState;
    this.globalState = globalState;
  }

  public globalKeys(): readonly string[] {
    return this.workspaceState.keys();
  }

  public globalGet<T>(key: string): T | undefined {
    return this.workspaceState.get<T>(key);
  }

  public globalGetOrDefault<T>(key: string, defaultValue: T): T {
    return this.workspaceState.get<T>(key, defaultValue);
  }
  public globalUpdate(key: string, value: any): Thenable<void> {
    return this.workspaceState.update(key, value);
  }

  public workspaceKeys(): readonly string[] {
    return this.workspaceState.keys();
  }

  public workspaceGet<T>(key: string): T | undefined {
    return this.workspaceState.get<T>(key);
  }

  public workspaceGetOrDefault<T>(key: string, defaultValue: T): T {
    return this.workspaceState.get<T>(key, defaultValue);
  }
  public workspaceUpdate(key: string, value: any): Thenable<void> {
    return this.workspaceState.update(key, value);
  }
}
