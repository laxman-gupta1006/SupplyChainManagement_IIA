#!/usr/bin/env node

/**
 * Schema Evolution Script for Merchant_one Database
 * 
 * This script:
 * 1. Creates a backup of the current schema and data
 * 2. Creates a new evolved schema with different but meaningful column names
 * 3. Populates it with realistic data (~50 entries)
 * 4. Maintains business logic and relationships
 * 
 * The new schema changes column names but preserves semantic meaning:
 * - products_sales → product_catalog (with renamed columns)
 * - supply_chain_logistics → vendor_management (with renamed columns)
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// PostgreSQL connection
const pool = new Pool({
    user: process.env.MERCHANT1_USER || 'laxmangupta',
    host: process.env.MERCHANT1_HOST || 'localhost',
    database: process.env.MERCHANT1_DB || 'supply_chain_management',
    password: process.env.MERCHANT1_PASSWORD || '',
    port: process.env.MERCHANT1_PORT || 5432,
});

// Backup file paths
const backupDir = path.join(__dirname, 'schema_backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupFile = path.join(backupDir, `merchant1_backup_${timestamp}.sql`);

/**
 * Step 1: Create backup of current schema and data
 */
async function createBackup() {
    console.log('📦 Creating backup of current Merchant_one schema...');
    
    try {
        // Ensure backup directory exists
        await fs.mkdir(backupDir, { recursive: true });
        
        const client = await pool.connect();
        
        // Get current table structures and data
        const backupContent = [];
        
        // Backup table creation scripts
        backupContent.push('-- Merchant_one Database Backup');
        backupContent.push(`-- Created: ${new Date().toISOString()}`);
        backupContent.push('-- Original Schema Backup\n');
        
        // Get table schemas
        const tables = ['products_sales', 'supply_chain_logistics'];
        
        for (const tableName of tables) {
            try {
                // Get table structure
                const schemaQuery = `
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1 
                    ORDER BY ordinal_position
                `;
                
                const schemaResult = await client.query(schemaQuery, [tableName]);
                
                if (schemaResult.rows.length > 0) {
                    backupContent.push(`-- Table: ${tableName}`);
                    backupContent.push(`DROP TABLE IF EXISTS ${tableName}_backup CASCADE;`);
                    
                    // Create table backup
                    let createTableSQL = `CREATE TABLE ${tableName}_backup (\\n`;
                    const columns = schemaResult.rows.map(row => {
                        let colDef = `  ${row.column_name} ${row.data_type}`;
                        if (row.is_nullable === 'NO') colDef += ' NOT NULL';
                        if (row.column_default) colDef += ` DEFAULT ${row.column_default}`;
                        return colDef;
                    });
                    createTableSQL += columns.join(',\\n');
                    createTableSQL += '\\n);\\n';
                    
                    backupContent.push(createTableSQL);
                    
                    // Get table data
                    const dataResult = await client.query(`SELECT * FROM ${tableName}`);
                    
                    if (dataResult.rows.length > 0) {
                        backupContent.push(`-- Data for ${tableName}`);
                        
                        const columnNames = schemaResult.rows.map(r => r.column_name);
                        
                        for (const row of dataResult.rows) {
                            const values = columnNames.map(col => {
                                const value = row[col];
                                if (value === null) return 'NULL';
                                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                                return value;
                            });
                            
                            backupContent.push(`INSERT INTO ${tableName}_backup (${columnNames.join(', ')}) VALUES (${values.join(', ')});`);
                        }
                        
                        console.log(`   ✅ Backed up ${dataResult.rows.length} records from ${tableName}`);
                    }
                    
                    backupContent.push('');
                }
            } catch (tableErr) {
                console.warn(`   ⚠️ Could not backup table ${tableName}:`, tableErr.message);
            }
        }
        
        client.release();
        
        // Write backup to file
        await fs.writeFile(backupFile, backupContent.join('\\n'));
        console.log(`✅ Backup created: ${backupFile}`);
        
    } catch (err) {
        console.error('❌ Error creating backup:', err.message);
        throw err;
    }
}

/**
 * Step 2: Create new evolved schema with different column names
 */
async function createNewSchema() {
    console.log('🔄 Creating new evolved schema...');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Drop old tables (backed up already)
        await client.query('DROP TABLE IF EXISTS supply_chain_logistics CASCADE');
        await client.query('DROP TABLE IF EXISTS products_sales CASCADE');
        
        // Create new product_catalog table (evolved from products_sales)
        const createProductCatalogTable = `
            CREATE TABLE product_catalog (
                item_id VARCHAR(20) PRIMARY KEY,
                product_category VARCHAR(50) NOT NULL,
                unit_cost DECIMAL(10, 2) NOT NULL,
                quantity_sold INTEGER NOT NULL,
                total_earnings DECIMAL(15, 2) NOT NULL,
                profit_margin DECIMAL(5, 2),
                brand_name VARCHAR(100),
                product_name VARCHAR(200),
                launch_date DATE DEFAULT CURRENT_DATE,
                created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create new vendor_management table (evolved from supply_chain_logistics)
        const createVendorManagementTable = `
            CREATE TABLE vendor_management (
                item_id VARCHAR(20) PRIMARY KEY,
                vendor_company VARCHAR(100) NOT NULL,
                business_location VARCHAR(100) NOT NULL,
                delivery_time_days INTEGER NOT NULL,
                order_quantity INTEGER NOT NULL,
                production_cost DECIMAL(10, 2) NOT NULL,
                logistics_partner VARCHAR(100) NOT NULL,
                shipping_method VARCHAR(50) NOT NULL,
                logistics_fee DECIMAL(10, 2) NOT NULL,
                quality_rating DECIMAL(3, 1) DEFAULT 5.0,
                contract_start_date DATE DEFAULT CURRENT_DATE,
                payment_terms VARCHAR(50) DEFAULT 'NET30',
                created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES product_catalog(item_id) ON DELETE CASCADE
            )
        `;
        
        await client.query(createProductCatalogTable);
        await client.query(createVendorManagementTable);
        
        // Create indexes for better performance
        await client.query('CREATE INDEX idx_product_category ON product_catalog(product_category)');
        await client.query('CREATE INDEX idx_brand_name ON product_catalog(brand_name)');
        await client.query('CREATE INDEX idx_vendor_company ON vendor_management(vendor_company)');
        await client.query('CREATE INDEX idx_business_location ON vendor_management(business_location)');
        await client.query('CREATE INDEX idx_logistics_partner ON vendor_management(logistics_partner)');
        await client.query('CREATE INDEX idx_shipping_method ON vendor_management(shipping_method)');
        
        // Create a view for backward compatibility (optional)
        const createCompatibilityView = `
            CREATE VIEW products_sales_view AS
            SELECT 
                item_id as sku,
                product_category as product_type,
                unit_cost as price,
                quantity_sold as number_of_products_sold,
                total_earnings as revenue_generated
            FROM product_catalog
        `;
        
        await client.query(createCompatibilityView);
        
        await client.query('COMMIT');
        console.log('✅ New evolved schema created successfully');
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating new schema:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Step 3: Generate realistic sample data
 */
function generateRealisticData() {
    console.log('📊 Generating realistic sample data...');
    
    // Realistic product categories and brands
    const categories = [
        { name: 'cosmetics', brands: ['Lakme', 'Maybelline', 'LOreal', 'Revlon', 'MAC'] },
        { name: 'skincare', brands: ['Olay', 'Neutrogena', 'Cetaphil', 'Himalaya', 'Dove'] },
        { name: 'haircare', brands: ['Pantene', 'Head & Shoulders', 'TRESemme', 'Garnier', 'Sunsilk'] },
        { name: 'fragrance', brands: ['Calvin Klein', 'Hugo Boss', 'Davidoff', 'Axe', 'Fogg'] },
        { name: 'wellness', brands: ['Patanjali', 'Dabur', 'Baidyanath', 'Zandu', 'Organic India'] }
    ];
    
    // Indian cities for realistic locations
    const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
    
    // Realistic vendor/supplier companies
    const vendorCompanies = [
        'Beauty Hub Enterprises', 'Cosmo Supply Co.', 'Urban Beauty Ltd.', 'Glamour Distributors',
        'Premium Beauty Solutions', 'Elite Cosmetics Pvt Ltd', 'Royal Beauty Corporation',
        'Sunrise Trading Co.', 'Golden Gate Suppliers', 'Metro Beauty House',
        'Crystal Clear Distributors', 'Radiant Supply Chain', 'Majestic Beauty Co.',
        'Sparkling Ventures Ltd', 'Divine Beauty Enterprises'
    ];
    
    // Logistics partners
    const logisticsPartners = ['BlueDart Express', 'DTDC Courier', 'FedEx India', 'Delhivery', 'Ekart Logistics', 'XpressBees', 'Professional Couriers'];
    
    // Shipping methods
    const shippingMethods = ['Express Delivery', 'Standard Shipping', 'Same Day Delivery', 'Next Day Delivery', 'Economy Shipping', 'Premium Express'];
    
    const products = [];
    const vendors = [];
    
    for (let i = 1; i <= 50; i++) {
        const itemId = `ITEM${String(i).padStart(3, '0')}`;
        
        // Select random category and brand
        const categoryObj = categories[Math.floor(Math.random() * categories.length)];
        const brand = categoryObj.brands[Math.floor(Math.random() * categoryObj.brands.length)];
        
        // Generate realistic product names
        const productTypes = {
            cosmetics: ['Lipstick', 'Foundation', 'Mascara', 'Eyeliner', 'Blush', 'Concealer'],
            skincare: ['Face Wash', 'Moisturizer', 'Face Cream', 'Serum', 'Toner', 'Cleanser'],
            haircare: ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Mask', 'Hair Spray', 'Hair Serum'],
            fragrance: ['Perfume', 'Body Spray', 'Deodorant', 'Eau de Toilette', 'Body Mist'],
            wellness: ['Face Pack', 'Herbal Oil', 'Ayurvedic Cream', 'Natural Soap', 'Herbal Tea']
        };
        
        const productType = productTypes[categoryObj.name];
        const productName = `${brand} ${productType[Math.floor(Math.random() * productType.length)]}`;
        
        // Generate realistic pricing based on category and brand
        const basePrices = {
            cosmetics: [299, 599, 899, 1299, 1899],
            skincare: [199, 399, 699, 999, 1499],
            haircare: [149, 299, 499, 799, 1199],
            fragrance: [599, 999, 1599, 2499, 3999],
            wellness: [99, 199, 349, 599, 899]
        };
        
        const unitCost = basePrices[categoryObj.name][Math.floor(Math.random() * basePrices[categoryObj.name].length)];
        const quantitySold = Math.floor(Math.random() * 500) + 50; // 50-549 units
        const totalEarnings = unitCost * quantitySold;
        const profitMargin = (Math.random() * 30 + 10).toFixed(2); // 10-40% profit margin
        
        // Random launch date (last 2 years)
        const launchDate = new Date();
        launchDate.setDate(launchDate.getDate() - Math.floor(Math.random() * 730));
        
        products.push({
            itemId,
            productCategory: categoryObj.name,
            unitCost,
            quantitySold,
            totalEarnings,
            profitMargin,
            brandName: brand,
            productName,
            launchDate: launchDate.toISOString().split('T')[0]
        });
        
        // Generate corresponding vendor data
        const vendorCompany = vendorCompanies[Math.floor(Math.random() * vendorCompanies.length)];
        const businessLocation = locations[Math.floor(Math.random() * locations.length)];
        const deliveryTimeDays = Math.floor(Math.random() * 25) + 5; // 5-29 days
        const orderQuantity = Math.floor(Math.random() * 800) + 200; // 200-999 units
        const productionCost = unitCost * (0.6 + Math.random() * 0.3); // 60-90% of unit cost
        const logisticsPartner = logisticsPartners[Math.floor(Math.random() * logisticsPartners.length)];
        const shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
        const logisticsFee = (productionCost * (0.05 + Math.random() * 0.15)).toFixed(2); // 5-20% of production cost
        const qualityRating = (3.5 + Math.random() * 1.5).toFixed(1); // 3.5-5.0 rating
        
        const paymentTerms = ['NET30', 'NET45', 'NET60', 'COD', 'Advance Payment'][Math.floor(Math.random() * 5)];
        
        // Contract start date (within last year)
        const contractStartDate = new Date();
        contractStartDate.setDate(contractStartDate.getDate() - Math.floor(Math.random() * 365));
        
        vendors.push({
            itemId,
            vendorCompany,
            businessLocation,
            deliveryTimeDays,
            orderQuantity,
            productionCost: productionCost.toFixed(2),
            logisticsPartner,
            shippingMethod,
            logisticsFee,
            qualityRating,
            contractStartDate: contractStartDate.toISOString().split('T')[0],
            paymentTerms
        });
    }
    
    console.log(`✅ Generated ${products.length} realistic product records`);
    console.log(`✅ Generated ${vendors.length} realistic vendor records`);
    
    return { products, vendors };
}

/**
 * Step 4: Insert realistic data into new schema
 */
async function insertRealisticData() {
    console.log('💾 Inserting realistic data into new schema...');
    
    const { products, vendors } = generateRealisticData();
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert products
        console.log('   📦 Inserting product catalog data...');
        for (const product of products) {
            const insertProductQuery = `
                INSERT INTO product_catalog (
                    item_id, product_category, unit_cost, quantity_sold, total_earnings,
                    profit_margin, brand_name, product_name, launch_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `;
            
            await client.query(insertProductQuery, [
                product.itemId,
                product.productCategory,
                product.unitCost,
                product.quantitySold,
                product.totalEarnings,
                product.profitMargin,
                product.brandName,
                product.productName,
                product.launchDate
            ]);
        }
        
        // Insert vendor data
        console.log('   🏢 Inserting vendor management data...');
        for (const vendor of vendors) {
            const insertVendorQuery = `
                INSERT INTO vendor_management (
                    item_id, vendor_company, business_location, delivery_time_days, order_quantity,
                    production_cost, logistics_partner, shipping_method, logistics_fee,
                    quality_rating, contract_start_date, payment_terms
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `;
            
            await client.query(insertVendorQuery, [
                vendor.itemId,
                vendor.vendorCompany,
                vendor.businessLocation,
                vendor.deliveryTimeDays,
                vendor.orderQuantity,
                vendor.productionCost,
                vendor.logisticsPartner,
                vendor.shippingMethod,
                vendor.logisticsFee,
                vendor.qualityRating,
                vendor.contractStartDate,
                vendor.paymentTerms
            ]);
        }
        
        await client.query('COMMIT');
        console.log('✅ Realistic data inserted successfully');
        
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error inserting data:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Step 5: Verify the new schema and data
 */
async function verifyNewSchema() {
    console.log('🔍 Verifying new schema and data...');
    
    try {
        const productCountResult = await pool.query('SELECT COUNT(*) FROM product_catalog');
        const vendorCountResult = await pool.query('SELECT COUNT(*) FROM vendor_management');
        
        console.log(`✅ Products in new catalog: ${productCountResult.rows[0].count}`);
        console.log(`✅ Vendor records: ${vendorCountResult.rows[0].count}`);
        
        // Test sample queries with new schema
        console.log('\\n📊 Sample data from new schema:');
        
        const sampleProductsResult = await pool.query(`
            SELECT item_id, product_category, brand_name, product_name, unit_cost, quantity_sold
            FROM product_catalog
            ORDER BY total_earnings DESC
            LIMIT 5
        `);
        
        console.log('\\n🏆 Top 5 products by revenue:');
        sampleProductsResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.brand_name} ${row.product_name} (${row.item_id})`);
            console.log(`     Category: ${row.product_category} | Price: ₹${row.unit_cost} | Sold: ${row.quantity_sold} units`);
        });
        
        const sampleVendorsResult = await pool.query(`
            SELECT DISTINCT vendor_company, business_location, COUNT(*) as product_count
            FROM vendor_management
            GROUP BY vendor_company, business_location
            ORDER BY product_count DESC
            LIMIT 5
        `);
        
        console.log('\\n🏢 Top vendor companies:');
        sampleVendorsResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.vendor_company} (${row.business_location}) - ${row.product_count} products`);
        });
        
        // Test join query with new schema
        const joinTestResult = await pool.query(`
            SELECT p.product_name, p.unit_cost, v.vendor_company, v.business_location
            FROM product_catalog p
            JOIN vendor_management v ON p.item_id = v.item_id
            WHERE p.product_category = 'cosmetics'
            ORDER BY p.total_earnings DESC
            LIMIT 3
        `);
        
        console.log('\\n💄 Top cosmetics products with vendor info:');
        joinTestResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.product_name} - ₹${row.unit_cost}`);
            console.log(`     Vendor: ${row.vendor_company} (${row.business_location})`);
        });
        
        // Test backward compatibility view
        const compatibilityTestResult = await pool.query(`
            SELECT sku, product_type, price
            FROM products_sales_view
            LIMIT 3
        `);
        
        console.log('\\n🔄 Backward compatibility view test:');
        compatibilityTestResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. SKU: ${row.sku} | Type: ${row.product_type} | Price: ₹${row.price}`);
        });
        
    } catch (err) {
        console.error('❌ Error verifying new schema:', err.message);
        throw err;
    }
}

/**
 * Generate schema documentation
 */
async function generateDocumentation() {
    console.log('📚 Generating schema documentation...');
    
    const docContent = [
        '# Merchant_one Database Schema Evolution',
        `Generated on: ${new Date().toISOString()}`,
        '',
        '## Schema Changes Summary',
        '',
        '### Old Schema → New Schema Mapping',
        '',
        '**Table: products_sales → product_catalog**',
        '- sku → item_id (Product identifier)',
        '- product_type → product_category (Category classification)', 
        '- price → unit_cost (Cost per unit)',
        '- number_of_products_sold → quantity_sold (Units sold)',
        '- revenue_generated → total_earnings (Total revenue)',
        '',
        '**New columns in product_catalog:**',
        '- profit_margin (Profit percentage)',
        '- brand_name (Product brand)',
        '- product_name (Full product name)',
        '- launch_date (Product launch date)',
        '- created_timestamp (Record creation time)',
        '- updated_timestamp (Last update time)',
        '',
        '**Table: supply_chain_logistics → vendor_management**',
        '- sku → item_id (Product identifier)',
        '- supplier_name → vendor_company (Vendor company name)',
        '- location → business_location (Business address)',
        '- lead_time → delivery_time_days (Delivery time in days)',
        '- production_volumes → order_quantity (Order quantity)',
        '- manufacturing_costs → production_cost (Production cost)',
        '- shipping_carriers → logistics_partner (Logistics partner)',
        '- transportation_modes → shipping_method (Shipping method)',
        '- costs → logistics_fee (Logistics fee)',
        '',
        '**New columns in vendor_management:**',
        '- quality_rating (Vendor quality rating 1-5)',
        '- contract_start_date (Contract start date)',
        '- payment_terms (Payment terms like NET30)',
        '- created_timestamp (Record creation time)',
        '',
        '## Business Logic Preserved',
        '',
        '1. **Product Categories**: cosmetics, skincare, haircare, fragrance, wellness',
        '2. **Vendor Relationships**: Foreign key relationship maintained',
        '3. **Pricing Logic**: Unit cost and earnings calculations preserved',
        '4. **Location Data**: Indian cities maintained for realistic context',
        '5. **Quality Metrics**: Enhanced with rating and performance tracking',
        '',
        '## Backward Compatibility',
        '',
        'A view `products_sales_view` is created to maintain compatibility with existing queries.',
        '',
        '## Sample Queries for New Schema',
        '',
        '```sql',
        '-- Get top products by revenue',
        'SELECT brand_name, product_name, total_earnings',
        'FROM product_catalog',
        'ORDER BY total_earnings DESC',
        'LIMIT 10;',
        '',
        '-- Find vendors in specific location',
        'SELECT vendor_company, COUNT(*) as product_count',
        'FROM vendor_management',
        "WHERE business_location = 'Mumbai'",
        'GROUP BY vendor_company;',
        '',
        '-- Product performance with vendor info',
        'SELECT p.product_name, p.unit_cost, v.vendor_company, v.quality_rating',
        'FROM product_catalog p',
        'JOIN vendor_management v ON p.item_id = v.item_id',
        "WHERE p.product_category = 'cosmetics';",
        '```',
        '',
        `## Files Created`,
        `- Schema backup: ${backupFile}`,
        `- Documentation: ${path.join(__dirname, 'SCHEMA_EVOLUTION.md')}`,
        ''
    ];
    
    const docFile = path.join(__dirname, 'SCHEMA_EVOLUTION.md');
    await fs.writeFile(docFile, docContent.join('\\n'));
    console.log(`✅ Documentation created: ${docFile}`);
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Starting Merchant_one Schema Evolution...');
    console.log('='.repeat(60));
    
    try {
        // Test database connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        client.release();
        
        // Step 1: Create backup
        await createBackup();
        
        // Step 2: Create new schema
        await createNewSchema();
        
        // Step 3: Insert realistic data
        await insertRealisticData();
        
        // Step 4: Verify new schema
        await verifyNewSchema();
        
        // Step 5: Generate documentation
        await generateDocumentation();
        
        console.log('\\n' + '='.repeat(60));
        console.log('🎉 Schema evolution completed successfully!');
        console.log('\\n📋 Summary:');
        console.log('  ✅ Original schema backed up');
        console.log('  ✅ New evolved schema created');
        console.log('  ✅ 50 realistic data records inserted');
        console.log('  ✅ Backward compatibility view created');
        console.log('  ✅ Documentation generated');
        
        console.log('\\n🔄 Your Dynamic Schema Manager will automatically discover these changes!');
        console.log('\\n📝 Next steps:');
        console.log('  1. Restart your Dashboard server to pick up new schema');
        console.log('  2. Test intelligent search with new column names');
        console.log('  3. Verify backward compatibility with existing queries');
        
    } catch (err) {
        console.error('\\n💥 Schema evolution failed:', err.message);
        console.error('\\n🔧 Recovery options:');
        console.error('  1. Check the backup file for manual recovery');
        console.error('  2. Review error messages above');
        console.error('  3. Ensure database permissions are correct');
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\\n📡 Database connection closed');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\\n⏹️  Gracefully shutting down...');
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\\n⏹️  Gracefully shutting down...');
    await pool.end();
    process.exit(0);
});

// Run the schema evolution
if (require.main === module) {
    main();
}

module.exports = {
    createBackup,
    createNewSchema,
    generateRealisticData,
    insertRealisticData,
    verifyNewSchema
};