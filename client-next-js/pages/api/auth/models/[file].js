import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
    const { file } = req.query; // Получаем имя файла из URL
    const filePath = path.join(process.cwd(), 'models', file); // Путь к файлу

    console.log("hello, epta");

    // Проверяем существование файла
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/json');
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
}
