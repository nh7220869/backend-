import express, { json } from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(json());

app.get('/get-session', (req, res) => {
  res.json({ success: true, message: 'CORS fixed!' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});