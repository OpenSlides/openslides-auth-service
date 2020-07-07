export class Logger {
    protected static getTimeString(): string {
        const date = new Date();
        return `[${date.getDate()} -- ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`;
    }

    public static log(message: any): void {
        console.log(`${this.getTimeString()}:`, message);
    }
}
