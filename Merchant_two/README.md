# Merchant Two - Supply Chain Management Dashboard

## Overview
This is an advanced supply chain management dashboard specifically designed for Merchant Two. It provides comprehensive analytics and management capabilities for product data and supply chain operations using PostgreSQL database.

## Features

### 📊 Dashboard Analytics
- **Real-time Statistics**: Total products, revenue, average pricing, and category breakdown
- **Full CRUD Operations**: Create, Read, Update, Delete products with complete validation
- **Supply Chain Tracking**: Vendor performance, logistics, and quality metrics
- **Advanced Analytics**: Profit margins, sustainability indices, and operational efficiency

### 🏢 Merchant Two Specific Features
- **Enhanced Product Data**: 
  - Product ID, Category, Unit Price, Units Sold
  - Sales Revenue, Profit Margin, Stock Level
  - Product Status, Seasonal Demand tracking

- **Advanced Supply Chain Analytics**:
  - Vendor performance with quality scores
  - Processing days and output quantity tracking
  - Production expenses and freight charges
  - Sustainability index monitoring
  - Warehouse zone management
  - Reorder point optimization

### 🎨 Dashboard Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Search**: Filter by Product ID, category, vendor, location
- **Interactive Editing**: In-place editing with comprehensive forms
- **Product Creation**: Add new products with full supply chain data
- **Visual Indicators**: Color-coded profit margins, quality scores, and status
- **Data Validation**: Form validation for all input fields
- **PostgreSQL Backend**: Persistent, reliable data storage

## Data Structure

### Products Table
- product_id (Primary Key), category, unit_price, units_sold
- sales_revenue, profit_margin, stock_level
- product_status, seasonal_demand
- created_at, updated_at timestamps

### Supply Chain Table
- product_id (Foreign Key), vendor_name, facility_location
- processing_days, output_quantity, production_expenses
- logistics_provider, shipping_method, freight_charges
- quality_score, reorder_point, warehouse_zone
- sustainability_index, created_at, updated_at

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- npm (Node Package Manager)

### Installation Steps

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   ```

2. **Create Database**
   ```bash
   psql -U laxmangupta -d postgres
   CREATE DATABASE merchant_two_supply_chain;
   \q
   ```

3. **Navigate to Merchant_two directory**
   ```bash
   cd Merchant_two
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run database migration**
   ```bash
   node migrate_to_postgresql.js
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```
   or for production:
   ```bash
   npm start
   ```

7. **Access the dashboard**
   - Local: http://localhost:3001
   - Network: http://[your-ip]:3001

## Port Configuration
- **Default Port**: 3001 (to avoid conflict with Merchant_one on port 3000)
- The application automatically detects your network IP for external access

## API Endpoints

### Products Management
- `GET /api/products` - Retrieve all products with supply chain data
- `POST /api/products` - Create a new product
- `PUT /api/products/:productId` - Update a specific product
- `DELETE /api/products/:productId` - Delete a product

### Analytics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/analytics` - Get detailed analytics data

## CRUD Operations

### Create (POST)
- Add new products through the dashboard interface
- Complete form validation for all required fields
- Automatic creation of related supply chain records
- Unique constraint validation on Product ID

### Read (GET)
- View all products with joined supply chain data
- Real-time search and filtering capabilities
- Comprehensive analytics and statistics

### Update (PUT)
- Edit existing products through modal interface
- Update both product and supply chain information
- Validation and error handling for all updates

### Delete (DELETE)
- Remove products with confirmation dialog
- Cascade deletion of related supply chain records
- Proper error handling and user feedback

## Data Management

### PostgreSQL Integration
- Persistent data storage with ACID compliance
- Optimized queries with proper indexing
- Connection pooling for better performance
- Automatic data migration from CSV files

### Database Features
- Foreign key constraints for data integrity
- Indexes on frequently queried columns
- Timestamp tracking for audit trails
- Transaction support for data consistency

## Dashboard Sections

### 1. Statistics Overview
- Total Products Count
- Total Revenue Generated
- Average Product Price
- Number of Product Categories

### 2. Data Management
- **Search & Filter**: Real-time search across all data fields
- **Product Table**: Comprehensive view of all products and supply chain data
- **Add New Product**: Create products with complete supply chain information
- **Edit Modal**: Detailed form for updating product and supply chain information

### 3. Visual Indicators
- **Profit Status**: Green (positive) / Red (negative)
- **Product Status**: Active (green) / Inactive (red)
- **Quality Scores**: High (green) / Medium (yellow) / Low (red)

## Differences from Merchant One

1. **Database**: Uses PostgreSQL instead of in-memory storage
2. **CRUD Operations**: Full Create, Update, Delete functionality
3. **Data Persistence**: All changes are permanently stored
4. **Enhanced Schema**: Additional fields like sustainability indices
5. **Port**: Runs on port 3001 to avoid conflicts
6. **Color Scheme**: Red-themed UI to distinguish from Merchant One's blue theme
7. **Performance**: Database optimization with indexing and connection pooling

## Network Access
The application is configured to accept connections from other devices on your network:
- Automatically detects and displays your network IP
- Other devices can access using: `http://[your-network-ip]:3001`

## Troubleshooting

### Common Issues
1. **PostgreSQL Connection**: Ensure PostgreSQL is running and database exists
2. **Port Already in Use**: Change PORT in server.js or use different port
3. **Migration Failures**: Check CSV file formats and database permissions
4. **Network Access Issues**: Check firewall settings

### Database Issues
- Verify PostgreSQL service is running: `brew services status postgresql`
- Check database exists: `psql -l`
- Ensure proper user permissions
- Validate CSV data format before migration

## Development

### File Structure
```
Merchant_two/
├── server.js                    # Main server application
├── package.json                 # Dependencies and scripts
├── migrate_to_postgresql.js     # Database migration script
├── POSTGRESQL_SETUP.md         # Database setup guide
├── views/
│   └── index.ejs               # Dashboard HTML template
├── Dataset/
│   ├── product sales-2.csv
│   └── supply chain -2.csv
└── README.md                   # This file
```

### Database Schema
- See `POSTGRESQL_SETUP.md` for detailed database schema
- Tables: `products` and `supply_chain`
- Proper foreign key relationships
- Optimized indexes for performance

### Customization
- Modify `server.js` for API changes
- Update `views/index.ejs` for UI modifications
- Add new database fields by updating migration script
- Extend CRUD operations as needed

## Support
This dashboard is specifically designed for Merchant Two's supply chain operations and runs independently from Merchant One's dashboard with complete PostgreSQL integration for robust data management.