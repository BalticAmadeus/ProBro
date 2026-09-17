import { TelemetryReporter } from '@vscode/extension-telemetry';
import * as vscode from 'vscode';

export class Telemetry {
    private static instance: TelemetryReporter;
    private static readonly TELEMETRY_KEY = '__TELEMETRY_KEY__';

    private static getInstance(): TelemetryReporter {
        if (!Telemetry.instance) {
            Telemetry.instance = new TelemetryReporter(this.TELEMETRY_KEY);
        }
        return Telemetry.instance;
    }

    public static getTimeStamp(): number {
        return Date.now();
    }

    private static isTelemetryEnabled(): boolean {
        const isFormatterTelemetryOn = vscode.workspace
            .getConfiguration('Telemetry')
            .get('probroTelemetry') as boolean;
        const isGlobalTelemetryOn = vscode.env.isTelemetryEnabled;
        const isKeyInjected = this.TELEMETRY_KEY.startsWith(
            'InstrumentationKey=',
        );

        return isKeyInjected && isFormatterTelemetryOn && isGlobalTelemetryOn;
    }

    public static sendActionTelemetry(
        actionName: string,
        properties: Record<string, string> = {},
        measurements: Record<string, number> = {},
    ) {
        const instance = this.getInstance();
        if (!this.isTelemetryEnabled() || !instance) return;
        instance.sendTelemetryEvent(actionName, properties, measurements);
    }
}
