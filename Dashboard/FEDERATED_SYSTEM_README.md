# 🎯 Federated Supply Chain Dashboard - Three Data Sources

## 📊 System Overview

This is a **federated query system** that integrates **THREE heterogeneous data sources** into a unified dashboard with intelligent natural language querying.

### **Architecture: Local-as-View (LAV) + LLM-Powered Query Generation**

```
                    ┌─────────────────────────────────┐
                    │   User Natural Language Query   │
                    │   "Show customer complaints"    │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │   Gemini AI Query Analyzer      │
                    │   (Determines which sources)    │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴──────────────────┐
                    │                                  │
      ┌─────────────▼──────────┐      ┌──────────────▼────────────┐
      │  SQL Query Generation  │      │  Keyword Extraction       │
      │  (for Structured DBs)  │      │  (for Unstructured Data)  │
      └─────────────┬──────────┘      └──────────────┬────────────┘
                    │                                  │
    ┌───────────────┴───────────────┐                 │
    │                               │                 │
┌───▼────┐                   ┌──────▼───┐      ┌─────▼──────┐
│ Merch1 │                   │ Merch2   │      │Unstructured│
│  DB    │                   │   DB     │      │    Data    │
│(PostSQL│                   │(PostSQL) │      │  (Text)    │
└───┬────┘                   └──────┬───┘      └─────┬──────┘
    │                               │                 │
    └───────────────┬───────────────┘                 │
                    ▼                                  ▼
            ┌───────────────┐              ┌─────────────────┐
            │ Aggregation   │              │ LLM Analysis    │
            │ Logic         │              │ & Extraction    │
            └───────┬───────┘              └────────┬────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │  Unified Response with Insights │
                    │  (Natural Language + Data)      │
                    └─────────────────────────────────┘
```

---

## 🗄️ **Three Data Sources**

### **1️⃣ Merchant_one Database** (PostgreSQL)
**Database:** `supply_chain_management`  
**Owner:** laxmangupta  
**Schema:** Evolved schema with enriched product data

**Tables:**
- **`product_catalog`** (50 rows, 11 columns)
  - Columns: `item_id`, `product_category`, `unit_cost`, `quantity_sold`, `total_earnings`, `profit_margin`, `brand_name`, `product_name`, `launch_date`, `created_timestamp`, `updated_timestamp`
  - Contains: Branded products (Lakme, Maybelline, Pantene, etc.)
  - Categories: cosmetics, skincare, haircare, fragrance, wellness

- **`vendor_management`** (50 rows, 13 columns)
  - Columns: `item_id`, `vendor_company`, `business_location`, `delivery_time_days`, `order_quantity`, `production_cost`, `logistics_partner`, `shipping_method`, `logistics_fee`, `quality_rating`, `contract_start_date`, `payment_terms`, `created_timestamp`
  - Contains: Vendor relationships with quality ratings and payment terms

### **2️⃣ Merchant_two Database** (PostgreSQL)
**Database:** `merchant_two_supply_chain`  
**Owner:** vatsaly  
**Schema:** Original schema with stock management focus

**Tables:**
- **`products`** (59 rows, 11 columns)
  - Columns: `product_id`, `category`, `unit_price`, `units_sold`, `sales_revenue`, `profit_margin`, `stock_level`, `product_status`, `seasonal_demand`, `created_at`, `updated_at`
  - Contains: Products with inventory tracking
  - Categories: cosmetics, skincare, haircare

- **`supply_chain`** (59 rows, 16 columns)
  - Columns: `id`, `product_id`, `vendor_name`, `facility_location`, `processing_days`, `output_quantity`, `production_expenses`, `logistics_provider`, `shipping_method`, `freight_charges`, `quality_score`, `reorder_point`, `warehouse_zone`, `sustainability_index`, `created_at`, `updated_at`
  - Contains: Detailed supply chain logistics with sustainability metrics

### **3️⃣ Unstructured Data** (Text Files)
**File:** `unstructured_data_3000_entries.txt`  
**Format:** Plain text with structured sections  
**Total Entries:** 3000  
**Querying Method:** LLM-based semantic search

**Content Types:**
- **Support Tickets** (760 entries)
  - Customer complaints, service issues, resolutions
  - Format: CS-YYYY-XXXX
  
- **Social Media Posts** (768 entries)
  - Twitter, Facebook, Instagram, YouTube mentions
  - Includes sentiment analysis (positive/negative/neutral)
  - Format: SM-YYYYXXXX

- **Product Reviews** (739 entries)
  - Customer ratings and detailed feedback
  - Verified purchase indicators
  - Format: RV-YYYY-XXXX

- **Market Reports** (733 entries)
  - Industry trends, consumer insights
  - Recommendations and impact assessments
  - Format: MR-YYYYXXXX

**Unique Products Covered:** 109  
**Categories:** cosmetics, skincare, haircare, fragrance, wellness

---

## 🎯 **How It Works**

### **Query Flow:**

1. **User Input:** Natural language question
   - Example: "What do customers think about Lakme products?"

2. **LLM Analysis:** Gemini AI determines:
   - Which data sources to query
   - SQL queries for structured databases
   - Keywords for unstructured data search

3. **Parallel Execution:**
   - SQL queries run on Merchant1 & Merchant2 databases
   - Unstructured data searched using semantic matching
   - All sources queried simultaneously

4. **Result Aggregation:**
   - Structured data combined across databases
   - Unstructured insights extracted via LLM
   - Cross-source correlations identified

5. **Insight Generation:**
   - Natural language summary created
   - Key findings highlighted
   - Actionable recommendations provided

---

## 📡 **API Endpoints**

### **Unified Query Endpoint**
```http
POST /api/query
Content-Type: application/json

{
  "question": "Show me products with negative customer reviews"
}
```

**Response includes:**
- SQL query results from both databases
- Unstructured data analysis
- Combined insights
- Natural language summary

### **Unstructured Data Endpoints**

#### Query Unstructured Data
```http
POST /api/query-unstructured
{
  "question": "What are customers saying about cosmetics?"
}
```

#### Get Support Tickets
```http
GET /api/support-tickets?merchant=Merchant1&status=open&limit=50
```

#### Get Social Media Posts
```http
GET /api/social-media?sentiment=negative&category=skincare&limit=50
```

#### Get Product Reviews
```http
GET /api/product-reviews?productId=ITEM008&limit=50
```

#### Get Market Reports
```http
GET /api/market-reports?category=cosmetics&impact=high&limit=50
```

#### Get Product Sentiment
```http
GET /api/product-sentiment/ITEM008
```

**Returns:**
```json
{
  "success": true,
  "productId": "ITEM008",
  "sentiment": {
    "positive": 45,
    "negative": 12,
    "neutral": 8,
    "total": 65
  }
}
```

#### Get Unstructured Data Statistics
```http
GET /api/unstructured-stats
```

**Returns:**
```json
{
  "success": true,
  "stats": {
    "totalEntries": 3000,
    "supportTickets": 760,
    "socialMediaPosts": 768,
    "productReviews": 739,
    "marketReports": 733,
    "products": [...],
    "merchants": ["Merchant1", "Merchant2"],
    "categories": ["cosmetics", "skincare", "haircare", "fragrance", "wellness"]
  }
}
```

#### Search Unstructured Data
```http
POST /api/search-unstructured
{
  "query": "packaging issues",
  "type": "support_ticket",
  "merchant": "Merchant1",
  "category": "cosmetics",
  "limit": 50
}
```

---

## 🔍 **Example Queries**

### **Query Type 1: Structured Data Only**
**Question:** "Show me total revenue from both merchants"

**What Happens:**
- ✅ Queries Merchant1: `SELECT SUM(total_earnings) FROM product_catalog`
- ✅ Queries Merchant2: `SELECT SUM(sales_revenue) FROM products`
- ❌ Unstructured data: Not queried
- **Result:** Combined revenue calculation with comparison

### **Query Type 2: Unstructured Data Only**
**Question:** "What are the most common customer complaints?"

**What Happens:**
- ❌ Merchant1: Not queried
- ❌ Merchant2: Not queried
- ✅ Unstructured: Searches support tickets and reviews
- **Result:** LLM analyzes patterns in complaints and summarizes

### **Query Type 3: Hybrid (All 3 Sources)**
**Question:** "How are our cosmetic products performing in sales and customer satisfaction?"

**What Happens:**
- ✅ Merchant1: `SELECT * FROM product_catalog WHERE product_category='cosmetics'`
- ✅ Merchant2: `SELECT * FROM products WHERE category='cosmetics'`
- ✅ Unstructured: Searches reviews and social media for cosmetics sentiment
- **Result:** Complete analysis combining sales numbers with customer feedback

---

## 🚀 **Getting Started**

### **Prerequisites:**
- Node.js (v14+)
- PostgreSQL (v12+)
- Gemini API Key

### **Installation:**

```bash
# 1. Navigate to Dashboard directory
cd Dashboard

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start the server
npm start
```

### **Environment Variables:**
```env
# Gemini AI
GEMINI_API_KEY=your_api_key_here

# Merchant One Database
MERCHANT1_USER=laxmangupta
MERCHANT1_HOST=localhost
MERCHANT1_DB=supply_chain_management
MERCHANT1_PASSWORD=
MERCHANT1_PORT=5432

# Merchant Two Database
MERCHANT2_USER=vatsaly
MERCHANT2_HOST=localhost
MERCHANT2_DB=merchant_two_supply_chain
MERCHANT2_PASSWORD=
MERCHANT2_PORT=5432

# Server
PORT=4000
```

### **Accessing the Dashboard:**
Open your browser and navigate to:
```
http://localhost:4000
```

---

## 📊 **Data Statistics**

| Metric | Value |
|--------|-------|
| **Total Databases** | 2 (PostgreSQL) |
| **Total Tables** | 4 |
| **Structured Data Rows** | 218 |
| **Unstructured Entries** | 3000 |
| **Total Products** | ~110 unique products |
| **Product Categories** | 5 (cosmetics, skincare, haircare, fragrance, wellness) |
| **Support Tickets** | 760 |
| **Social Media Posts** | 768 |
| **Product Reviews** | 739 |
| **Market Reports** | 733 |

---

## 🎓 **Key Features**

### **1. Dynamic Schema Discovery**
- Automatically detects table structures
- Identifies column types and relationships
- Adapts queries to schema changes

### **2. Intelligent Search**
- Fuzzy matching across all data sources
- Semantic pattern recognition
- Handles typos and variations

### **3. Cross-Source Correlation**
- Links products across different databases
- Correlates structured data with customer feedback
- Identifies trends across all sources

### **4. Natural Language Interface**
- No SQL knowledge required
- Conversational query style
- Context-aware responses

### **5. Real-Time Insights**
- LLM-generated summaries
- Actionable recommendations
- Trend analysis

---

## 🔐 **Security & Best Practices**

- ✅ Read-only queries on production data
- ✅ SQL injection prevention
- ✅ Rate limiting on API endpoints
- ✅ Secure credential management
- ✅ Error handling and graceful degradation

---

## 📚 **Technical Stack**

- **Backend:** Node.js + Express
- **Databases:** PostgreSQL (2 instances)
- **AI/LLM:** Google Gemini 2.0 Flash
- **Data Format:** JSON, CSV, Plain Text
- **Frontend:** EJS Templates
- **Query Method:** LAV (Local-as-View) Federated Architecture

---

## 🎯 **Use Cases**

### **Business Intelligence:**
- "Which merchant has better profit margins?"
- "Show me products with low stock and negative reviews"
- "What are the latest market trends for skincare?"

### **Customer Insights:**
- "What do customers complain about most?"
- "Show me all positive social media mentions"
- "Which products have the best customer satisfaction?"

### **Supply Chain Optimization:**
- "Which vendors have the highest quality ratings?"
- "Show me products with long delivery times and customer complaints"
- "What are the sustainability metrics for cosmetics?"

---

## 🚦 **System Status**

**Current Status:** ✅ **OPERATIONAL**

- Merchant_one DB: ✅ Connected (100 rows)
- Merchant_two DB: ✅ Connected (118 rows)
- Unstructured Data: ✅ Loaded (3000 entries)
- Gemini AI: ✅ Configured
- Schema Discovery: ✅ Active
- Intelligent Search: ✅ Active (96 semantic patterns)

---

## 📝 **License**

This project is part of an academic implementation demonstrating federated database systems with heterogeneous data sources.

---

## 👥 **Contributors**

- **Project:** Supply Chain Management IIA
- **Repository:** laxman-gupta1006/SupplyChainManagement_IIA
- **Branch:** master

---

**🎉 Now you have a fully functional 3-source federated query system!**
