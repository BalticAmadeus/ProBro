import { IProcessor } from "./IProcessor";
import { ProcessorType } from "./ProcessorType";
import { DBProcessor } from "./database/DBProcessor";
import { MockProcessor } from "./mock/MockProcessor";

export class ProcessorFactory {
  private static readonly processorType: ProcessorType = ProcessorType.database;

  public static getProcessorInstance(): IProcessor {
    switch (ProcessorFactory.processorType) {
      case ProcessorType.database:
        return DBProcessor.getInstance();
      case ProcessorType.mock:
        return MockProcessor.getInstance();
      default:
        throw new Error("Invalid processor type");
    }
  }
}
