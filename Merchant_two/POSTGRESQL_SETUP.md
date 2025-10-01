# PostgreSQL Setup for Merchant Two Dashboard

## Database Setup Instructions

### 1. Create PostgreSQL Database

First, create the database for Merchant Two:

```sql
-- Connect to PostgreSQL as admin user
psql -U laxmangupta -d postgres

-- Create the database
CREATE DATABASE merchant_two_supply_chain;

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON DATABASE merchant_two_supply_chain TO laxmangupta;

-- Exit
\q
```

### 2. Run Database Migration

After creating the database, run the migration script to create tables and import data:

```bash
cd Merchant_two
node migrate_to_postgresql.js
```

## Database Schema

### Products Table
```sql
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
);
```

### Supply Chain Table
```sql
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
);
```

## API Endpoints

### Products Management
- `GET /api/products` - Get all products with supply chain data
- `POST /api/products` - Create a new product
- `PUT /api/products/:productId` - Update an existing product
- `DELETE /api/products/:productId` - Delete a product

### Analytics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/analytics` - Get detailed analytics

## Environment Variables

You can configure database connection using environment variables:

```bash
export DB_USER=laxmangupta
export DB_HOST=localhost
export DB_NAME=merchant_two_supply_chain
export DB_PASSWORD=
export DB_PORT=5432
```

## Database Connection

The application connects to PostgreSQL using these default settings:
- **Host**: localhost
- **Port**: 5432
- **Database**: merchant_two_supply_chain
- **User**: laxmangupta
- **Password**: (empty for local development)

## Data Migration

The migration script automatically:
1. Creates the database tables
2. Imports data from CSV files in the Dataset folder
3. Sets up indexes for better performance
4. Validates data integrity

## Troubleshooting

### Connection Issues
1. Ensure PostgreSQL is running: `brew services start postgresql`
2. Check if database exists: `psql -l`
3. Verify user permissions

### Migration Issues
1. Ensure CSV files exist in Dataset folder
2. Check file permissions
3. Verify data format in CSV files

### Performance Optimization
- Indexes are automatically created on frequently queried columns
- Database connections use connection pooling
- Queries are optimized for the dashboard requirements