#!/usr/bin/env node

const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// PostgreSQL connection
const pool = new Pool({
    user: 'laxmangupta',
    host: 'localhost',
    database: 'supply_chain_management',
    password: '',
    port: 5432,
});

// SQLite connection
const sqliteDbPath = path.join(__dirname, 'supply_chain_management.db');
const sqliteDb = new sqlite3.Database(sqliteDbPath);

async function createTables() {
    const client = await pool.connect();
    
    try {
        console.log('Creating PostgreSQL tables...');
        
        // Drop tables if they exist
        await client.query('DROP TABLE IF EXISTS supply_chain_logistics CASCADE');
        await client.query('DROP TABLE IF EXISTS products_sales CASCADE');
        
        // Create products_sales table
        const createProductsTable = `
            CREATE TABLE products_sales (
                sku VARCHAR(20) PRIMARY KEY,
                product_type VARCHAR(50) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                number_of_products_sold INTEGER NOT NULL,
                revenue_generated DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create supply_chain_logistics table
        const createLogisticsTable = `
            CREATE TABLE supply_chain_logistics (
                sku VARCHAR(20) PRIMARY KEY,
                supplier_name VARCHAR(100) NOT NULL,
                location VARCHAR(100) NOT NULL,
                lead_time INTEGER NOT NULL,
                production_volumes INTEGER NOT NULL,
                manufacturing_costs DECIMAL(10, 2) NOT NULL,
                shipping_carriers VARCHAR(100) NOT NULL,
                transportation_modes VARCHAR(50) NOT NULL,
                costs DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sku) REFERENCES products_sales(sku) ON DELETE CASCADE
            )
        `;
        
        await client.query(createProductsTable);
        await client.query(createLogisticsTable);
        
        // Create indexes for better performance
        await client.query('CREATE INDEX idx_products_type ON products_sales(product_type)');
        await client.query('CREATE INDEX idx_logistics_supplier ON supply_chain_logistics(supplier_name)');
        await client.query('CREATE INDEX idx_logistics_location ON supply_chain_logistics(location)');
        await client.query('CREATE INDEX idx_logistics_carrier ON supply_chain_logistics(shipping_carriers)');
        await client.query('CREATE INDEX idx_logistics_transport ON supply_chain_logistics(transportation_modes)');
        
        console.log('✅ PostgreSQL tables created successfully');
        
    } catch (err) {
        console.error('❌ Error creating tables:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

async function migrateData() {
    console.log('Migrating data from SQLite to PostgreSQL...');
    
    return new Promise((resolve, reject) => {
        // Get data from SQLite
        sqliteDb.all('SELECT * FROM products_sales', [], async (err, products) => {
            if (err) {
                reject(err);
                return;
            }
            
            sqliteDb.all('SELECT * FROM supply_chain_logistics', [], async (err, logistics) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const client = await pool.connect();
                
                try {
                    await client.query('BEGIN');
                    
                    // Insert products
                    console.log(`Inserting ${products.length} products...`);
                    for (const product of products) {
                        const insertProductQuery = `
                            INSERT INTO products_sales (sku, product_type, price, number_of_products_sold, revenue_generated)
                            VALUES ($1, $2, $3, $4, $5)
                        `;
                        await client.query(insertProductQuery, [
                            product.sku,
                            product.product_type,
                            product.price,
                            product.number_of_products_sold,
                            product.revenue_generated
                        ]);
                    }
                    
                    // Insert logistics
                    console.log(`Inserting ${logistics.length} logistics records...`);
                    for (const logistic of logistics) {
                        const insertLogisticsQuery = `
                            INSERT INTO supply_chain_logistics (
                                sku, supplier_name, location, lead_time, production_volumes,
                                manufacturing_costs, shipping_carriers, transportation_modes, costs
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        `;
                        await client.query(insertLogisticsQuery, [
                            logistic.sku,
                            logistic.supplier_name,
                            logistic.location,
                            logistic.lead_time,
                            logistic.production_volumes,
                            logistic.manufacturing_costs,
                            logistic.shipping_carriers,
                            logistic.transportation_modes,
                            logistic.costs
                        ]);
                    }
                    
                    await client.query('COMMIT');
                    console.log('✅ Data migration completed successfully');
                    resolve();
                    
                } catch (err) {
                    await client.query('ROLLBACK');
                    console.error('❌ Error migrating data:', err.message);
                    reject(err);
                } finally {
                    client.release();
                }
            });
        });
    });
}

async function verifyMigration() {
    console.log('Verifying data migration...');
    
    try {
        const productsResult = await pool.query('SELECT COUNT(*) FROM products_sales');
        const logisticsResult = await pool.query('SELECT COUNT(*) FROM supply_chain_logistics');
        
        console.log(`✅ Products in PostgreSQL: ${productsResult.rows[0].count}`);
        console.log(`✅ Logistics records in PostgreSQL: ${logisticsResult.rows[0].count}`);
        
        // Test a sample query
        const sampleResult = await pool.query(`
            SELECT p.sku, p.product_type, p.price, l.supplier_name
            FROM products_sales p
            JOIN supply_chain_logistics l ON p.sku = l.sku
            LIMIT 3
        `);
        
        console.log('\\n📊 Sample data from PostgreSQL:');
        sampleResult.rows.forEach(row => {
            console.log(`  ${row.sku}: ${row.product_type} - $${row.price} (${row.supplier_name})`);
        });
        
    } catch (err) {
        console.error('❌ Error verifying migration:', err.message);
        throw err;
    }
}

async function main() {
    try {
        console.log('🚀 Starting PostgreSQL migration...');
        
        // Test PostgreSQL connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        client.release();
        
        // Create tables
        await createTables();
        
        // Migrate data
        await migrateData();
        
        // Verify migration
        await verifyMigration();
        
        console.log('\\n🎉 Migration completed successfully!');
        console.log('\\n📝 Next steps:');
        console.log('1. Start your Express app: npm start');
        console.log('2. Test the application at http://localhost:3000');
        console.log('3. Connect directly to PostgreSQL from other machines');
        
    } catch (err) {
        console.error('\\n💥 Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
        sqliteDb.close();
    }
}

// Run migration
main();