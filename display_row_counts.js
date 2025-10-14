#!/usr/bin/env node

const { Pool } = require('pg');

const databases = [
    {
        name: 'Merchant_one',
        config: {
            user: 'laxmangupta',
            host: 'localhost',
            database: 'supply_chain_management',
            password: '',
            port: 5432,
        }
    },
    {
        name: 'Merchant_two',
        config: {
            user: 'vatsaly',
            host: 'localhost',
            database: 'merchant_two_supply_chain',
            password: '',
            port: 5432,
        }
    }
];

async function displayRowCounts() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ROW COUNTS FOR ALL TABLES IN ALL DATABASES');
    console.log('='.repeat(80) + '\n');

    let grandTotal = 0;

    for (const db of databases) {
        const pool = new Pool(db.config);
        
        try {
            // Get all tables
            const tablesQuery = `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `;
            
            const tablesResult = await pool.query(tablesQuery);
            const tables = tablesResult.rows.map(row => row.table_name);
            
            console.log(`🗄️  Database: ${db.config.database} (${db.name})`);
            console.log('─'.repeat(80));
            
            if (tables.length === 0) {
                console.log('   No tables found\n');
                continue;
            }
            
            let dbTotal = 0;
            
            for (const tableName of tables) {
                const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
                const countResult = await pool.query(countQuery);
                const rowCount = parseInt(countResult.rows[0].count);
                
                console.log(`   📋 ${tableName.padEnd(30)} : ${rowCount.toLocaleString().padStart(10)} rows`);
                
                dbTotal += rowCount;
            }
            
            console.log('─'.repeat(80));
            console.log(`   ✅ TOTAL for ${db.name.padEnd(20)} : ${dbTotal.toLocaleString().padStart(10)} rows`);
            console.log('\n');
            
            grandTotal += dbTotal;
            
        } catch (err) {
            console.error(`   ❌ Error accessing ${db.name}:`, err.message);
            console.log('\n');
        } finally {
            await pool.end();
        }
    }
    
    console.log('='.repeat(80));
    console.log(`🎯 GRAND TOTAL ACROSS ALL DATABASES: ${grandTotal.toLocaleString()} rows`);
    console.log('='.repeat(80) + '\n');
}

displayRowCounts().catch(console.error);
