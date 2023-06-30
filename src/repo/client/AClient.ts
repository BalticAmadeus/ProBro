import * as Net from "net";
import * as cp from "child_process";
import path = require("path");
import { Constants } from "../../common/Constants";

export class AClient {
  private port: number;
  private host: string;
  private data!: string;
  private client!: Net.Socket;
  private proc!: cp.ChildProcessWithoutNullStreams;

  private dataFinish!: any;
  private procFinish!: any;
  private enc = new TextDecoder("utf-8");

  private pfFilePath: string = path.join(
    Constants.context.extensionPath,
    "resources",
    "oe",
    "connectionPf.pf"
  );

  private readonly linuxConnectionString = [
    "-c",
    [
      `"${path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "scripts",
        "oe.sh"
      )}"`,
      "-p",
      `"${path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "src",
        "oeSocket.p"
      )}"`,
      "-clientlog",
      `"${path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "oeSocket.pro"
      )}"`,
      "-pf",
      `"${this.pfFilePath}"`,
    ].join(" "),
  ];

  private readonly windowsConnectionString = [
    "/c",
    [
      path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "scripts",
        "oe.bat"
      ),
      "-p",
      path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "src",
        "oeSocket.p"
      ),
      "-clientlog",
      path.join(
        Constants.context.extensionPath,
        "resources",
        "oe",
        "oeSocket.pro"
      ),
      "-pf",
      this.pfFilePath,
    ].join(" "),
  ];

  protected constructor(port: number, host: string) {
    this.port = port;
    this.host = host;
  }

  protected runProc(): Promise<any> {
    return new Promise((resolve, reject) => {
      switch (process.platform) {
        case "linux":
          this.proc = cp.spawn("bash", this.linuxConnectionString);
          break;
        case "win32":
          this.proc = cp.spawn("cmd.exe", this.windowsConnectionString);
          break;
        default:
          reject("Unsupported platform");
      }

      this.proc.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);

        const dataString = this.enc.decode(data);
        if (
          dataString.startsWith("SERVER STARTED AT " + this.port.toString())
        ) {
          this.procFinish(dataString);
        }
      });

      this.proc.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
      });

      this.proc.on("exit", (code) => {
        console.log(`child process exited with code ${code}`);
      });

      this.proc.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
      });

      this.proc.on("error", (err) => {
        console.log(`child process error ${err}`);
      });

      this.procFinish = resolve;
    });
  }

  public sendCommand(cmd: string): Promise<string> {
    this.data = "";

    return new Promise((resolve, reject) => {
      this.client.write(`${cmd}\n`);
      this.dataFinish = resolve;
    });
  }
}
