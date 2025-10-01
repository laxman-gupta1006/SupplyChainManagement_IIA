# 🔗 Integrated Supply Chain Dashboard

A **federated database query system** that connects two PostgreSQL databases (Merchant_one and Merchant_two) with AI-powered natural language query capabilities using Google's Gemini AI.

![Dashboard](https://img.shields.io/badge/Dashboard-Federated-blueviolet)
![AI Powered](https://img.shields.io/badge/AI-Gemini%20Powered-orange)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

## ✨ Features

- 🤖 **AI-Powered Queries**: Convert natural language to SQL using Gemini AI
- 🔀 **Federated Database Access**: Query two separate PostgreSQL databases simultaneously
- 🧠 **Schema-Aware**: Automatically translates between different database schemas
- 📊 **Real-time Statistics**: Combined analytics from both merchant databases
- 🎨 **Modern UI**: Beautiful, responsive dashboard with dark theme
- ⚡ **Fast Results**: Parallel query execution for optimal performance
- 🔍 **Smart Routing**: Intelligently determines which database(s) to query

## 🏗️ Architecture

### Database Configuration

#### **Merchant_one Database** (`supply_chain_management`)
- **User**: `laxmangupta`
- **Tables**:
  - `products_sales`: SKU, product_type, price, number_of_products_sold, revenue_generated
  - `supply_chain_logistics`: SKU, supplier_name, location, lead_time, production_volumes, manufacturing_costs, shipping_carriers, transportation_modes, costs

#### **Merchant_two Database** (`merchant_two_supply_chain`)
- **User**: `vatsaly`
- **Tables**:
  - `products`: product_id, category, unit_price, units_sold, sales_revenue, profit_margin, stock_level, product_status, seasonal_demand
  - `supply_chain`: product_id, vendor_name, facility_location, processing_days, output_quantity, production_expenses, logistics_provider, shipping_method, freight_charges, quality_score, reorder_point, warehouse_zone, sustainability_index

### Schema Translation

The system automatically translates between different column names:

| Merchant_one | Merchant_two |
|--------------|--------------|
| `sku` | `product_id` |
| `product_type` | `category` |
| `price` | `unit_price` |
| `number_of_products_sold` | `units_sold` |
| `revenue_generated` | `sales_revenue` |
| `supplier_name` | `vendor_name` |
| `location` | `facility_location` |
| `costs` | `freight_charges` |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- PostgreSQL 12 or higher
- Both merchant databases set up and running
- Gemini API key (free from Google)

### Installation

1. **Navigate to Dashboard folder**:
```bash
cd Dashboard
```

2. **Install dependencies**:
```bash
npm install
```

3. **Get your Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy your API key

4. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Gemini AI API Key (Required)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Server Configuration
PORT=4000

# Merchant_one Database Configuration
MERCHANT1_USER=laxmangupta
MERCHANT1_HOST=localhost
MERCHANT1_DB=supply_chain_management
MERCHANT1_PASSWORD=
MERCHANT1_PORT=5432

# Merchant_two Database Configuration
MERCHANT2_USER=vatsaly
MERCHANT2_HOST=localhost
MERCHANT2_DB=merchant_two_supply_chain
MERCHANT2_PASSWORD=
MERCHANT2_PORT=5432
```

5. **Start the server**:
```bash
npm start
```

6. **Open your browser**:
```
http://localhost:4000
```

## 📖 Usage

### Example Natural Language Queries

#### Revenue & Sales
```
- "Show me total revenue from all merchants"
- "What is the average product price across both merchants?"
- "Which merchant has higher total sales?"
- "List all products with revenue over $10000"
```

#### Inventory & Stock
```
- "Show me products with low stock levels"
- "How many total products do we have?"
- "List all cosmetics products"
- "Which products have stock below 50 units?"
```

#### Supply Chain
```
- "Show me all suppliers from both merchants"
- "List locations where products are stored"
- "Which shipping carriers do we use?"
- "Show me vendors in Mumbai or Delhi"
```

#### Comparative Analysis
```
- "Compare skincare products between merchants"
- "Which merchant has more product variety?"
- "Show price differences for similar products"
- "Compare supply chain costs between merchants"
```

#### Performance Metrics
```
- "Show products with highest profit margins"
- "List products with quality score above 8"
- "Which products are most sold?"
- "Show active vs inactive products"
```

## 🔧 API Endpoints

### GET `/api/stats`
Get combined statistics from both databases.

**Response**:
```json
{
  "merchant1": {
    "totalProducts": 100,
    "totalRevenue": 50000.00,
    "avgPrice": 25.50,
    "productTypes": 3
  },
  "merchant2": {
    "totalProducts": 150,
    "totalRevenue": 75000.00,
    "avgPrice": 30.00,
    "productTypes": 3
  },
  "combined": {
    "totalProducts": 250,
    "totalRevenue": 125000.00,
    "avgPrice": 27.75,
    "totalMerchants": 2
  }
}
```

### POST `/api/query`
Execute a natural language query.

**Request**:
```json
{
  "question": "Show me total revenue from all merchants"
}
```

**Response**:
```json
{
  "success": true,
  "question": "Show me total revenue from all merchants",
  "target": "both",
  "explanation": "Retrieving total revenue from both databases",
  "queries": {
    "merchant1": "SELECT SUM(revenue_generated) as total FROM products_sales",
    "merchant2": "SELECT SUM(sales_revenue) as total FROM products"
  },
  "results": {
    "merchant1": [{"total": 50000.00}],
    "merchant2": [{"total": 75000.00}]
  },
  "aggregation_needed": true,
  "aggregated": {
    "total": 125000.00
  }
}
```

### GET `/api/examples`
Get sample query examples organized by category.

### GET `/api/health`
Check system health and database connections.

## 🎨 Dashboard Features

### Statistics Overview
- **Total Products**: Combined count from both merchants
- **Total Revenue**: Aggregated revenue with per-merchant breakdown
- **Average Price**: Calculated across all products
- **Product Types**: Distinct categories/types

### Query Interface
- Natural language input field
- AI-powered query processing
- Quick example queries (click to use)
- Real-time query execution

### Results Display
- Side-by-side merchant results
- Color-coded by merchant (purple for M1, pink for M2)
- SQL query display for transparency
- Aggregated results when applicable
- Formatted tables with responsive design

## 🛠️ Development

### Run in development mode with auto-reload:
```bash
npm run dev
```

### Project Structure:
```
Dashboard/
├── server.js              # Main server with dual DB connections
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create from .env.example)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── views/
    └── index.ejs         # Dashboard UI
```

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ Read-only database queries (SELECT only)
- ✅ Parameterized queries to prevent SQL injection
- ✅ API key validation
- ✅ Error handling without exposing internals

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Verify databases exist
psql -U laxmangupta -d supply_chain_management -c "SELECT 1;"
psql -U vatsaly -d merchant_two_supply_chain -c "SELECT 1;"
```

### Gemini API Issues
- Verify API key is correct in `.env`
- Check [Google AI Studio](https://makersuite.google.com/) for API status
- Ensure you have remaining quota

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5000
```

## 📊 Query Examples in Action

### Example 1: Total Revenue
**Input**: "Show me total revenue from all merchants"

**System Action**:
1. Gemini generates SQL for both databases
2. Executes: `SELECT SUM(revenue_generated) FROM products_sales` (M1)
3. Executes: `SELECT SUM(sales_revenue) FROM products` (M2)
4. Aggregates results: $125,000 total

### Example 2: Product Search
**Input**: "List all cosmetics products"

**System Action**:
1. Identifies query target: Merchant_two (has 'category' field)
2. Executes: `SELECT * FROM products WHERE category = 'cosmetics'`
3. Returns M2 results only

### Example 3: Supplier Comparison
**Input**: "Show me suppliers in Mumbai"

**System Action**:
1. Queries both databases
2. M1: `SELECT * FROM supply_chain_logistics WHERE location = 'Mumbai'`
3. M2: `SELECT * FROM supply_chain WHERE facility_location = 'Mumbai'`
4. Returns combined results with merchant labels

## 🚀 Performance

- **Parallel Execution**: Queries run simultaneously on both databases
- **Connection Pooling**: Efficient database connection management
- **Smart Caching**: Statistics cached for fast dashboard loading
- **Optimized Queries**: AI generates efficient SQL

## 📝 License

MIT License - Feel free to use and modify!

## 👥 Contributors

- Supply Chain Management Team

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- PostgreSQL for robust database management
- Express.js for the backend framework

---

## 🎯 Next Steps

After setup, try these queries:
1. "Show me total revenue from all merchants" - See federated aggregation
2. "List all cosmetics products" - See intelligent routing
3. "Compare skincare products between merchants" - See comparative analysis
4. "Which products have stock below 50?" - See cross-database filtering

**Need Help?** Check the troubleshooting section or review the API endpoints documentation above.

---

**Built with ❤️ for Supply Chain Management**
