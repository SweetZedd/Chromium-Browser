import express, { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { storage } from './storage';
import { ManifestHandler } from '../shared/manifest';

const app = express();
const router = express.Router();
const port = parseInt(process.env.PORT || '3000', 10);

// Serve static files with cache headers
app.use(express.static(join(__dirname, '..'), {
    maxAge: '1h',
    etag: true,
    lastModified: true
}));

// Error handler middleware
const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
};

// Cache middleware
const cacheMiddleware = (duration: number) => {
    return (_req: Request, res: Response, next: NextFunction) => {
        res.setHeader('Cache-Control', `public, max-age=${duration}`);
        next();
    };
};

// API endpoints with pagination support
interface PaginationQuery {
    page?: string;
    limit?: string;
}

router.get('/extensions', async (req: Request<{}, any, any, PaginationQuery>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page || '0', 10);
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50); // Max 50 items per page

        const extensions = await storage.getExtensionsWithPagination(page, limit);
        res.json(extensions);
    } catch (error) {
        next(error);
    }
});

router.get('/categories', cacheMiddleware(3600), async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
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

router.get('/categories/:categoryId/extensions', async (req: Request<CategoryParams, any, any, PaginationQuery>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const page = parseInt(req.query.page || '0', 10);
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);

        if (isNaN(categoryId)) {
            res.status(400).json({ error: 'Invalid category ID' });
            return;
        }

        const extensions = await storage.getExtensionsByCategoryWithPagination(categoryId, page, limit);
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

// Manifest endpoint with caching
router.get('/extensions/:id/manifest', cacheMiddleware(3600), async (req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const extensionId = parseInt(req.params.id);
        if (isNaN(extensionId)) {
            res.status(400).json({ error: 'Invalid extension ID' });
            return;
        }

        const extension = await storage.getExtensionById(extensionId);
        if (!extension) {
            res.status(404).json({ error: 'Extension not found' });
            return;
        }

        const sampleManifest = {
            manifest_version: 8,
            name: extension.name,
            version: "1.0",
            description: extension.description,
            action: {
                default_popup: "popup.html",
                default_title: extension.name
            },
            permissions: ["storage"],
            host_permissions: [],
            background: {
                service_worker: "background.js",
                type: "module"
            }
        };

        const validatedManifest = await ManifestHandler.parseManifest(sampleManifest);
        const securitySummary = ManifestHandler.getSecuritySummary(validatedManifest);

        res.json({
            ...validatedManifest,
            ...securitySummary
        });
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