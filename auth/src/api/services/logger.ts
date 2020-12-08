import { Config } from '../../config';

export enum LogColor {
    Reset = '\x1b[0m',
    Bright = '\x1b[1m',
    Dim = '\x1b[2m',
    Underscore = '\x1b[4m',
    Blink = '\x1b[5m',
    Reverse = '\x1b[7m',
    Hidden = '\x1b[8m',

    FgBlack = '\x1b[30m',
    FgRed = '\x1b[31m',
    FgGreen = '\x1b[32m',
    FgYellow = '\x1b[33m',
    FgBlue = '\x1b[34m',
    FgMagenta = '\x1b[35m',
    FgCyan = '\x1b[36m',
    FgGray = '\x1b[37m',
    FgWhite = '\x1b[97m',

    BgBlack = '\x1b[40m',
    BgRed = '\x1b[41m',
    BgGreen = '\x1b[42m',
    BgYellow = '\x1b[43m',
    BgBlue = '\x1b[44m',
    BgMagenta = '\x1b[45m',
    BgCyan = '\x1b[46m',
    BgWhite = '\x1b[47m'
}

export class Logger {
    private static getTimeString(): string {
        const date = new Date();
        return (
            `[${this.formatDateTimeString(date.getDate())}.` + //
            `${this.formatDateTimeString(date.getMonth() + 1)}.` + //
            `${date.getFullYear()} -- ` + //
            `${this.formatDateTimeString(date.getHours())}:` + //
            `${this.formatDateTimeString(date.getMinutes())}:` + //
            `${this.formatDateTimeString(date.getSeconds())}]`
        );
    }

    private static formatDateTimeString(toFormat: string | number): string {
        return `0${toFormat}`.slice(-2);
    }

    private static info(color: string, ...message: any[]): void {
        console.log(`${color}${this.getTimeString()}:`, ...message, '\x1b[0m');
    }

    public static log(...message: any): void {
        this.info(LogColor.FgWhite, ...message);
    }

    public static debug(...message: any): void {
        if (Config.isDevMode()) {
            this.info(LogColor.FgGreen, ...message);
        }
    }

    public static error(...message: any): void {
        if (Config.isDevMode()) {
            this.info(`${LogColor.FgRed} ${LogColor.Bright}`, ...message);
        }
    }
}
