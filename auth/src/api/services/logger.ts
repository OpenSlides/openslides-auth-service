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

    public static log(...message: any): void {
        console.log(`${this.getTimeString()}:`, message);
    }
}
