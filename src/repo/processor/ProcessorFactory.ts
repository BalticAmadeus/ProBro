import { IProcessor } from "./IProcessor";
import { ProcessorType } from "./ProcessorType";
import { DbProcessor } from "./database/DbProcessor";
import { MockProcessor } from "./mock/MockProcessor";
import { DatabaseProcessor } from "../../db/DatabaseProcessor";
import * as vscode from "vscode";

export class ProcessorFactory {
  private static readonly processorType: ProcessorType = ProcessorType.Database;

  public static getProcessorInstance(): IProcessor {
    switch (ProcessorFactory.determineProcessorType()) {
      case ProcessorType.Database:
        return DbProcessor.getInstance();
      case ProcessorType.Mock:
        return MockProcessor.getInstance();
      case ProcessorType.Old:
        return DatabaseProcessor.getInstance();
      default:
        throw new Error("Invalid processor type");
    }
  }

  private static determineProcessorType(): ProcessorType {
    // TODO: delete after old processor is removed
    const configuration = vscode.workspace.getConfiguration("ProBro");
    const useNew: boolean = configuration.get("development.useNewDbClient")!;

    console.log("useNew: " + useNew);
    if (useNew === true) {
      return ProcessorType.Database;
    } else {
      return ProcessorType.Old;
    }
  }
}
