// pages/api/auth/register/challenge.js
import https from 'https';
import { backend_path } from '../../../../net-pathes.mjs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        console.log("next api");
        const agent = new https.Agent({ rejectUnauthorized: false });

        const response = await fetch(backend_path + '/Auth/register/challenge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
            credentials: 'include',
            agent,
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
