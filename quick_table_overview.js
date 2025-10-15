#!/usr/bin/env node

/**
 * Quick PostgreSQL Table Overview
 * Simple script to display all tables across all databases
 */

const { Pool } = require('pg');

async function quickOverview() {
    const mainPool = new Pool({
        user: 'vatsaly',
        host: 'localhost',
        password: '',
        port: 5432,
        database: 'postgres'
    });

    try {
        // Get all databases
        const dbResult = await mainPool.query(`
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false 
            AND datname NOT IN ('postgres')
            ORDER BY datname;
        `);
        
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║       PostgreSQL Tables - Quick Overview              ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        for (const db of dbResult.rows) {
            const dbName = db.datname;
            const dbPool = new Pool({
                user: 'vatsaly',
                host: 'localhost',
                password: '',
                port: 5432,
                database: dbName
            });

            // Get tables
            const tableResult = await dbPool.query(`
                SELECT tablename 
                FROM pg_catalog.pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename;
            `);

            console.log(`📦 ${dbName}`);
            
            for (const table of tableResult.rows) {
                // Get row count
                const countResult = await dbPool.query(`SELECT COUNT(*) FROM ${table.tablename}`);
                const count = countResult.rows[0].count;
                
                console.log(`   ├─ ${table.tablename.padEnd(30)} (${count} rows)`);
            }
            
            console.log('');
            await dbPool.end();
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mainPool.end();
    }
}

quickOverview();
