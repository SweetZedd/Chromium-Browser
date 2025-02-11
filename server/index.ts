import express, { Request, Response, Router } from 'express';
import { join } from 'path';
import { storage } from './storage';

const app = express();
const router = Router();
const port = parseInt(process.env.PORT || '3000', 10);

// Serve static files
app.use(express.static(join(__dirname, '..')));

// API endpoints
router.get('/extensions', async (_req: Request, res: Response) => {
    try {
        const extensions = await storage.getExtensions();
        res.json(extensions);
    } catch (error) {
        console.error('Error fetching extensions:', error);
        res.status(500).json({ error: 'Failed to fetch extensions' });
    }
});

router.get('/categories', async (_req: Request, res: Response) => {
    try {
        const categories = await storage.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

interface CategoryParams {
    categoryId: string;
}

router.get('/categories/:categoryId/extensions', async (req: Request<CategoryParams>, res: Response) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        if (isNaN(categoryId)) {
            return res.status(400).json({ error: 'Invalid category ID' });
        }
        const extensions = await storage.getExtensionsByCategory(categoryId);
        res.json(extensions);
    } catch (error) {
        console.error('Error fetching extensions by category:', error);
        res.status(500).json({ error: 'Failed to fetch extensions by category' });
    }
});

interface SearchQuery {
    q?: string;
}

router.get('/extensions/search', async (req: Request<{}, any, any, SearchQuery>, res: Response) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const extensions = await storage.searchExtensions(query);
        res.json(extensions);
    } catch (error) {
        console.error('Error searching extensions:', error);
        res.status(500).json({ error: 'Failed to search extensions' });
    }
});

// Mount the router with a prefix
app.use('/api', router);

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});