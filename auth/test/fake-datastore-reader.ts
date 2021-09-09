import http from 'http';

export class FakeDatastoreReader {
    private httpServer: http.Server | null = null;

    private statusCode = 404;

    public constructor() {
        this.httpServer = http
            .createServer((req, res) => {
                res.writeHead(this.statusCode);
                res.write('Not found');
                res.end();
            })
            .listen(9011);
    }
}
