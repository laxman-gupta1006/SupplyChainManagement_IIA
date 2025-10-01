const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'laxmangupta', // Your macOS username
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'supply_chain_management',
    password: process.env.DB_PASSWORD || '', // Usually no password for local PostgreSQL
    port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL database:', err.message);
    } else {
        console.log('Connected to PostgreSQL database');
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes

// Home page - serves the single page application
app.get('/', (req, res) => {
    res.render('index');
});

// API Routes

// Get all products with logistics data
app.get('/api/products', (req, res) => {
    const query = `
        SELECT 
            p.sku,
            p.product_type,
            p.price,
            p.number_of_products_sold,
            p.revenue_generated,
            l.supplier_name,
            l.location,
            l.lead_time,
            l.production_volumes,
            l.manufacturing_costs,
            l.shipping_carriers,
            l.transportation_modes,
            l.costs as logistics_costs,
            (p.revenue_generated - l.manufacturing_costs - l.costs) as profit_margin
        FROM products_sales p
        LEFT JOIN supply_chain_logistics l ON p.sku = l.sku
        ORDER BY p.sku
    `;
    
    pool.query(query, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(result.rows);
    });
});

// Get single product by SKU
app.get('/api/products/:sku', (req, res) => {
    const sku = req.params.sku;
    const query = `
        SELECT 
            p.sku,
            p.product_type,
            p.price,
            p.number_of_products_sold,
            p.revenue_generated,
            l.supplier_name,
            l.location,
            l.lead_time,
            l.production_volumes,
            l.manufacturing_costs,
            l.shipping_carriers,
            l.transportation_modes,
            l.costs as logistics_costs
        FROM products_sales p
        LEFT JOIN supply_chain_logistics l ON p.sku = l.sku
        WHERE p.sku = ?
    `;
    
    db.get(query, [sku], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(row);
    });
});

// Update product data
app.put('/api/products/:sku', (req, res) => {
    const sku = req.params.sku;
    const {
        product_type,
        price,
        number_of_products_sold,
        revenue_generated,
        supplier_name,
        location,
        lead_time,
        production_volumes,
        manufacturing_costs,
        shipping_carriers,
        transportation_modes,
        logistics_costs
    } = req.body;

    // Start transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Update products_sales table
        const updateProductQuery = `
            UPDATE products_sales 
            SET product_type = ?, 
                price = ?, 
                number_of_products_sold = ?, 
                revenue_generated = ?
            WHERE sku = ?
        `;
        
        db.run(updateProductQuery, [product_type, price, number_of_products_sold, revenue_generated, sku], function(err) {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Failed to update product: ' + err.message });
                return;
            }
            
            // Update supply_chain_logistics table
            const updateLogisticsQuery = `
                UPDATE supply_chain_logistics 
                SET supplier_name = ?, 
                    location = ?, 
                    lead_time = ?, 
                    production_volumes = ?, 
                    manufacturing_costs = ?, 
                    shipping_carriers = ?, 
                    transportation_modes = ?, 
                    costs = ?
                WHERE sku = ?
            `;
            
            db.run(updateLogisticsQuery, [
                supplier_name, location, lead_time, production_volumes, 
                manufacturing_costs, shipping_carriers, transportation_modes, 
                logistics_costs, sku
            ], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: 'Failed to update logistics: ' + err.message });
                    return;
                }
                
                db.run('COMMIT');
                res.json({ 
                    message: 'Product updated successfully',
                    sku: sku,
                    changes: this.changes 
                });
            });
        });
    });
});

// Delete product
app.delete('/api/products/:sku', (req, res) => {
    const sku = req.params.sku;
    
    // Start transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete from logistics table first (due to foreign key)
        db.run('DELETE FROM supply_chain_logistics WHERE sku = ?', [sku], function(err) {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Failed to delete logistics data: ' + err.message });
                return;
            }
            
            // Delete from products table
            db.run('DELETE FROM products_sales WHERE sku = ?', [sku], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: 'Failed to delete product: ' + err.message });
                    return;
                }
                
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    res.status(404).json({ error: 'Product not found' });
                    return;
                }
                
                db.run('COMMIT');
                res.json({ 
                    message: 'Product deleted successfully',
                    sku: sku 
                });
            });
        });
    });
});

// Get summary statistics
app.get('/api/stats', (req, res) => {
    const queries = {
        totalProducts: 'SELECT COUNT(*) as count FROM products_sales',
        totalRevenue: 'SELECT SUM(revenue_generated) as total FROM products_sales',
        avgPrice: 'SELECT AVG(price) as avg FROM products_sales',
        productTypes: 'SELECT product_type, COUNT(*) as count FROM products_sales GROUP BY product_type',
        topSuppliers: `
            SELECT l.supplier_name, l.location, COUNT(*) as product_count, 
                   SUM(p.revenue_generated) as total_revenue 
            FROM supply_chain_logistics l
            JOIN products_sales p ON l.sku = p.sku
            GROUP BY l.supplier_name, l.location
            ORDER BY total_revenue DESC
            LIMIT 5
        `
    };
    
    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                results[key] = { error: err.message };
            } else {
                results[key] = rows;
            }
            
            completed++;
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Function to get local IP address
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const networkInterface of interfaces[name]) {
            // Skip over non-IPv4 and internal addresses
            if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                return networkInterface.address;
            }
        }
    }
    return 'localhost';
}

// Start server - Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`Supply Chain Management App running on:`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://${localIP}:${PORT}`);
    console.log(`Database: ${dbPath}`);
    console.log('\nOther devices on your network can access this app using the Network URL above');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});