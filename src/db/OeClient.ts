import * as Net from "net";
import * as cp from "child_process";
import { Constants } from "../common/Constants";
import * as vscode from "vscode";

class OEClient {
    private port: number;
    private host: string;
    private client!: Net.Socket;
    private data!: string;
    private dataFinish!: any;
    private procFinish!: any;
    private pclientFinish!: any;
    private proc!: cp.ChildProcessWithoutNullStreams;
    private enc = new TextDecoder("utf-8");
    private readonly configuration = vscode.workspace.getConfiguration("ProBro");

  constructor(port: number, host: string) {
     this.port = port;
     this.host = host;
  }

  public init(): Promise<any> {
    return this.runProc().then((resolve) => {
      this.client = new Net.Socket();
      this.client.connect(this.port, this.host, () => {
        console.log("TCP connection established with the server at " + this.port.toString() + ".");
      });
      // The client can also receive data from the server by reading from its socket.
      this.client.on("data", (chunk) => {
        console.log(`Data received from the server`);
        this.data += chunk.toString();
        if (this.data.endsWith(`\n`)) {
          this.dataFinish(this.data);
        }
      });

      this.client.on("end", () => {
        console.log("Requested an end to the TCP connection");
      });

      return this;
    });
  }

  private runProc(): Promise<any> {
    return new Promise((resolve) => {
            const logentrytypes: string = this.configuration.get("logging.openEdge")!;
            const tempFilesPath: string = this.configuration.get("tempfiles")!;
            const tempFileParameter: string = tempFilesPath === "" ? "" : '-T ' + tempFilesPath;
            const cmd = `${Constants.context.extensionPath}/resources/oe/scripts/oe.bat -b -debugalert -p "${Constants.context.extensionPath}/resources/oe/src/oeSocket.p" -param "${Buffer.from('PARAM').toString('base64')}" `;

            if (process.platform === 'linux') {
                this.proc = cp.spawn('bash', ['-c',
                    [`"${Constants.context.extensionPath}/resources/oe/scripts/oe.sh"`,
                        tempFileParameter,
                        '-b',
                        '-p',
                    `"${Constants.context.extensionPath}/resources/oe/src/oeSocket.p"`,
                    "-param " + this.port.toString(),
                        '-debugalert',
                        '-clientlog',
                    `"${Constants.context.extensionPath}/resources/oe/oeSocket.pro"`,
                    logentrytypes.length !== 0 ? `-logentrytypes ${logentrytypes}` : ""
                    ].join(' ')]);
            } else if (process.platform === 'win32') {
                this.proc = cp.spawn('cmd.exe', ['/c',
                    [`${Constants.context.extensionPath}/resources/oe/scripts/oe.bat`,
                    tempFileParameter,
                    '-b',
                    '-p',
                    `${Constants.context.extensionPath}/resources/oe/src/oeSocket.p`,
                    "-param " + this.port.toString(),
                    '-debugalert',
                    '-clientlog',
                    `${Constants.context.extensionPath}/resources/oe/oeSocket.pro`,
                    logentrytypes.length !== 0 ? `-logentrytypes ${logentrytypes}` : ""
                    
                    ].join(" ")]);
            } else {
                // should be error here
            }

      this.proc.on("exit", (code, signal) => {
        console.log(
          "child process exited with " + `code ${code} and signal ${signal}`
        );
      });

      this.proc.on("error", (error) =>
        console.log("child process error: \n", error)
      );

      this.proc.stdout.on("data", (data) => {
        console.log(`child stdout:\n${data}`);
        const dataString = this.enc.decode(data);
        if (dataString.startsWith("SERVER STARTED AT " + this.port.toString())) {
          this.procFinish(dataString);
        }
      });

      this.proc.stderr.on("data", (data) => {
        console.error(`child stderr:\n${data}`);
      });

      this.procFinish = resolve;
    });
  }

  public sendCommand(cmd: string): Promise<string> {
    this.data = "";
    return new Promise((resolve) => {
      this.client.write(`${cmd}\n`);
      this.dataFinish = resolve;
    });
  }
}

let client: OEClient;

async function getOEClient(): Promise<any> {
  let port: number;
  let host: string = "localhost";
  if (!client) {
    await vscode.commands.executeCommand(
      `${Constants.globalExtensionKey}.releasePort`
    );
    await vscode.commands
      .executeCommand(`${Constants.globalExtensionKey}.getPort`)
      .then((portVal: any) => {
        console.log("getOEclient:", portVal);
        port = portVal;
      });

    client = new OEClient(port!, host);
    return client.init();
  }
  return new Promise((resolve) => {
    resolve(client);
  });
}

export default getOEClient;
