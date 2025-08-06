import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';

dotenv.config();

console.log("Server Key from .env:", process.env.MIDTRANS_SERVER_KEY);
console.log("Client Key from .env:", process.env.MIDTRANS_CLIENT_KEY);

const snap = new midtransClient.Snap({
    isProduction: false, // Ganti dengan true jika menggunakan Production keys
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export default snap;