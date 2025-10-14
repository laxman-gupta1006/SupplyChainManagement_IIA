#!/usr/bin/env node

/**
 * Export All PostgreSQL Databases to CSV
 * 
 * This script:
 * 1. Connects to all merchant databases
 * 2. Discovers all tables in each database
 * 3. Exports each table to a separate CSV file
 * 4. Organizes CSV files by database/merchant
 * 5. Creates a summary report
 * 
 * SAFE: Does not delete or modify any data - READ ONLY
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const { Parser } = require('json2csv');

// Database configurations
const databases = [
    {
        name: 'Merchant_one',
        config: {
            user: process.env.MERCHANT1_USER || 'laxmangupta',
            host: process.env.MERCHANT1_HOST || 'localhost',
            database: process.env.MERCHANT1_DB || 'supply_chain_management',
            password: process.env.MERCHANT1_PASSWORD || '',
            port: process.env.MERCHANT1_PORT || 5432,
        }
    },
    {
        name: 'Merchant_two',
        config: {
            user: process.env.MERCHANT2_USER || 'vatsaly',
            host: process.env.MERCHANT2_HOST || 'localhost',
            database: process.env.MERCHANT2_DB || 'merchant_two_supply_chain',
            password: process.env.MERCHANT2_PASSWORD || '',
            port: process.env.MERCHANT2_PORT || 5432,
        }
    }
];

// Export directory
const exportDir = path.join(__dirname, 'database_exports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

/**
 * Get all tables in a database
 */
async function getTables(pool) {
    const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => row.table_name);
}

/**
 * Get table schema information
 */
async function getTableSchema(pool, tableName) {
    const query = `
        SELECT 
            column_name, 
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
    `;
    
    const result = await pool.query(query, [tableName]);
    return result.rows;
}

/**
 * Export a single table to CSV
 */
async function exportTableToCSV(pool, tableName, outputPath, dbName) {
    try {
        // Get all data from table
        const dataQuery = `SELECT * FROM ${tableName}`;
        const result = await pool.query(dataQuery);
        
        if (result.rows.length === 0) {
            console.log(`   ⚠️  Table ${tableName} is empty - creating empty CSV with headers`);
            
            // Get column names from schema
            const schemaResult = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [tableName]);
            
            const headers = schemaResult.rows.map(r => r.column_name).join(',');
            await fs.writeFile(outputPath, headers + '\n');
            
            return { tableName, rows: 0, columns: schemaResult.rows.length };
        }
        
        // Convert to CSV
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(result.rows);
        
        // Write to file
        await fs.writeFile(outputPath, csv);
        
        console.log(`   ✅ Exported ${tableName}: ${result.rows.length} rows → ${path.basename(outputPath)}`);
        
        return {
            tableName,
            rows: result.rows.length,
            columns: Object.keys(result.rows[0]).length
        };
        
    } catch (err) {
        console.error(`   ❌ Error exporting ${tableName}:`, err.message);
        throw err;
    }
}

/**
 * Export all tables from a database
 */
async function exportDatabase(dbConfig) {
    const pool = new Pool(dbConfig.config);
    const dbExportDir = path.join(exportDir, `${dbConfig.name}_${timestamp}`);
    
    console.log(`\n📦 Exporting database: ${dbConfig.config.database} (${dbConfig.name})`);
    console.log(`   Connection: ${dbConfig.config.user}@${dbConfig.config.host}:${dbConfig.config.port}`);
    
    try {
        // Test connection
        const client = await pool.connect();
        client.release();
        console.log(`   ✅ Connected successfully`);
        
        // Create export directory
        await fs.mkdir(dbExportDir, { recursive: true });
        
        // Get all tables
        const tables = await getTables(pool);
        console.log(`   📋 Found ${tables.length} tables: ${tables.join(', ')}`);
        
        if (tables.length === 0) {
            console.log(`   ⚠️  No tables found in database`);
            return {
                database: dbConfig.name,
                dbName: dbConfig.config.database,
                tables: [],
                totalRows: 0
            };
        }
        
        const exportedTables = [];
        let totalRows = 0;
        
        // Export each table
        for (const tableName of tables) {
            const csvFileName = `${tableName}.csv`;
            const csvFilePath = path.join(dbExportDir, csvFileName);
            
            // Get table schema
            const schema = await getTableSchema(pool, tableName);
            
            // Export table data
            const exportInfo = await exportTableToCSV(pool, tableName, csvFilePath, dbConfig.name);
            
            exportedTables.push({
                ...exportInfo,
                schema: schema,
                filePath: csvFilePath
            });
            
            totalRows += exportInfo.rows;
        }
        
        // Create schema documentation
        const schemaDocPath = path.join(dbExportDir, '_SCHEMA_INFO.md');
        await createSchemaDocumentation(dbConfig, exportedTables, schemaDocPath);
        
        console.log(`   📊 Total: ${exportedTables.length} tables, ${totalRows} rows exported`);
        console.log(`   📁 Saved to: ${dbExportDir}`);
        
        return {
            database: dbConfig.name,
            dbName: dbConfig.config.database,
            tables: exportedTables,
            totalRows: totalRows,
            exportPath: dbExportDir
        };
        
    } catch (err) {
        console.error(`   ❌ Error exporting database ${dbConfig.name}:`, err.message);
        throw err;
    } finally {
        await pool.end();
    }
}

/**
 * Create schema documentation for a database
 */
async function createSchemaDocumentation(dbConfig, exportedTables, outputPath) {
    const doc = [];
    
    doc.push(`# Database Schema: ${dbConfig.config.database}`);
    doc.push(`**Merchant:** ${dbConfig.name}`);
    doc.push(`**Exported:** ${new Date().toISOString()}`);
    doc.push(`**Connection:** ${dbConfig.config.user}@${dbConfig.config.host}:${dbConfig.config.port}`);
    doc.push('');
    doc.push('---');
    doc.push('');
    
    for (const table of exportedTables) {
        doc.push(`## Table: \`${table.tableName}\``);
        doc.push('');
        doc.push(`**Rows:** ${table.rows} | **Columns:** ${table.columns}`);
        doc.push(`**CSV File:** \`${path.basename(table.filePath)}\``);
        doc.push('');
        
        if (table.schema && table.schema.length > 0) {
            doc.push('### Schema:');
            doc.push('');
            doc.push('| Column Name | Data Type | Nullable | Default |');
            doc.push('|-------------|-----------|----------|---------|');
            
            for (const col of table.schema) {
                const nullable = col.is_nullable === 'YES' ? 'Yes' : 'No';
                const defaultVal = col.column_default || '-';
                doc.push(`| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} |`);
            }
            
            doc.push('');
        }
        
        doc.push('---');
        doc.push('');
    }
    
    await fs.writeFile(outputPath, doc.join('\n'));
    console.log(`   📚 Schema documentation created: ${path.basename(outputPath)}`);
}

/**
 * Create master summary report
 */
async function createSummaryReport(allExports) {
    const summaryPath = path.join(exportDir, `EXPORT_SUMMARY_${timestamp}.md`);
    
    const doc = [];
    
    doc.push('# PostgreSQL Database Export Summary');
    doc.push(`**Date:** ${new Date().toISOString()}`);
    doc.push(`**Export Directory:** \`${exportDir}\``);
    doc.push('');
    doc.push('---');
    doc.push('');
    
    let grandTotalTables = 0;
    let grandTotalRows = 0;
    
    for (const exportInfo of allExports) {
        doc.push(`## ${exportInfo.database}`);
        doc.push('');
        doc.push(`**Database Name:** \`${exportInfo.dbName}\``);
        doc.push(`**Tables Exported:** ${exportInfo.tables.length}`);
        doc.push(`**Total Rows:** ${exportInfo.totalRows.toLocaleString()}`);
        doc.push(`**Export Location:** \`${path.basename(exportInfo.exportPath)}\``);
        doc.push('');
        
        if (exportInfo.tables.length > 0) {
            doc.push('### Tables:');
            doc.push('');
            doc.push('| Table Name | Rows | Columns | CSV File |');
            doc.push('|------------|------|---------|----------|');
            
            for (const table of exportInfo.tables) {
                const csvFile = path.basename(table.filePath);
                doc.push(`| ${table.tableName} | ${table.rows.toLocaleString()} | ${table.columns} | \`${csvFile}\` |`);
            }
            
            doc.push('');
        }
        
        doc.push('---');
        doc.push('');
        
        grandTotalTables += exportInfo.tables.length;
        grandTotalRows += exportInfo.totalRows;
    }
    
    doc.push('## Grand Total');
    doc.push('');
    doc.push(`- **Databases Exported:** ${allExports.length}`);
    doc.push(`- **Total Tables:** ${grandTotalTables}`);
    doc.push(`- **Total Rows:** ${grandTotalRows.toLocaleString()}`);
    doc.push('');
    doc.push('---');
    doc.push('');
    doc.push('## File Structure');
    doc.push('');
    doc.push('```');
    doc.push('database_exports/');
    
    for (const exportInfo of allExports) {
        const dirName = path.basename(exportInfo.exportPath);
        doc.push(`├── ${dirName}/`);
        doc.push(`│   ├── _SCHEMA_INFO.md`);
        
        for (const table of exportInfo.tables) {
            const isLast = table === exportInfo.tables[exportInfo.tables.length - 1];
            const prefix = isLast ? '│   └──' : '│   ├──';
            doc.push(`${prefix} ${path.basename(table.filePath)}`);
        }
    }
    
    doc.push(`└── EXPORT_SUMMARY_${timestamp}.md`);
    doc.push('```');
    doc.push('');
    doc.push('---');
    doc.push('');
    doc.push('**✅ Export completed successfully!**');
    doc.push('');
    doc.push('*All data has been safely exported. Original databases remain untouched.*');
    
    await fs.writeFile(summaryPath, doc.join('\n'));
    
    console.log(`\n📋 Summary report created: ${summaryPath}`);
    
    return summaryPath;
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 PostgreSQL Database Export Tool');
    console.log('=' .repeat(70));
    console.log('📌 READ ONLY - No databases will be modified or deleted');
    console.log('=' .repeat(70));
    
    try {
        // Create main export directory
        await fs.mkdir(exportDir, { recursive: true });
        console.log(`\n📁 Export directory: ${exportDir}`);
        
        const allExports = [];
        
        // Export each database
        for (const db of databases) {
            const exportInfo = await exportDatabase(db);
            allExports.push(exportInfo);
        }
        
        // Create summary report
        const summaryPath = await createSummaryReport(allExports);
        
        console.log('\n' + '='.repeat(70));
        console.log('🎉 All databases exported successfully!');
        console.log('='.repeat(70));
        
        console.log('\n📊 Export Statistics:');
        console.log(`   • Databases: ${allExports.length}`);
        console.log(`   • Total Tables: ${allExports.reduce((sum, e) => sum + e.tables.length, 0)}`);
        console.log(`   • Total Rows: ${allExports.reduce((sum, e) => sum + e.totalRows, 0).toLocaleString()}`);
        
        console.log('\n📁 Exported Files:');
        for (const exportInfo of allExports) {
            console.log(`   • ${exportInfo.database}: ${exportInfo.exportPath}`);
        }
        
        console.log(`\n📋 Summary Report: ${summaryPath}`);
        
        console.log('\n✅ All data has been safely exported to CSV files');
        console.log('✅ Original databases remain completely untouched\n');
        
    } catch (err) {
        console.error('\n💥 Export failed:', err.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Check database connection settings');
        console.error('   2. Ensure you have read permissions on all databases');
        console.error('   3. Verify PostgreSQL is running');
        console.error('   4. Check if json2csv is installed: npm install json2csv');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  Export cancelled by user');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⏹️  Export terminated');
    process.exit(0);
});

// Run the export
if (require.main === module) {
    main();
}

module.exports = {
    exportDatabase,
    getTables,
    exportTableToCSV
};
