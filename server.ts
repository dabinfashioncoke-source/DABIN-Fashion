import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import {
  INITIAL_CATEGORIES,
  INITIAL_COMMERCIAL_DOCUMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_DESTINATIONS,
  INITIAL_FINANCE_TRANSACTIONS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
} from './src/constants/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  settings: typeof INITIAL_SETTINGS;
  products: typeof INITIAL_PRODUCTS;
  categories: typeof INITIAL_CATEGORIES;
  destinations: typeof INITIAL_DESTINATIONS;
  customers: typeof INITIAL_CUSTOMERS;
  suppliers: typeof INITIAL_SUPPLIERS;
  commercialDocuments: typeof INITIAL_COMMERCIAL_DOCUMENTS;
  financeTransactions: typeof INITIAL_FINANCE_TRANSACTIONS;
  sales: typeof INITIAL_SALES;
  users: typeof INITIAL_USERS;
  lastUpdated: string;
}

// Initial Database State
function getInitialDatabase(): DatabaseSchema {
  return {
    settings: INITIAL_SETTINGS,
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    destinations: INITIAL_DESTINATIONS,
    customers: INITIAL_CUSTOMERS,
    suppliers: INITIAL_SUPPLIERS,
    commercialDocuments: INITIAL_COMMERCIAL_DOCUMENTS,
    financeTransactions: INITIAL_FINANCE_TRANSACTIONS,
    sales: INITIAL_SALES,
    users: INITIAL_USERS,
    lastUpdated: new Date().toISOString(),
  };
}

// Load database from disk or initialize
function readDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...getInitialDatabase(),
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Failed reading database file, resetting to initial:', err);
  }

  const initial = getInitialDatabase();
  writeDatabase(initial);
  return initial;
}

// Server-Sent Events (SSE) clients for real-time live synchronization
const sseClients = new Set<Response>();

function broadcastChange(type: string, payload?: any) {
  const msg = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString(),
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${msg}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Write database to disk safely and broadcast live change to all connected clients
function writeDatabase(data: DatabaseSchema): void {
  try {
    data.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    broadcastChange('database_updated', { lastUpdated: data.lastUpdated });
  } catch (err) {
    console.error('Failed writing to database file:', err);
  }
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS & No-Cache Headers for API
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// API ROUTES FOR REAL MULTI-USER PERSISTENCE
// ==========================================

// 1. Health check & version
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/version', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json({ lastUpdated: db.lastUpdated || new Date().toISOString() });
});

// Real-time Server-Sent Events stream: triggers instant client update whenever admin saves
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 2. Full Database Snapshot (Used on initial page load by all visitors)
app.get('/api/database', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db);
});

// 3. Batch/Sync Update
app.post('/api/database', (req: Request, res: Response) => {
  const current = readDatabase();
  const updated: DatabaseSchema = {
    ...current,
    ...req.body,
    lastUpdated: new Date().toISOString(),
  };
  writeDatabase(updated);
  res.json({ success: true, lastUpdated: updated.lastUpdated });
});

// 4. Settings (CMS, Hero text, slogans, contact info, banking details)
app.get('/api/settings', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  const db = readDatabase();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  writeDatabase(db);
  res.json({ success: true, settings: db.settings });
});

// 5. Products (Catalog management)
app.get('/api/products', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const db = readDatabase();
  const productData = req.body;
  const now = new Date().toISOString();

  if (productData.id) {
    const idx = db.products.findIndex((p) => p.id === productData.id);
    if (idx !== -1) {
      db.products[idx] = {
        ...db.products[idx],
        ...productData,
        updatedAt: now,
      };
    } else {
      db.products.unshift({
        ...productData,
        createdAt: now,
        updatedAt: now,
      });
    }
  } else {
    const newId = `prod-${Date.now()}`;
    const newProduct = {
      ...productData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    db.products.unshift(newProduct);
  }

  writeDatabase(db);
  res.json({ success: true, products: db.products });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const { id } = req.params;
  db.products = db.products.filter((p) => p.id !== id);
  writeDatabase(db);
  res.json({ success: true, products: db.products });
});

// 6. Categories
app.get('/api/categories', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.categories);
});

app.post('/api/categories', (req: Request, res: Response) => {
  const db = readDatabase();
  const cat = req.body;
  const idx = db.categories.findIndex((c) => c.id === cat.id);
  if (idx !== -1) {
    db.categories[idx] = cat;
  } else {
    db.categories.push(cat);
  }
  writeDatabase(db);
  res.json({ success: true, categories: db.categories });
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const { id } = req.params;
  db.categories = db.categories.filter((c) => c.id !== id);
  writeDatabase(db);
  res.json({ success: true, categories: db.categories });
});

// 7. Delivery Destinations
app.get('/api/destinations', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.destinations);
});

app.post('/api/destinations', (req: Request, res: Response) => {
  const db = readDatabase();
  const dest = req.body;
  const idx = db.destinations.findIndex((d) => d.id === dest.id);
  if (idx !== -1) {
    db.destinations[idx] = dest;
  } else {
    db.destinations.push({
      ...dest,
      id: dest.id || `dest-${Date.now()}`,
    });
  }
  writeDatabase(db);
  res.json({ success: true, destinations: db.destinations });
});

app.delete('/api/destinations/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const { id } = req.params;
  db.destinations = db.destinations.filter((d) => d.id !== id);
  writeDatabase(db);
  res.json({ success: true, destinations: db.destinations });
});

// 8. Commercial Documents (Quotations, Invoices, Receipts)
app.get('/api/commercial-documents', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.commercialDocuments);
});

app.post('/api/commercial-documents', (req: Request, res: Response) => {
  const db = readDatabase();
  const doc = req.body;
  const now = new Date().toISOString();

  if (doc.id) {
    const idx = db.commercialDocuments.findIndex((d) => d.id === doc.id);
    if (idx !== -1) {
      db.commercialDocuments[idx] = {
        ...db.commercialDocuments[idx],
        ...doc,
        updatedAt: now,
      };
    } else {
      db.commercialDocuments.unshift({
        ...doc,
        createdAt: now,
        updatedAt: now,
      });
    }
  } else {
    const newDoc = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    db.commercialDocuments.unshift(newDoc);
  }

  writeDatabase(db);
  res.json({ success: true, commercialDocuments: db.commercialDocuments });
});

app.delete('/api/commercial-documents/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const { id } = req.params;
  db.commercialDocuments = db.commercialDocuments.filter((d) => d.id !== id);
  writeDatabase(db);
  res.json({ success: true, commercialDocuments: db.commercialDocuments });
});

// 9. Finance Transactions (Income & Expenses)
app.get('/api/finance-transactions', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.financeTransactions);
});

app.post('/api/finance-transactions', (req: Request, res: Response) => {
  const db = readDatabase();
  const tx = req.body;
  const now = new Date().toISOString();

  if (tx.id) {
    const idx = db.financeTransactions.findIndex((t) => t.id === tx.id);
    if (idx !== -1) {
      db.financeTransactions[idx] = {
        ...db.financeTransactions[idx],
        ...tx,
        updatedAt: now,
      };
    } else {
      db.financeTransactions.unshift({
        ...tx,
        createdAt: now,
        updatedAt: now,
      });
    }
  } else {
    const newTx = {
      ...tx,
      id: `tx-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    db.financeTransactions.unshift(newTx);
  }

  writeDatabase(db);
  res.json({ success: true, financeTransactions: db.financeTransactions });
});

app.delete('/api/finance-transactions/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const { id } = req.params;
  db.financeTransactions = db.financeTransactions.filter((t) => t.id !== id);
  writeDatabase(db);
  res.json({ success: true, financeTransactions: db.financeTransactions });
});

// 10. Sales (POS Orders)
app.get('/api/sales', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.sales);
});

app.post('/api/sales', (req: Request, res: Response) => {
  const db = readDatabase();
  const sale = req.body;
  const idx = db.sales.findIndex((s) => s.id === sale.id);
  if (idx !== -1) {
    db.sales[idx] = sale;
  } else {
    db.sales.unshift(sale);
  }

  // Deduct inventory quantities if passed
  if (Array.isArray(sale.items)) {
    for (const item of sale.items) {
      const pIdx = db.products.findIndex((p) => p.id === item.productId);
      if (pIdx !== -1) {
        db.products[pIdx].quantityOnHand = Math.max(
          0,
          db.products[pIdx].quantityOnHand - (item.quantity || 1)
        );
      }
    }
  }

  writeDatabase(db);
  res.json({ success: true, sales: db.sales });
});

// 11. CRM Customers
app.get('/api/customers', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.customers);
});

app.post('/api/customers', (req: Request, res: Response) => {
  const db = readDatabase();
  const cust = req.body;
  const idx = db.customers.findIndex((c) => c.id === cust.id);
  if (idx !== -1) {
    db.customers[idx] = cust;
  } else {
    db.customers.unshift({
      ...cust,
      id: cust.id || `cust-${Date.now()}`,
    });
  }
  writeDatabase(db);
  res.json({ success: true, customers: db.customers });
});

// 12. Suppliers
app.get('/api/suppliers', (_req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.suppliers || []);
});

app.post('/api/suppliers', (req: Request, res: Response) => {
  const db = readDatabase();
  const sup = req.body;
  if (!Array.isArray(db.suppliers)) db.suppliers = [];
  const idx = db.suppliers.findIndex((s) => s.id === sup.id);
  if (idx !== -1) {
    db.suppliers[idx] = { ...db.suppliers[idx], ...sup };
  } else {
    db.suppliers.push({ ...sup, id: sup.id || `sup-${Date.now()}` });
  }
  writeDatabase(db);
  res.json({ success: true, suppliers: db.suppliers });
});

app.delete('/api/suppliers/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const { id } = req.params;
  if (Array.isArray(db.suppliers)) {
    db.suppliers = db.suppliers.filter((s) => s.id !== id);
    writeDatabase(db);
  }
  res.json({ success: true, suppliers: db.suppliers });
});

// ==========================================
// STATIC ASSETS & VITE INTEGRATION
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DABIN Fashion Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
