import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

function ensureCtParam(params) {
  const normalized = (params || '').trim();
  if (normalized.length === 0) {
    return '-ct 1';
  }
  if (normalized.includes('-ct')) {
    return normalized;
  }
  return `${normalized} -ct 1`;
}

export function buildConnectionString(connection) {
  const withCt = ensureCtParam(connection.params);
  return `-db ${connection.database} ${connection.user ? `-U ${connection.user}` : ''} ${connection.password ? `-P ${connection.password}` : ''} ${connection.dbHost ? `-H ${connection.dbHost}` : ''} ${connection.dbPort ? `-S ${connection.dbPort}` : ''} ${withCt}`;
}

function normalizeResponse(raw) {
  const text = raw.trim();
  return JSON.parse(text);
}

function writePfFile(pfPath, tempFilesPath, logEntryTypes, socketPort) {
  const content = [
    tempFilesPath ? `-T ${tempFilesPath}` : null,
    '-b',
    '-param',
    `${socketPort}`,
    '-debugalert',
    logEntryTypes ? `-logentrytypes ${logEntryTypes}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  fs.writeFileSync(pfPath, content, 'utf8');
}

function waitForServerReady(proc, socketPort, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for OpenEdge process on port ${socketPort}`));
    }, timeoutMs);

    const onStdout = (chunk) => {
      const text = String(chunk);
      if (text.includes(`SERVER STARTED AT ${socketPort}`)) {
        clearTimeout(timeout);
        proc.stdout.off('data', onStdout);
        resolve();
      }
      if (text.includes('Failed to initialize client:')) {
        clearTimeout(timeout);
        proc.stdout.off('data', onStdout);
        reject(new Error(text.trim()));
      }
    };

    proc.stdout.on('data', onStdout);
    proc.on('error', (err) => {
      clearTimeout(timeout);
      proc.stdout.off('data', onStdout);
      reject(err);
    });
    proc.on('exit', (code) => {
      clearTimeout(timeout);
      proc.stdout.off('data', onStdout);
      reject(new Error(`OpenEdge process exited early with code ${code}`));
    });
  });
}

function connectSocket(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.setTimeout(0);
      resolve(socket);
    });
    socket.once('error', (err) => reject(err));
    socket.once('timeout', () => reject(new Error(`Socket timeout to ${host}:${port}`)));

    socket.connect(port, host);
  });
}

export class ProBroBridge {
  constructor(options) {
    this.options = options;
    this.socket = null;
    this.proc = null;
    this.queue = Promise.resolve();
  }

  async init() {
    if (this.options.mode === 'local') {
      await this.startLocalRuntime();
    }
    this.socket = await connectSocket(this.options.agentHost, this.options.agentPort, this.options.socketTimeoutMs);
  }

  async startLocalRuntime() {
    if (process.platform !== 'win32') {
      throw new Error('Local runtime mode currently supports Windows only in this scaffold. Use remote mode on other platforms.');
    }

    const pfPath = path.join(os.tmpdir(), `probro-connection-${this.options.agentPort}.pf`);
    writePfFile(pfPath, this.options.tempFilesPath, this.options.logEntryTypes, this.options.agentPort);

    const scriptsDir = path.join(this.options.projectRoot, 'resources', 'oe', 'scripts');
    const oeBat = path.join(scriptsDir, 'oe.bat');
    const oeSocketProgram = path.join(this.options.projectRoot, 'resources', 'oe', 'src', 'oeSocket.p');
    const oeSocketLog = path.join(this.options.projectRoot, 'resources', 'oe', 'oeSocket.pro');

    const oeArgs = [
      oeBat,
      '-p',
      oeSocketProgram,
      '-clientlog',
      oeSocketLog,
      '-pf',
      pfPath,
      this.options.dlc,
    ];

    this.proc = spawn('cmd.exe', ['/c', ...oeArgs], {
      cwd: path.join(this.options.projectRoot, 'resources', 'oe'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    await waitForServerReady(this.proc, this.options.agentPort, this.options.startupTimeoutMs);
  }

  async execute(requestPayload) {
    const encoded = Buffer.from(JSON.stringify(requestPayload), 'utf8').toString('base64');
    return this.sendEncoded(encoded);
  }

  async sendEncoded(encoded) {
    if (!this.socket) {
      throw new Error('Bridge not initialized');
    }

    const run = () =>
      new Promise((resolve, reject) => {
        let data = '';

        const onData = (chunk) => {
          data += chunk.toString();
          if (data.endsWith('\n')) {
            cleanup();
            try {
              resolve(normalizeResponse(data));
            } catch (error) {
              reject(error);
            }
          }
        };

        const onError = (err) => {
          cleanup();
          reject(err);
        };

        const cleanup = () => {
          this.socket.off('data', onData);
          this.socket.off('error', onError);
        };

        this.socket.on('data', onData);
        this.socket.on('error', onError);
        this.socket.write(`${encoded}\n`);
      });

    this.queue = this.queue.then(run, run);
    return this.queue;
  }

  async close() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
  }
}
