import { DatabaseProcessor } from "../../db/DatabaseProcessor";
import { ProcessorType } from "./ProcessorType";
import { MockProcessor } from "./mock/MockProcessor";

export class ProcessorFactory {
  static getInstance(processorType: ProcessorType) {
    switch (processorType) {
      case ProcessorType.database:
        return DatabaseProcessor.getInstance();
      case ProcessorType.mock:
        return MockProcessor.getInstance();
      default:
        throw new Error("Invalid processor type");
    }
  }
}
