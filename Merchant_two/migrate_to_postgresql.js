const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'vatsaly',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'merchant_two_supply_chain',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
    console.log('🏗️  Setting up Merchant Two PostgreSQL Database...');
    
    try {
        // Create tables
        await createTables();
        console.log('✅ Tables created successfully');
        
        // Import data from CSV files
        await importCSVData();
        console.log('✅ Data imported successfully');
        
        console.log('🎉 Database setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

async function createTables() {
    const client = await pool.connect();
    
    try {
        // Drop existing tables if they exist
        await client.query('DROP TABLE IF EXISTS supply_chain CASCADE');
        await client.query('DROP TABLE IF EXISTS products CASCADE');
        
        // Create products table
        const createProductsTable = `
            CREATE TABLE products (
                product_id VARCHAR(20) PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
                units_sold INTEGER NOT NULL DEFAULT 0,
                sales_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
                profit_margin DECIMAL(5, 2) NOT NULL DEFAULT 0,
                stock_level INTEGER NOT NULL DEFAULT 0,
                product_status VARCHAR(20) NOT NULL DEFAULT 'Active',
                seasonal_demand VARCHAR(20) NOT NULL DEFAULT 'Medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await client.query(createProductsTable);
        console.log('📦 Products table created');
        
        // Create supply_chain table
        const createSupplyChainTable = `
            CREATE TABLE supply_chain (
                id SERIAL PRIMARY KEY,
                product_id VARCHAR(20) REFERENCES products(product_id) ON DELETE CASCADE,
                vendor_name VARCHAR(100) NOT NULL,
                facility_location VARCHAR(100),
                processing_days INTEGER DEFAULT 0,
                output_quantity INTEGER DEFAULT 0,
                production_expenses DECIMAL(10, 2) DEFAULT 0,
                logistics_provider VARCHAR(100),
                shipping_method VARCHAR(50),
                freight_charges DECIMAL(10, 2) DEFAULT 0,
                quality_score DECIMAL(3, 1) DEFAULT 0,
                reorder_point INTEGER DEFAULT 0,
                warehouse_zone VARCHAR(20),
                sustainability_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id)
            )
        `;
        
        await client.query(createSupplyChainTable);
        console.log('🚚 Supply chain table created');
        
        // Create indexes for better performance
        await client.query('CREATE INDEX idx_products_category ON products(category)');
        await client.query('CREATE INDEX idx_products_status ON products(product_status)');
        await client.query('CREATE INDEX idx_supply_chain_vendor ON supply_chain(vendor_name)');
        await client.query('CREATE INDEX idx_supply_chain_location ON supply_chain(facility_location)');
        
        console.log('📊 Indexes created');
        
    } finally {
        client.release();
    }
}

async function importCSVData() {
    console.log('📂 Importing data from CSV files...');
    
    // Import products data
    const productsData = await readCSVFile(path.join(__dirname, 'Dataset', 'product sales-2.csv'));
    console.log(`📈 Found ${productsData.length} products to import`);
    
    // Import supply chain data
    const supplyChainData = await readCSVFile(path.join(__dirname, 'Dataset', 'supply chain -2.csv'));
    console.log(`🏭 Found ${supplyChainData.length} supply chain records to import`);
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert products
        for (const product of productsData) {
            const insertQuery = `
                INSERT INTO products 
                (product_id, category, unit_price, units_sold, sales_revenue, profit_margin, stock_level, product_status, seasonal_demand)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            
            await client.query(insertQuery, [
                product.ProductID,
                product.Category,
                parseFloat(product.UnitPrice) || 0,
                parseInt(product.UnitsSold) || 0,
                parseFloat(product.SalesRevenue) || 0,
                parseFloat(product.ProfitMargin) || 0,
                parseInt(product.StockLevel) || 0,
                product.ProductStatus || 'Active',
                product.SeasonalDemand || 'Medium'
            ]);
        }
        
        console.log('✅ Products imported');
        
        // Insert supply chain data
        for (const supply of supplyChainData) {
            const insertQuery = `
                INSERT INTO supply_chain 
                (product_id, vendor_name, facility_location, processing_days, output_quantity, 
                 production_expenses, logistics_provider, shipping_method, freight_charges,
                 quality_score, reorder_point, warehouse_zone, sustainability_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            
            await client.query(insertQuery, [
                supply.ProductID,
                supply.VendorName,
                supply.FacilityLocation,
                parseInt(supply.ProcessingDays) || 0,
                parseInt(supply.OutputQuantity) || 0,
                parseFloat(supply.ProductionExpenses) || 0,
                supply.LogisticsProvider,
                supply.ShippingMethod,
                parseFloat(supply.FreightCharges) || 0,
                parseFloat(supply.QualityScore) || 0,
                parseInt(supply.ReorderPoint) || 0,
                supply.WarehouseZone,
                parseInt(supply.SustainabilityIndex) || 0
            ]);
        }
        
        console.log('✅ Supply chain data imported');
        
        await client.query('COMMIT');
        
        // Show import statistics
        const productCount = await client.query('SELECT COUNT(*) FROM products');
        const supplyChainCount = await client.query('SELECT COUNT(*) FROM supply_chain');
        
        console.log(`📊 Import Summary:`);
        console.log(`   Products: ${productCount.rows[0].count}`);
        console.log(`   Supply Chain Records: ${supplyChainCount.rows[0].count}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        if (!fs.existsSync(filePath)) {
            reject(new Error(`CSV file not found: ${filePath}`));
            return;
        }
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Run the setup
createDatabase();