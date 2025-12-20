import app, { initializeServices } from './src/app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env (safe for both local & Vercel)
// Note: config/index.js also loads .env, which runs first due to import order
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3001;

// Initialize services only once
let servicesInitialized = false;

const initOnce = async () => {
    if (!servicesInitialized) {
        console.log('🚀 Initializing Central Backend Services...');
        await initializeServices();
        servicesInitialized = true;
        console.log('✅ Services initialized');
    }
};

/* ========================================================
     LOCAL DEVELOPMENT
======================================================== */
if (process.env.VERCEL !== '1') {
    (async () => {
        try {
            await initOnce();

            app.listen(PORT, () => {
                console.log('='.repeat(50));
                console.log('🚀 Central Backend Server Started (Local)');
                console.log(`🌐 http://localhost:${PORT}`);
                console.log('='.repeat(50));
            });
        } catch (err) {
            console.error('❌ Server start failed:', err);
            process.exit(1);
        }
    })();
}

/* ========================================================
     VERCEL SERVERLESS EXPORT
======================================================== */
export default async function handler(req, res) {
    try {
        // CRITICAL: Set CORS headers BEFORE any processing for Vercel serverless
        // This ensures headers are set even if app middleware doesn't run properly
        const origin = req.headers.origin;
        const allowedOrigins = [
            'https://ai-native-book-tf39.vercel.app',
            'https://Ai-Native-Book.vercel.app',
            'https://physical-ai-humanoid-robotics-book-eosin.vercel.app',
            'http://localhost:3000',
            'http://localhost:5001',
            'http://localhost:3001'
        ];

        // Check if origin matches (including wildcards)
        const isAllowed = origin && (
            allowedOrigins.includes(origin) ||
            /^https:\/\/ai-native-book-[^.]*\.vercel\.app$/.test(origin)
        );

        if (isAllowed) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie');
            res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
            res.setHeader('Access-Control-Max-Age', '86400');
        }

        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        await initOnce();
        return app(req, res);
    } catch (err) {
        console.error('❌ Serverless error:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    }
}
