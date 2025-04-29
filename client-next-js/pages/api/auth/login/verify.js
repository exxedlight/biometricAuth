import https from 'https';
import { backend_path } from '../../../../net-pathes.mjs';
import { debuglog } from 'util';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Отключаем проверку сертификата для разработческой среды

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const agent = new https.Agent({ rejectUnauthorized: false }); // Создаем агента для запросов

        try {
            if (!req.headers.authorization)
                throw new Error("No Authorization request header!");

            // Отправляем данные на сервер ASP.NET для верификации
            const response = await fetch(`${backend_path}/Auth/signin/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers.authorization
                },
                body: JSON.stringify(req.body),
                credentials: 'include',
                agent,
            });

            const data = await response.json();
            res.status(response.status).json(data);
        } catch (error) {
            console.error('Error during verification:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
