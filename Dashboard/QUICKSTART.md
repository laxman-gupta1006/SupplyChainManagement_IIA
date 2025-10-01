# 🚀 Quick Start Guide - Integrated Dashboard

## ⚡ 3-Step Setup

### Step 1: Get Your Gemini API Key (FREE)

1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key" button
3. Copy the generated key

### Step 2: Configure API Key

Edit the `.env` file in the Dashboard folder and paste your API key:

```env
GEMINI_API_KEY=paste_your_key_here
```

### Step 3: Start the Server

```bash
npm start
```

Then open: http://localhost:4000

---

## ✅ Pre-Flight Checklist

Before starting, make sure:

- [ ] PostgreSQL is running
- [ ] Merchant_one database exists: `supply_chain_management`
- [ ] Merchant_two database exists: `merchant_two_supply_chain`
- [ ] You have your Gemini API key configured in `.env`

---

## 🧪 Test Queries

Once the dashboard loads, try these queries:

1. **Simple Query**: "Show me total revenue from all merchants"
2. **Filtered Query**: "List all cosmetics products"
3. **Comparative Query**: "Which merchant has higher sales?"
4. **Stock Query**: "Show products with stock below 50"

---

## 🎯 What This Dashboard Does

✅ Connects to TWO PostgreSQL databases simultaneously
✅ Converts your natural language questions to SQL
✅ Automatically determines which database(s) to query
✅ Translates between different database schemas
✅ Combines and displays results from both merchants
✅ Shows you the generated SQL queries for transparency

---

## 🔍 How It Works

```
Your Question (Natural Language)
        ↓
Gemini AI (Analyzes & Converts to SQL)
        ↓
Query Router (Determines target database)
        ↓
┌─────────────────┴──────────────────┐
↓                                     ↓
Merchant_one DB              Merchant_two DB
(supply_chain_management)    (merchant_two_supply_chain)
↓                                     ↓
└─────────────────┬──────────────────┘
        ↓
Results Aggregator
        ↓
Beautiful Display on Dashboard
```

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check if PostgreSQL is running: `brew services list | grep postgresql`
- Verify database names are correct in `.env`

### "Gemini API key not configured"
- Make sure you added your key to `.env` file
- Restart the server after editing `.env`

### "Port 4000 already in use"
- Change `PORT=4000` to `PORT=5000` in `.env`

---

## 📖 Example Queries by Category

### 💰 Revenue & Sales
- "Show me total revenue from all merchants"
- "What is the average product price?"
- "Which merchant has higher total sales?"

### 📦 Inventory
- "Show products with low stock"
- "How many total products do we have?"
- "List all cosmetics products"

### 🚚 Supply Chain
- "Show all suppliers from both merchants"
- "List locations where products are stored"
- "Which shipping carriers do we use?"

### 📊 Analysis
- "Compare skincare products between merchants"
- "Show price differences for similar products"
- "Which products have highest profit margins?"

---

## 🎨 Dashboard Features

### Statistics Overview (Top Cards)
- Combined metrics from both databases
- Per-merchant breakdown shown below each stat
- Real-time data refresh

### Query Interface
- Natural language input box
- Click quick examples to try them instantly
- Real-time AI processing indicator

### Results Display
- Color-coded by merchant (Purple = M1, Pink = M2)
- Shows the generated SQL queries
- Formatted tables with smart number formatting
- Aggregated results when querying both databases

---

## 🎓 Understanding the Results

### Merchant Colors
- 🟣 **Purple** = Merchant_one (supply_chain_management)
- 🩷 **Pink** = Merchant_two (merchant_two_supply_chain)

### Result Sections
1. **Query Analysis** - What the AI understood
2. **SQL Queries** - The actual queries executed
3. **Per-Merchant Results** - Separate tables for each database
4. **Combined Results** - Aggregated data when applicable

---

## 💡 Pro Tips

1. **Be specific**: "Show revenue for cosmetics" works better than "show data"
2. **Use comparisons**: "Compare X between merchants" for side-by-side analysis
3. **Filter results**: "Show products where stock < 50" for specific criteria
4. **Explore examples**: Click the quick example chips to learn query patterns

---

## 🎉 You're Ready!

The dashboard is fully configured and ready to use. Start by clicking one of the example queries or type your own natural language question!

**Need more help?** Check the full README.md for detailed documentation.
