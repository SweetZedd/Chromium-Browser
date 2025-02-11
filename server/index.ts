import express, { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { storage } from './storage';

const app = express();
const router = express.Router();
const port = parseInt(process.env.PORT || '3000', 10);

// Serve static files
app.use(express.static(join(__dirname, '..')));

// Error handler middleware
const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
};

// API endpoints
router.get('/extensions', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const extensions = await storage.getExtensions();
        res.json(extensions);
    } catch (error) {
        next(error);
    }
});

router.get('/categories', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categories = await storage.getCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
});

interface CategoryParams {
    categoryId: string;
}

router.get('/categories/:categoryId/extensions', async (req: Request<CategoryParams>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        if (isNaN(categoryId)) {
            res.status(400).json({ error: 'Invalid category ID' });
            return;
        }
        const extensions = await storage.getExtensionsByCategory(categoryId);
        res.json(extensions);
    } catch (error) {
        next(error);
    }
});

interface SearchQuery {
    q?: string;
}

router.get('/extensions/search', async (req: Request<{}, any, any, SearchQuery>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        const extensions = await storage.searchExtensions(query);
        res.json(extensions);
    } catch (error) {
        next(error);
    }
});

// Mount the router with a prefix
app.use('/api', router);

// Error handling middleware should be last
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});