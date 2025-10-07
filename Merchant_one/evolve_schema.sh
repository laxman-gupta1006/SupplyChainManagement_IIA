#!/bin/bash

# Schema Evolution Execution Script for Merchant_one
# This script safely evolves the database schema with backup

echo "🚀 Merchant_one Schema Evolution Script"
echo "======================================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

echo "⚠️  WARNING: This will modify your Merchant_one database schema!"
echo ""
echo "What this script will do:"
echo "1. 📦 Create a backup of your current schema and data"
echo "2. 🔄 Create new evolved schema with different column names"
echo "3. 📊 Insert 50 realistic sample records"
echo "4. ✅ Verify the new schema works correctly"
echo "5. 📚 Generate documentation"
echo ""

# Ask for confirmation
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled by user"
    exit 1
fi

echo ""
echo "🔧 Starting schema evolution..."
echo ""

# Check PostgreSQL connection
echo "🔍 Testing PostgreSQL connection..."
if ! node -e "
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.MERCHANT1_USER || 'laxmangupta',
    host: process.env.MERCHANT1_HOST || 'localhost', 
    database: process.env.MERCHANT1_DB || 'supply_chain_management',
    password: process.env.MERCHANT1_PASSWORD || '',
    port: process.env.MERCHANT1_PORT || 5432,
});
pool.connect().then(client => {
    console.log('✅ PostgreSQL connection successful');
    client.release();
    pool.end();
}).catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
});
" 2>/dev/null; then
    echo "❌ Could not connect to PostgreSQL database"
    echo "Please check:"
    echo "  - PostgreSQL server is running"
    echo "  - Database credentials are correct"
    echo "  - Database 'supply_chain_management' exists"
    exit 1
fi

echo ""
echo "✅ Connection test passed!"
echo ""
echo "🚀 Executing schema evolution..."
echo ""

# Run the schema evolution script
node schema_evolution.js

# Check if script was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Schema evolution completed successfully!"
    echo ""
    echo "📋 What was changed:"
    echo "  • products_sales → product_catalog (with new meaningful column names)"
    echo "  • supply_chain_logistics → vendor_management (with enhanced fields)"
    echo "  • Added 50 realistic sample records"
    echo "  • Created backward compatibility view"
    echo "  • Generated comprehensive backup"
    echo ""
    echo "🔄 Next Steps:"
    echo "1. Restart your Dashboard server to discover new schema"
    echo "2. Test queries with new column names like 'product_category', 'vendor_company'"
    echo "3. Your Dynamic Schema Manager will automatically adapt!"
    echo ""
    echo "📂 Files created:"
    echo "  • schema_backups/merchant1_backup_*.sql (backup file)"
    echo "  • SCHEMA_EVOLUTION.md (documentation)"
    echo ""
    echo "🧪 Test the new schema:"
    echo "SELECT product_name, brand_name, unit_cost FROM product_catalog LIMIT 5;"
    echo ""
else
    echo ""
    echo "❌ Schema evolution failed!"
    echo "Check the error messages above and try again."
    echo "Your original data is safe in the backup files."
    exit 1
fi