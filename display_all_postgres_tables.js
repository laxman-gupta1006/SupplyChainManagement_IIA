#!/usr/bin/env node

/**
 * Display All PostgreSQL Tables Script
 * 
 * This script connects to PostgreSQL and displays:
 * - All databases
 * - All tables in each database
 * - Row counts for each table
 * - Column information
 */

const { Pool } = require('pg');

// PostgreSQL connection configuration
const config = {
    user: 'vatsaly',
    host: 'localhost',
    password: '', // No password needed (trust authentication)
    port: 5432,
};

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
};

/**
 * Get list of all databases
 */
async function getAllDatabases() {
    const pool = new Pool({ ...config, database: 'postgres' });
    
    try {
        const result = await pool.query(`
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false 
            AND datname NOT IN ('postgres')
            ORDER BY datname;
        `);
        
        return result.rows.map(row => row.datname);
    } catch (error) {
        console.error('Error fetching databases:', error.message);
        return [];
    } finally {
        await pool.end();
    }
}

/**
 * Get all tables in a database
 */
async function getTablesInDatabase(dbName) {
    const pool = new Pool({ ...config, database: dbName });
    
    try {
        const result = await pool.query(`
            SELECT 
                schemaname,
                tablename
            FROM pg_catalog.pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename;
        `);
        
        return result.rows;
    } catch (error) {
        console.error(`Error fetching tables from ${dbName}:`, error.message);
        return [];
    } finally {
        await pool.end();
    }
}

/**
 * Get row count for a table
 */
async function getRowCount(dbName, schemaName, tableName) {
    const pool = new Pool({ ...config, database: dbName });
    
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as count 
            FROM "${schemaName}"."${tableName}";
        `);
        
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error(`Error counting rows in ${tableName}:`, error.message);
        return 0;
    } finally {
        await pool.end();
    }
}

/**
 * Get columns for a table
 */
async function getTableColumns(dbName, schemaName, tableName) {
    const pool = new Pool({ ...config, database: dbName });
    
    try {
        const result = await pool.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = $1 
            AND table_name = $2
            ORDER BY ordinal_position;
        `, [schemaName, tableName]);
        
        return result.rows;
    } catch (error) {
        console.error(`Error fetching columns for ${tableName}:`, error.message);
        return [];
    } finally {
        await pool.end();
    }
}

/**
 * Display header
 */
function displayHeader() {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bright}${colors.cyan}PostgreSQL Database Explorer${colors.reset}`);
    console.log(`${colors.yellow}Host: localhost:5432 | User: vatsaly${colors.reset}`);
    console.log('='.repeat(80) + '\n');
}

/**
 * Display all tables with details
 */
async function displayAllTables(showColumns = false) {
    displayHeader();
    
    // Get all databases
    const databases = await getAllDatabases();
    
    if (databases.length === 0) {
        console.log('No databases found.');
        return;
    }
    
    console.log(`${colors.bright}Found ${databases.length} database(s)${colors.reset}\n`);
    
    let totalTables = 0;
    let totalRows = 0;
    
    // Iterate through each database
    for (const dbName of databases) {
        console.log(`${colors.bright}${colors.blue}📁 Database: ${dbName}${colors.reset}`);
        console.log('─'.repeat(80));
        
        const tables = await getTablesInDatabase(dbName);
        
        if (tables.length === 0) {
            console.log(`  ${colors.yellow}No tables found${colors.reset}\n`);
            continue;
        }
        
        // Iterate through each table
        for (const table of tables) {
            const { schemaname, tablename } = table;
            const rowCount = await getRowCount(dbName, schemaname, tablename);
            
            totalTables++;
            totalRows += rowCount;
            
            console.log(`\n  ${colors.green}📊 Table: ${schemaname}.${tablename}${colors.reset}`);
            console.log(`     Rows: ${colors.magenta}${rowCount.toLocaleString()}${colors.reset}`);
            
            // Show columns if requested
            if (showColumns) {
                const columns = await getTableColumns(dbName, schemaname, tablename);
                console.log(`     Columns: ${colors.cyan}${columns.length}${colors.reset}`);
                console.log('     ┌─────────────────────────────────────────────────────');
                
                columns.forEach((col, index) => {
                    const prefix = index === columns.length - 1 ? '└──' : '├──';
                    const type = col.character_maximum_length 
                        ? `${col.data_type}(${col.character_maximum_length})`
                        : col.data_type;
                    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                    
                    console.log(`     ${prefix} ${col.column_name}: ${type} ${nullable}`);
                });
            }
        }
        
        console.log(`\n  ${colors.bright}Total tables in ${dbName}: ${tables.length}${colors.reset}`);
        console.log('─'.repeat(80) + '\n');
    }
    
    // Display summary
    displaySummary(databases.length, totalTables, totalRows);
}

/**
 * Display summary statistics
 */
function displaySummary(dbCount, tableCount, rowCount) {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bright}${colors.cyan}📊 SUMMARY${colors.reset}`);
    console.log('='.repeat(80));
    console.log(`${colors.green}Total Databases:${colors.reset} ${dbCount}`);
    console.log(`${colors.green}Total Tables:${colors.reset} ${tableCount}`);
    console.log(`${colors.green}Total Rows:${colors.reset} ${rowCount.toLocaleString()}`);
    console.log('='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
    try {
        // Check command line arguments
        const showColumns = process.argv.includes('--columns') || process.argv.includes('-c');
        const helpFlag = process.argv.includes('--help') || process.argv.includes('-h');
        
        if (helpFlag) {
            console.log(`
${colors.bright}PostgreSQL Database Explorer${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node display_all_postgres_tables.js [options]

${colors.cyan}Options:${colors.reset}
  --columns, -c    Show column details for each table
  --help, -h       Show this help message

${colors.cyan}Examples:${colors.reset}
  node display_all_postgres_tables.js
  node display_all_postgres_tables.js --columns
            `);
            return;
        }
        
        await displayAllTables(showColumns);
        
    } catch (error) {
        console.error(`${colors.bright}Error:${colors.reset}`, error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { getAllDatabases, getTablesInDatabase, getRowCount, getTableColumns };
