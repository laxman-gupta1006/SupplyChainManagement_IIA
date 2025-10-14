#!/bin/bash

# PostgreSQL Network Connection Test Script
# This script tests PostgreSQL network accessibility from external devices

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   PostgreSQL Network Connection Test                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
HOST="192.168.42.55"
PORT="5432"
USER="vatsaly"
DB1="supply_chain_management"
DB2="merchant_two_supply_chain"

echo "📋 Test Configuration:"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   User: $USER"
echo "   Database 1: $DB1"
echo "   Database 2: $DB2"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Test 1: Check if PostgreSQL is listening
echo "🔍 Test 1: Checking if PostgreSQL is listening on network..."
if lsof -nP -iTCP:$PORT -sTCP:LISTEN | grep -q postgres; then
    echo "   ✅ PostgreSQL is listening on port $PORT"
    lsof -nP -iTCP:$PORT -sTCP:LISTEN | grep postgres
else
    echo "   ❌ PostgreSQL is NOT listening on port $PORT"
    exit 1
fi
echo ""

# Test 2: Test connection to postgres database
echo "🔍 Test 2: Testing connection to postgres database..."
if psql -h $HOST -p $PORT -U $USER -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "   ✅ Successfully connected to postgres database"
    psql -h $HOST -p $PORT -U $USER -d postgres -c "SELECT current_database() as database, current_user as user, inet_server_addr() as server_ip;"
else
    echo "   ❌ Failed to connect to postgres database"
    exit 1
fi
echo ""

# Test 3: Test Merchant One database
echo "🔍 Test 3: Testing Merchant One database ($DB1)..."
if psql -h $HOST -p $PORT -U $USER -d $DB1 -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Successfully connected to $DB1"
    echo ""
    echo "   📊 Database Statistics:"
    psql -h $HOST -p $PORT -U $USER -d $DB1 << EOF
SELECT 
    'product_catalog' as table_name,
    COUNT(*) as row_count
FROM product_catalog
UNION ALL
SELECT 
    'vendor_management' as table_name,
    COUNT(*) as row_count
FROM vendor_management;
EOF
else
    echo "   ❌ Failed to connect to $DB1"
fi
echo ""

# Test 4: Test Merchant Two database
echo "🔍 Test 4: Testing Merchant Two database ($DB2)..."
if psql -h $HOST -p $PORT -U $USER -d $DB2 -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Successfully connected to $DB2"
    echo ""
    echo "   📊 Database Statistics:"
    psql -h $HOST -p $PORT -U $USER -d $DB2 << EOF
SELECT 
    'products' as table_name,
    COUNT(*) as row_count
FROM products
UNION ALL
SELECT 
    'supply_chain' as table_name,
    COUNT(*) as row_count
FROM supply_chain;
EOF
else
    echo "   ❌ Failed to connect to $DB2"
fi
echo ""

# Test 5: Sample data query
echo "🔍 Test 5: Running sample queries..."
echo ""
echo "   📦 Top 5 Products from Merchant One:"
psql -h $HOST -p $PORT -U $USER -d $DB1 << EOF
SELECT 
    product_id,
    product_name,
    brand_name,
    unit_price,
    profit_margin
FROM product_catalog
ORDER BY profit_margin DESC
LIMIT 5;
EOF

echo ""
echo "   📦 Top 5 Products from Merchant Two:"
psql -h $HOST -p $PORT -U $USER -d $DB2 << EOF
SELECT 
    product_id,
    product_name,
    price,
    quantity_sold,
    revenue
FROM products
ORDER BY revenue DESC
LIMIT 5;
EOF

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ All network connection tests completed successfully!"
echo ""
echo "📱 Connection String for External Devices:"
echo "   postgresql://$USER:yourpassword@$HOST:$PORT/$DB1"
echo ""
echo "🌐 You can now connect from any device on the network using:"
echo "   - psql: psql -h $HOST -p $PORT -U $USER -d $DB1"
echo "   - DBeaver: Host=$HOST, Port=$PORT, User=$USER"
echo "   - pgAdmin: Server=$HOST, Port=$PORT, User=$USER"
echo ""
