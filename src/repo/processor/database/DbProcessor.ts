import * as vscode from "vscode";

import { IProcessor } from "../IProcessor";
import {
  ConnectionType,
  IConfig,
  IConnectionConfig,
  ITableData,
  TableDetails,
} from "../../../view/app/model";
import { IOEParams } from "../../../db/Oe";
import { ClientFactory } from "../../client/ClientFactory";
import { Logger } from "../../../common/Logger";
import { Constants } from "../../../common/Constants";

export class DbProcessor implements IProcessor {
  private static instance: DbProcessor | undefined = undefined; // singleton
  private processStartTime: number | undefined = undefined; // undefined means process is not running
  private processTimeout: number = 5000; // 5 seconds
  private errObj = { errMessage: "", isError: false };

  private readonly configuration = vscode.workspace.getConfiguration(
    Constants.globalExtensionKey
  );
  private logger = new Logger(this.configuration.get("logging.node")!);

  private constructor() {}

  public static getInstance(): DbProcessor {
    if (DbProcessor.instance === undefined) {
      DbProcessor.instance = new DbProcessor();
    }

    return DbProcessor.instance;
  }

  public async testConnection(config: IConnectionConfig): Promise<any> {
    if (config.type === ConnectionType.Local) {
      return this.getDBVersion(config);
    }

    let params: IOEParams = {
      connectionString: (
        await ClientFactory.getClientHelperInstance(config)
      ).formConnectionString(config),
      command: "get_version",
    };

    return this.execRequest(config, params);
  }

  public async getDBVersion(config: IConnectionConfig): Promise<any> {
    let params: IOEParams = {
      connectionString: (
        await ClientFactory.getClientHelperInstance(config)
      ).formConnectionString(config),
      command: "get_version",
    };

    return this.execRequest(config, params);
  }

  public async getTablesList(config: IConfig): Promise<any> {
    let params: IOEParams = {
      connectionString: (
        await ClientFactory.getClientHelperInstance(config)
      ).formConnectionString(config),
      command: "get_tables",
    };
    return this.execRequest(config, params);
  }

  public async getTableData(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any> {
    if (config && tableName && inputParams) {
      let params: IOEParams = {
        connectionString: (
          await ClientFactory.getClientHelperInstance(config)
        ).formConnectionString(config),
        command: "get_table_data",
        params: { tableName: tableName, ...inputParams },
      };
      return this.execRequest(config, params);
    } else {
      return Promise.resolve({ columns: [], data: [] });
    }
  }

  public async submitTableData(
    config: IConfig,
    tableName: string | undefined,
    inputParams: ITableData | undefined
  ): Promise<any> {
    if (config && tableName && inputParams) {
      let params: IOEParams = {
        connectionString: (
          await ClientFactory.getClientHelperInstance(config)
        ).formConnectionString(config),
        command: "submit_table_data",
        params: { tableName: tableName, ...inputParams },
      };
      return this.execRequest(config, params);
    } else {
      return Promise.resolve({ columns: [], data: [] });
    }
  }

  public async getTableDetails(
    config: IConfig,
    tableName: string | undefined
  ): Promise<TableDetails> {
    if (config && tableName) {
      let params: IOEParams = {
        connectionString: (
          await ClientFactory.getClientHelperInstance(config)
        ).formConnectionString(config),
        command: "get_table_details",
        params: tableName,
      };
      return this.execRequest(config, params);
    } else {
      return Promise.resolve({ fields: [], indexes: [] });
    }
  }

  private async execRequest(
    config: IConnectionConfig,
    params: IOEParams
  ): Promise<any> {
    const cmd = `${Buffer.from(JSON.stringify(params)).toString("base64")}`;

    if (
      // if process is running and not timed out
      this.processStartTime !== undefined &&
      this.processStartTime + this.processTimeout > Date.now()
    ) {
      // then return error
      vscode.window.showInformationMessage("Processor is busy");
      return Promise.resolve(new Error("Processor is busy"));
    }

    if (this.errObj.isError) {
      //
      vscode.window.showErrorMessage(this.errObj.errMessage);
      return Promise.resolve(new Error(this.errObj.errMessage));
    }

    this.processStartTime = Date.now();
    this.logger.log("execShell params", params);
    let timeInMs = Date.now();

    return ClientFactory.getInstance(config)
      .then((client) => {
        console.log("CMD: ", cmd);
        console.log("client: ", client);
        return client.sendRequest(cmd);
      })
      .then((data) => {
        console.log("data: ", data);
        let json = JSON.parse(data);
        console.log(
          `Process time: ${Date.now() - timeInMs}, OE time: ${
            json.debug.time
          }, Connect time: ${json.debug.timeConnect}`
        );
        console.log(json.debug);
        this.logger.log("getOEClient returns", json);
        this.processStartTime = undefined;
        return json;
      })
      .catch((err) => {
        this.logger.log("getOeClient error", err.message);
        vscode.window.showWarningMessage(err.message);
        this.errObj.isError = true;
        this.errObj.errMessage = err.message;
        this.processStartTime = undefined;
        return Promise.resolve(new Error(err.message));
      })
      .finally(() => {
        this.logger.log("getOeClient finally");
        this.processStartTime = undefined;
      });
  }
}
