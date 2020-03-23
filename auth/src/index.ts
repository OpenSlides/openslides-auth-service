import * as http from 'http';

let reqCnt: number = 1;
const PORT: number = parseInt(process.env.PORT || '', 10) || 8000;

http.createServer((req, res) => {
    const message = `Request Count: ${reqCnt}`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><head><meta http-equiv="refresh" content="2"></head><body>${message}</body></html>`);

    console.log('handled request: ' + reqCnt++);
}).listen(PORT);

console.log('Hello World');
console.log('Hello World from docker');
console.log(`Server is running on port ${PORT}`);
