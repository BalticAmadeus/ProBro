import { IProcessor } from "./IProcessor";
import { ProcessorType } from "./ProcessorType";
import { DbProcessor } from "./database/DbProcessor";
import { MockProcessor } from "./mock/MockProcessor";

export class ProcessorFactory {
  private static readonly processorType: ProcessorType = ProcessorType.Database;

  public static getProcessorInstance(): IProcessor {
    switch (ProcessorFactory.processorType) {
      case ProcessorType.Database:
        return DbProcessor.getInstance();
      case ProcessorType.Mock:
        return MockProcessor.getInstance();
      default:
        throw new Error("Invalid processor type");
    }
  }
}
