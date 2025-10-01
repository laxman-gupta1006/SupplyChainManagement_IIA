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
    
    try {
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/:sku - Update a product
app.put('/api/products/:sku', async (req, res) => {
    const { sku } = req.params;
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
    
    // Handle costs - use logistics_costs from frontend or default to 0
    const costs = logistics_costs || 0;
    
    // Validate and sanitize input values
    const sanitizedData = {
        product_type: product_type || '',
        price: parseFloat(price) || 0,
        number_of_products_sold: parseInt(number_of_products_sold) || 0,
        revenue_generated: parseFloat(revenue_generated) || 0,
        supplier_name: supplier_name || '',
        location: location || '',
        lead_time: parseInt(lead_time) || 0,
        production_volumes: parseInt(production_volumes) || 0,
        manufacturing_costs: parseFloat(manufacturing_costs) || 0,
        shipping_carriers: shipping_carriers || '',
        transportation_modes: transportation_modes || '',
        costs: parseFloat(costs) || 0
    };

    const client = await pool.connect();

    try {
        await client.query('BEGIN');        // Update products_sales table
        const updateProductQuery = `
            UPDATE products_sales 
            SET product_type = $1, price = $2, number_of_products_sold = $3, revenue_generated = $4
            WHERE sku = $5
        `;
        
        await client.query(updateProductQuery, [
            sanitizedData.product_type, 
            sanitizedData.price, 
            sanitizedData.number_of_products_sold, 
            sanitizedData.revenue_generated, 
            sku
        ]);

        // Update supply_chain_logistics table
        const updateLogisticsQuery = `
            UPDATE supply_chain_logistics 
            SET supplier_name = $1, location = $2, lead_time = $3, production_volumes = $4,
                manufacturing_costs = $5, shipping_carriers = $6, transportation_modes = $7, costs = $8
            WHERE sku = $9
        `;
        
        await client.query(updateLogisticsQuery, [
            sanitizedData.supplier_name, 
            sanitizedData.location, 
            sanitizedData.lead_time, 
            sanitizedData.production_volumes,
            sanitizedData.manufacturing_costs, 
            sanitizedData.shipping_carriers, 
            sanitizedData.transportation_modes, 
            sanitizedData.costs, 
            sku
        ]);

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Product updated successfully',
            sku: sku 
        });
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE /api/products/:sku - Delete a product
app.delete('/api/products/:sku', async (req, res) => {
    const { sku } = req.params;
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Delete from supply_chain_logistics first (foreign key constraint)
        await client.query('DELETE FROM supply_chain_logistics WHERE sku = $1', [sku]);
        
        // Delete from products_sales
        const result = await client.query('DELETE FROM products_sales WHERE sku = $1', [sku]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Product deleted successfully',
            sku: sku 
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
        const totalProductsQuery = 'SELECT COUNT(*) as count FROM products_sales';
        const totalProducts = await pool.query(totalProductsQuery);
        
        // Get total revenue
        const totalRevenueQuery = 'SELECT SUM(revenue_generated) as total FROM products_sales';
        const totalRevenue = await pool.query(totalRevenueQuery);
        
        // Get average price
        const avgPriceQuery = 'SELECT AVG(price) as avg FROM products_sales';
        const avgPrice = await pool.query(avgPriceQuery);
        
        // Get distinct product types
        const productTypesQuery = 'SELECT DISTINCT product_type FROM products_sales ORDER BY product_type';
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
                p.product_type,
                COUNT(*) as total_products,
                AVG(p.price) as avg_price,
                SUM(p.number_of_products_sold) as total_units_sold,
                SUM(p.revenue_generated) as total_revenue
            FROM products_sales p
            GROUP BY p.product_type
            ORDER BY total_revenue DESC
        `,
        supplierPerformance: `
            SELECT 
                l.supplier_name,
                l.location,
                COUNT(*) as products_supplied,
                AVG(l.lead_time) as avg_lead_time,
                AVG(l.manufacturing_costs) as avg_manufacturing_costs,
                SUM(p.revenue_generated) as total_revenue_generated
            FROM supply_chain_logistics l
            JOIN products_sales p ON l.sku = p.sku
            GROUP BY l.supplier_name, l.location
            ORDER BY total_revenue_generated DESC
        `,
        topProfitableProducts: `
            SELECT 
                p.sku,
                p.product_type,
                p.price,
                (p.revenue_generated - l.manufacturing_costs - l.costs) as profit_margin
            FROM products_sales p
            JOIN supply_chain_logistics l ON p.sku = l.sku
            ORDER BY profit_margin DESC
            LIMIT 10
        `,
        transportationAnalysis: `
            SELECT 
                transportation_modes,
                COUNT(*) as usage_count,
                AVG(costs) as avg_logistics_cost,
                AVG(lead_time) as avg_lead_time
            FROM supply_chain_logistics
            GROUP BY transportation_modes
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