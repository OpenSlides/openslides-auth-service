import { Config } from '../../config';

export enum LogColor {
    RESET = '\x1b[0m',
    BRIGHT = '\x1b[1m',
    DIM = '\x1b[2m',
    UNDERSCORE = '\x1b[4m',
    BLINK = '\x1b[5m',
    REVERSE = '\x1b[7m',
    HIDDEN = '\x1b[8m',

    FG_BLACK = '\x1b[30m',
    FG_RED = '\x1b[31m',
    FG_GREEN = '\x1b[32m',
    FG_YELLOW = '\x1b[33m',
    FG_BLUE = '\x1b[34m',
    FG_MAGENTA = '\x1b[35m',
    FG_CYAN = '\x1b[36m',
    FG_GRAY = '\x1b[37m',
    FG_WHITE = '\x1b[97m',

    BG_BLACK = '\x1b[40m',
    BG_RED = '\x1b[41m',
    BG_GREEN = '\x1b[42m',
    BG_YELLOW = '\x1b[43m',
    BG_BLUE = '\x1b[44m',
    BG_MAGENTA = '\x1b[45m',
    BG_CYAN = '\x1b[46m',
    BG_WHITE = '\x1b[47m'
}

export class Logger {
    public static log(...message: unknown[]): void {
        this.info(LogColor.FG_WHITE, ...message);
    }

    public static debug(...message: unknown[]): void {
        if (Config.isDevMode()) {
            this.info(LogColor.FG_GREEN, ...message);
        }
    }

    public static error(...message: unknown[]): void {
        if (Config.isDevMode()) {
            this.info(`${LogColor.FG_RED} ${LogColor.BRIGHT}`, ...message);
        }
    }

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
}
