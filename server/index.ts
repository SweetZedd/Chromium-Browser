import express, { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { storage } from './storage';
import { ManifestHandler } from '../shared/manifest';

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

// Add new endpoint for extension manifests
router.get('/extensions/:id/manifest', async (req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void> => {
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

        // In a real implementation, this would fetch the actual manifest from the extension
        // For demo purposes, we'll create a sample manifest
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

        // Validate manifest using our handler
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