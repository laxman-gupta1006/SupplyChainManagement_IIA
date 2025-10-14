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
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL database:', err.message);
        console.error('Make sure PostgreSQL is running and the database exists');
    } else {
        console.log('Connected to PostgreSQL database');
        release();
    }
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve main page
app.get('/', (req, res) => {
    res.render('index');
});

// API Routes

// GET /api/products - Get all products with logistics data
app.get('/api/products', async (req, res) => {
    const query = `
        SELECT
            p.item_id,
            p.product_category,
            p.product_name,
            p.brand_name,
            p.unit_cost,
            p.quantity_sold,
            p.total_earnings,
            p.profit_margin,
            v.vendor_company,
            v.business_location,
            v.delivery_time_days,
            v.order_quantity,
            v.production_cost,
            v.logistics_partner,
            v.shipping_method,
            v.logistics_fee
        FROM product_catalog p
        LEFT JOIN vendor_management v ON p.item_id = v.item_id
        ORDER BY p.item_id
    `;
    
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/:item_id - Update a product (product_catalog + vendor_management)
app.put('/api/products/:item_id', async (req, res) => {
    const { item_id } = req.params;
    const {
        product_category,
        unit_cost,
        quantity_sold,
        total_earnings,
        profit_margin,
        brand_name,
        product_name,
        vendor_company,
        business_location,
        delivery_time_days,
        order_quantity,
        production_cost,
        logistics_partner,
        shipping_method,
        logistics_fee,
        quality_rating,
        contract_start_date,
        payment_terms
    } = req.body;

    // Sanitize inputs
    const sanitized = {
        product_category: product_category || '',
        unit_cost: parseFloat(unit_cost) || 0,
        quantity_sold: parseInt(quantity_sold) || 0,
        total_earnings: parseFloat(total_earnings) || 0,
        profit_margin: profit_margin !== undefined ? parseFloat(profit_margin) : null,
        brand_name: brand_name || '',
        product_name: product_name || '',
        vendor_company: vendor_company || '',
        business_location: business_location || '',
        delivery_time_days: parseInt(delivery_time_days) || 0,
        order_quantity: parseInt(order_quantity) || 0,
        production_cost: parseFloat(production_cost) || 0,
        logistics_partner: logistics_partner || '',
        shipping_method: shipping_method || '',
        logistics_fee: parseFloat(logistics_fee) || 0,
        quality_rating: quality_rating !== undefined ? parseFloat(quality_rating) : null,
        contract_start_date: contract_start_date || null,
        payment_terms: payment_terms || null
    };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateProduct = `
            UPDATE product_catalog
            SET product_category = $1,
                unit_cost = $2,
                quantity_sold = $3,
                total_earnings = $4,
                profit_margin = $5,
                brand_name = $6,
                product_name = $7,
                updated_timestamp = CURRENT_TIMESTAMP
            WHERE item_id = $8
        `;

        await client.query(updateProduct, [
            sanitized.product_category,
            sanitized.unit_cost,
            sanitized.quantity_sold,
            sanitized.total_earnings,
            sanitized.profit_margin,
            sanitized.brand_name,
            sanitized.product_name,
            item_id
        ]);

        const upsertVendor = `
            INSERT INTO vendor_management(
                item_id, vendor_company, business_location, delivery_time_days,
                order_quantity, production_cost, logistics_partner, shipping_method,
                logistics_fee, quality_rating, contract_start_date, payment_terms
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            ON CONFLICT (item_id) DO UPDATE SET
                vendor_company = EXCLUDED.vendor_company,
                business_location = EXCLUDED.business_location,
                delivery_time_days = EXCLUDED.delivery_time_days,
                order_quantity = EXCLUDED.order_quantity,
                production_cost = EXCLUDED.production_cost,
                logistics_partner = EXCLUDED.logistics_partner,
                shipping_method = EXCLUDED.shipping_method,
                logistics_fee = EXCLUDED.logistics_fee,
                quality_rating = EXCLUDED.quality_rating,
                contract_start_date = EXCLUDED.contract_start_date,
                payment_terms = EXCLUDED.payment_terms
        `;

        await client.query(upsertVendor, [
            item_id,
            sanitized.vendor_company,
            sanitized.business_location,
            sanitized.delivery_time_days,
            sanitized.order_quantity,
            sanitized.production_cost,
            sanitized.logistics_partner,
            sanitized.shipping_method,
            sanitized.logistics_fee,
            sanitized.quality_rating,
            sanitized.contract_start_date,
            sanitized.payment_terms
        ]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Product updated successfully', item_id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/products/:item_id - Delete a product
app.delete('/api/products/:item_id', async (req, res) => {
    const { item_id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Delete vendor first due to FK
        await client.query('DELETE FROM vendor_management WHERE item_id = $1', [item_id]);
        const result = await client.query('DELETE FROM product_catalog WHERE item_id = $1', [item_id]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Product deleted successfully', item_id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/stats - Get dashboard statistics
app.get('/api/stats', async (req, res) => {
    try {
        // Get total products
        const totalProductsQuery = 'SELECT COUNT(*) as count FROM product_catalog';
        const totalProducts = await pool.query(totalProductsQuery);
        
        // Get total revenue
        const totalRevenueQuery = 'SELECT SUM(total_earnings) as total FROM product_catalog';
        const totalRevenue = await pool.query(totalRevenueQuery);
        
        // Get average unit cost
        const avgPriceQuery = 'SELECT AVG(unit_cost) as avg FROM product_catalog';
        const avgPrice = await pool.query(avgPriceQuery);
        
        // Get distinct product categories
        const productTypesQuery = 'SELECT DISTINCT product_category FROM product_catalog ORDER BY product_category';
        const productTypes = await pool.query(productTypesQuery);
        
        res.json({
            totalProducts: totalProducts.rows,
            totalRevenue: totalRevenue.rows,
            avgPrice: avgPrice.rows,
            productTypes: productTypes.rows
        });
    } catch (err) {
        console.error('Stats query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics - Get various analytics
app.get('/api/analytics', async (req, res) => {
    const queries = {
        productTypeSummary: `
            SELECT 
                p.product_category,
                COUNT(*) as total_products,
                AVG(p.unit_cost) as avg_unit_cost,
                SUM(p.quantity_sold) as total_units_sold,
                SUM(p.total_earnings) as total_revenue
            FROM product_catalog p
            GROUP BY p.product_category
            ORDER BY total_revenue DESC
        `,
        supplierPerformance: `
            SELECT 
                v.vendor_company,
                v.business_location,
                COUNT(*) as products_supplied,
                AVG(v.delivery_time_days) as avg_delivery_time_days,
                AVG(v.production_cost) as avg_production_cost,
                SUM(p.total_earnings) as total_revenue_generated
            FROM vendor_management v
            JOIN product_catalog p ON v.item_id = p.item_id
            GROUP BY v.vendor_company, v.business_location
            ORDER BY total_revenue_generated DESC
        `,
        topProfitableProducts: `
            SELECT 
                p.item_id,
                p.product_category,
                p.unit_cost,
                (p.total_earnings - v.production_cost - v.logistics_fee) as profit_margin
            FROM product_catalog p
            JOIN vendor_management v ON p.item_id = v.item_id
            ORDER BY profit_margin DESC
            LIMIT 10
        `,
        transportationAnalysis: `
            SELECT 
                shipping_method,
                COUNT(*) as usage_count,
                AVG(logistics_fee) as avg_logistics_fee,
                AVG(delivery_time_days) as avg_delivery_time_days
            FROM vendor_management
            GROUP BY shipping_method
            ORDER BY usage_count DESC
        `
    };

    try {
        const results = {};
        
        for (const [key, query] of Object.entries(queries)) {
            const result = await pool.query(query);
            results[key] = result.rows;
        }
        
        res.json(results);
    } catch (err) {
        console.error('Analytics query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
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
const server = app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`Supply Chain Management App running on:`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://${localIP}:${PORT}`);
    console.log(`Database: PostgreSQL - supply_chain_management`);
    console.log('\\nOther devices on your network can access this app using the Network URL above');
    console.log('\\nDirect database access available at:');
    console.log(`  Host: ${localIP}`);
    console.log(`  Port: 5432`);
    console.log(`  Database: supply_chain_management`);
    console.log(`  User: laxmangupta`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\\nShutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
    });
    
    try {
        await pool.end();
        console.log('PostgreSQL pool closed');
        process.exit(0);
    } catch (err) {
        console.error('Error closing PostgreSQL pool:', err);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\\nReceived SIGTERM. Shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
    });
    
    try {
        await pool.end();
        console.log('PostgreSQL pool closed');
        process.exit(0);
    } catch (err) {
        console.error('Error closing PostgreSQL pool:', err);
        process.exit(1);
    }
});