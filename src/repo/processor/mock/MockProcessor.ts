import { IProcessor } from "../IProcessor";

export class MockProcessor implements IProcessor {
  private static instance: MockProcessor | undefined = undefined; // singleton

  private constructor() {}

  public static getInstance(): MockProcessor {
    if (MockProcessor.instance === undefined) {
      MockProcessor.instance = new MockProcessor();
    }

    return MockProcessor.instance;
  }

  getDBVersion(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve("Mock DB Version");
    });
  }

  getTablesList(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve("Mock Tables List");
    });
  }

  getTableData(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve("Mock Table Data");
    });
  }

  submitTableData(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve("Mock Submit Table Data");
    });
  }

  getTableDetails(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve("Mock Table Details");
    });
  }
}
