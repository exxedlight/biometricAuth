import https from 'https';
import { createServer } from 'http';
import next from 'next';
import fs from 'fs';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'certificates', 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'certificates', 'localhost.pem')),
};

app.prepare().then(() => {
    https.createServer(httpsOptions, (req, res) => {
        handle(req, res);
    }).listen(3000, (err) => {
        if (err) throw err;
        console.log('> Ready on https://localhost:3000');
    });
});
