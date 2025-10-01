const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL Database connection for Merchant Two
const pool = new Pool({
    user: process.env.DB_USER || 'vatsaly',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'merchant_two_supply_chain',
    password: process.env.DB_PASSWORD || '',
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

// GET /api/products - Get all products with supply chain data
app.get('/api/products', async (req, res) => {
    const query = `
        SELECT 
            p.product_id,
            p.category,
            p.unit_price,
            p.units_sold,
            p.sales_revenue,
            p.profit_margin,
            p.stock_level,
            p.product_status,
            p.seasonal_demand,
            sc.vendor_name,
            sc.facility_location,
            sc.processing_days,
            sc.output_quantity,
            sc.production_expenses,
            sc.logistics_provider,
            sc.shipping_method,
            sc.freight_charges,
            sc.quality_score,
            sc.reorder_point,
            sc.warehouse_zone,
            sc.sustainability_index,
            (p.sales_revenue - (sc.production_expenses * p.units_sold) - sc.freight_charges) as net_profit
        FROM products p
        LEFT JOIN supply_chain sc ON p.product_id = sc.product_id
        ORDER BY p.product_id
    `;
    
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products - Create a new product
app.post('/api/products', async (req, res) => {
    const {
        product_id,
        category,
        unit_price,
        units_sold,
        sales_revenue,
        profit_margin,
        stock_level,
        product_status,
        seasonal_demand,
        vendor_name,
        facility_location,
        processing_days,
        output_quantity,
        production_expenses,
        logistics_provider,
        shipping_method,
        freight_charges,
        quality_score,
        reorder_point,
        warehouse_zone,
        sustainability_index
    } = req.body;

    // Validate required fields
    if (!product_id || !category || !unit_price) {
        return res.status(400).json({ error: 'Product ID, category, and unit price are required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert into products table
        const insertProductQuery = `
            INSERT INTO products 
            (product_id, category, unit_price, units_sold, sales_revenue, profit_margin, stock_level, product_status, seasonal_demand)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        await client.query(insertProductQuery, [
            product_id,
            category,
            parseFloat(unit_price) || 0,
            parseInt(units_sold) || 0,
            parseFloat(sales_revenue) || 0,
            parseFloat(profit_margin) || 0,
            parseInt(stock_level) || 0,
            product_status || 'Active',
            seasonal_demand || 'Medium'
        ]);

        // Insert into supply_chain table if supply chain data is provided
        if (vendor_name) {
            const insertSupplyChainQuery = `
                INSERT INTO supply_chain 
                (product_id, vendor_name, facility_location, processing_days, output_quantity, 
                 production_expenses, logistics_provider, shipping_method, freight_charges,
                 quality_score, reorder_point, warehouse_zone, sustainability_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            
            await client.query(insertSupplyChainQuery, [
                product_id,
                vendor_name,
                facility_location || '',
                parseInt(processing_days) || 0,
                parseInt(output_quantity) || 0,
                parseFloat(production_expenses) || 0,
                logistics_provider || '',
                shipping_method || '',
                parseFloat(freight_charges) || 0,
                parseFloat(quality_score) || 0,
                parseInt(reorder_point) || 0,
                warehouse_zone || '',
                parseInt(sustainability_index) || 0
            ]);
        }

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Product created successfully',
            product_id: product_id 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Product ID already exists' });
        } else {
            console.error('Create error:', err);
            res.status(500).json({ error: err.message });
        }
    } finally {
        client.release();
    }
});

// PUT /api/products/:productId - Update a product
app.put('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const {
        category,
        unit_price,
        units_sold,
        sales_revenue,
        profit_margin,
        stock_level,
        product_status,
        seasonal_demand,
        vendor_name,
        facility_location,
        processing_days,
        output_quantity,
        production_expenses,
        logistics_provider,
        shipping_method,
        freight_charges,
        quality_score,
        reorder_point,
        warehouse_zone,
        sustainability_index
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Update products table
        const updateProductQuery = `
            UPDATE products 
            SET category = $1, unit_price = $2, units_sold = $3, sales_revenue = $4,
                profit_margin = $5, stock_level = $6, product_status = $7, seasonal_demand = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $9
        `;
        
        const productResult = await client.query(updateProductQuery, [
            category,
            parseFloat(unit_price) || 0,
            parseInt(units_sold) || 0,
            parseFloat(sales_revenue) || 0,
            parseFloat(profit_margin) || 0,
            parseInt(stock_level) || 0,
            product_status || 'Active',
            seasonal_demand || 'Medium',
            productId
        ]);

        if (productResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update or insert supply chain data
        const checkSupplyChainQuery = 'SELECT product_id FROM supply_chain WHERE product_id = $1';
        const supplyChainExists = await client.query(checkSupplyChainQuery, [productId]);

        if (supplyChainExists.rowCount > 0) {
            // Update existing supply chain record
            const updateSupplyChainQuery = `
                UPDATE supply_chain 
                SET vendor_name = $1, facility_location = $2, processing_days = $3, output_quantity = $4,
                    production_expenses = $5, logistics_provider = $6, shipping_method = $7, freight_charges = $8,
                    quality_score = $9, reorder_point = $10, warehouse_zone = $11, sustainability_index = $12,
                    updated_at = CURRENT_TIMESTAMP
                WHERE product_id = $13
            `;
            
            await client.query(updateSupplyChainQuery, [
                vendor_name || '',
                facility_location || '',
                parseInt(processing_days) || 0,
                parseInt(output_quantity) || 0,
                parseFloat(production_expenses) || 0,
                logistics_provider || '',
                shipping_method || '',
                parseFloat(freight_charges) || 0,
                parseFloat(quality_score) || 0,
                parseInt(reorder_point) || 0,
                warehouse_zone || '',
                parseInt(sustainability_index) || 0,
                productId
            ]);
        } else if (vendor_name) {
            // Insert new supply chain record
            const insertSupplyChainQuery = `
                INSERT INTO supply_chain 
                (product_id, vendor_name, facility_location, processing_days, output_quantity, 
                 production_expenses, logistics_provider, shipping_method, freight_charges,
                 quality_score, reorder_point, warehouse_zone, sustainability_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            
            await client.query(insertSupplyChainQuery, [
                productId,
                vendor_name,
                facility_location || '',
                parseInt(processing_days) || 0,
                parseInt(output_quantity) || 0,
                parseFloat(production_expenses) || 0,
                logistics_provider || '',
                shipping_method || '',
                parseFloat(freight_charges) || 0,
                parseFloat(quality_score) || 0,
                parseInt(reorder_point) || 0,
                warehouse_zone || '',
                parseInt(sustainability_index) || 0
            ]);
        }

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Product updated successfully',
            product_id: productId 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/products/:productId - Delete a product
app.delete('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Delete from supply_chain first (foreign key constraint)
        await client.query('DELETE FROM supply_chain WHERE product_id = $1', [productId]);
        
        // Delete from products
        const result = await client.query('DELETE FROM products WHERE product_id = $1', [productId]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Product deleted successfully',
            product_id: productId 
        });
        
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
        const totalProductsQuery = 'SELECT COUNT(*) as count FROM products';
        const totalProducts = await pool.query(totalProductsQuery);
        
        // Get total revenue
        const totalRevenueQuery = 'SELECT SUM(sales_revenue) as total FROM products';
        const totalRevenue = await pool.query(totalRevenueQuery);
        
        // Get average price
        const avgPriceQuery = 'SELECT AVG(unit_price) as avg FROM products';
        const avgPrice = await pool.query(avgPriceQuery);
        
        // Get distinct categories
        const categoriesQuery = 'SELECT DISTINCT category FROM products ORDER BY category';
        const categories = await pool.query(categoriesQuery);
        
        res.json({
            totalProducts: totalProducts.rows,
            totalRevenue: totalRevenue.rows,
            avgPrice: avgPrice.rows,
            categories: categories.rows
        });
    } catch (err) {
        console.error('Stats query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/analytics - Get various analytics
app.get('/api/analytics', async (req, res) => {
    const queries = {
        categorySummary: `
            SELECT 
                p.category,
                COUNT(*) as total_products,
                AVG(p.unit_price) as avg_price,
                SUM(p.units_sold) as total_units_sold,
                SUM(p.sales_revenue) as total_revenue,
                AVG(p.profit_margin) as avg_profit_margin
            FROM products p
            GROUP BY p.category
            ORDER BY total_revenue DESC
        `,
        vendorPerformance: `
            SELECT 
                sc.vendor_name,
                sc.facility_location,
                COUNT(*) as products_supplied,
                AVG(sc.processing_days) as avg_processing_days,
                AVG(sc.production_expenses) as avg_production_expenses,
                AVG(sc.quality_score) as avg_quality_score,
                SUM(p.sales_revenue) as total_revenue_generated
            FROM supply_chain sc
            JOIN products p ON sc.product_id = p.product_id
            GROUP BY sc.vendor_name, sc.facility_location
            ORDER BY total_revenue_generated DESC
        `,
        topProfitableProducts: `
            SELECT 
                p.product_id,
                p.category,
                p.unit_price,
                p.profit_margin,
                (p.sales_revenue - (sc.production_expenses * p.units_sold) - sc.freight_charges) as net_profit
            FROM products p
            LEFT JOIN supply_chain sc ON p.product_id = sc.product_id
            ORDER BY net_profit DESC NULLS LAST
            LIMIT 10
        `,
        shippingAnalysis: `
            SELECT 
                shipping_method,
                COUNT(*) as usage_count,
                AVG(freight_charges) as avg_freight_cost,
                AVG(processing_days) as avg_processing_days
            FROM supply_chain
            WHERE shipping_method IS NOT NULL AND shipping_method != ''
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
    console.log(`Merchant Two Supply Chain Management App running on:`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://${localIP}:${PORT}`);
    console.log(`Database: PostgreSQL - merchant_two_supply_chain`);
    console.log('\\nOther devices on your network can access this app using the Network URL above');
    console.log('\\nDirect database access available at:');
    console.log(`  Host: ${localIP}`);
    console.log(`  Port: 5432`);
    console.log(`  Database: merchant_two_supply_chain`);
    console.log(`  User: vatsaly`);
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