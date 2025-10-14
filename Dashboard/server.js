const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const UniversalIntelligentSearch = require('./intelligent-search');
const DynamicSchemaManager = require('./dynamic-schema-manager');
const UnstructuredDataHandler = require('./unstructured-data-handler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Dynamic Schema Manager
const schemaManager = new DynamicSchemaManager();

// Initialize Universal Intelligent Search System
const intelligentSearch = new UniversalIntelligentSearch();

// Initialize Unstructured Data Handler (THIRD DATA SOURCE)
const unstructuredData = new UnstructuredDataHandler();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Global dynamic schema context (will be updated automatically)
let dynamicSchemaContext = 'Schema loading...';

// Merchant_one PostgreSQL connection
const merchant1Pool = new Pool({
    user: process.env.MERCHANT1_USER || 'laxmangupta',
    host: process.env.MERCHANT1_HOST || 'localhost',
    database: process.env.MERCHANT1_DB || 'supply_chain_management',
    password: process.env.MERCHANT1_PASSWORD || '',
    port: process.env.MERCHANT1_PORT || 5432,
});

// Merchant_two PostgreSQL connection
const merchant2Pool = new Pool({
    user: process.env.MERCHANT2_USER || 'vatsaly',
    host: process.env.MERCHANT2_HOST || 'localhost',
    database: process.env.MERCHANT2_DB || 'merchant_two_supply_chain',
    password: process.env.MERCHANT2_PASSWORD || '',
    port: process.env.MERCHANT2_PORT || 5432,
});

// Test database connections
merchant1Pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to Merchant_one database:', err.message);
    } else {
        console.log('✅ Connected to Merchant_one database (supply_chain_management)');
        release();
    }
});

merchant2Pool.connect(async (err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to Merchant_two database:', err.message);
    } else {
        console.log('✅ Connected to Merchant_two database (merchant_two_supply_chain)');
        release();
        
        // Initialize dynamic systems after both databases are connected
        setTimeout(async () => {
            try {
                console.log('🚀 Initializing Dynamic Schema Manager...');
                
                // Initialize schema discovery
                const pools = {
                    'merchant1': merchant1Pool,
                    'merchant2': merchant2Pool
                };
                
                dynamicSchemaContext = await schemaManager.initializeSchemas(pools);
                console.log('✅ Dynamic Schema Manager ready!');
                
                // Initialize intelligent search with discovered schemas
                console.log('🧠 Initializing Universal Intelligent Search System...');
                await intelligentSearch.analyzeAllDatabaseContent(merchant1Pool, merchant2Pool);
                console.log('✅ Intelligent Search System ready!');
                
                // Initialize unstructured data handler (THIRD DATA SOURCE)
                console.log('📄 Initializing Unstructured Data Handler...');
                await unstructuredData.initialize();
                console.log('✅ Unstructured Data Handler ready!');
                
                console.log('🎉 All 3 data sources initialized and ready for federated queries!');
                
            } catch (initErr) {
                console.error('❌ Error initializing dynamic systems:', initErr.message);
                // Use fallback schema context to prevent crashes
                dynamicSchemaContext = 'Schema discovery failed. Using basic query generation.';
            }
        }, 2000); // Wait 2 seconds for both connections to be established
    }
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Dynamic schema context generator function
function getCurrentSchemaContext() {
    return `
You are a query generator for a federated supply chain system with THREE data sources:

DATA SOURCE 1 - MERCHANT_ONE DATABASE (supply_chain_management):
PostgreSQL database with structured relational data.

MERCHANT_ONE DATABASE (supply_chain_management):
Tables:
1. products_sales (sku VARCHAR PRIMARY KEY, product_type VARCHAR, price DECIMAL, number_of_products_sold INTEGER, revenue_generated DECIMAL)
   - product_type contains: 'cosmetics', 'skincare', 'haircare'
2. supply_chain_logistics (sku VARCHAR PRIMARY KEY, supplier_name VARCHAR, location VARCHAR, lead_time INTEGER, production_volumes INTEGER, manufacturing_costs DECIMAL, shipping_carriers VARCHAR, transportation_modes VARCHAR, costs DECIMAL)

MERCHANT_TWO DATABASE (merchant_two_supply_chain):
Tables:
1. products (product_id VARCHAR PRIMARY KEY, category VARCHAR, unit_price DECIMAL, units_sold INTEGER, sales_revenue DECIMAL, profit_margin DECIMAL, stock_level INTEGER, product_status VARCHAR, seasonal_demand VARCHAR)
   - category contains: 'cosmetics', 'skincare', 'haircare' (SAME values as Merchant_one's product_type!)
2. supply_chain (id SERIAL PRIMARY KEY, product_id VARCHAR, vendor_name VARCHAR, facility_location VARCHAR, processing_days INTEGER, output_quantity INTEGER, production_expenses DECIMAL, logistics_provider VARCHAR, shipping_method VARCHAR, freight_charges DECIMAL, quality_score DECIMAL, reorder_point INTEGER, warehouse_zone VARCHAR, sustainability_index INTEGER)

DATA SOURCE 3 - UNSTRUCTURED DATA (Text Data):
Contains 3000+ entries of customer feedback, support tickets, social media posts, and market reports.
Types available:
- Support Tickets: Customer service issues, complaints, resolutions (CS-YYYY-XXXX format)
- Social Media Posts: Twitter, Facebook, Instagram, YouTube posts with sentiment analysis (SM-YYYYXXXX format)
- Product Reviews: Customer ratings and feedback (RV-YYYY-XXXX format)
- Market Reports: Industry trends, consumer insights, recommendations (MR-YYYYXXXX format)

🔍 Query unstructured data when users ask about:
- Customer feedback, reviews, complaints, sentiments, opinions
- Social media mentions, posts, engagement, hashtags
- Support tickets, service issues, customer satisfaction
- Market trends, consumer behavior, industry insights
- Qualitative data, unstructured information, customer voices

KEY MAPPINGS:
- Merchant_one uses "sku" ↔ Merchant_two uses "product_id"
- Merchant_one uses "product_type" ↔ Merchant_two uses "category"
  ⚠️ IMPORTANT: Both contain the SAME values: 'cosmetics', 'skincare', 'haircare'
  When querying for specific product types/categories, query BOTH databases!
- Merchant_one uses "price" ↔ Merchant_two uses "unit_price"
- Merchant_one uses "number_of_products_sold" ↔ Merchant_two uses "units_sold"
- Merchant_one uses "revenue_generated" ↔ Merchant_two uses "sales_revenue"
- Merchant_one uses "supplier_name" ↔ Merchant_two uses "vendor_name"
- Merchant_one uses "location" ↔ Merchant_two uses "facility_location"
- Merchant_one uses "costs" ↔ Merchant_two uses "freight_charges"

🚨 CRITICAL RULE - NO SCHEMA PREFIXES:
- Write table names WITHOUT any database/schema prefix
- ✅ CORRECT: "FROM products_sales" or "FROM supply_chain"
- ❌ WRONG: "FROM supply_chain_management.products_sales" or "FROM merchant_two_supply_chain.products"
- Each query executes on its own specific database connection - prefixes will cause errors

When generating queries:
1. Determine which data source(s) to query based on the user's question:
   - For structured data (products, sales, vendors, logistics) → Use merchant1/merchant2 databases
   - For unstructured data (reviews, feedback, sentiments, social media) → Set query_unstructured: true
   - Can query both structured AND unstructured data together

2. Generate valid PostgreSQL SQL queries for databases
3. Return a JSON object with this exact structure:
{
  "target": "merchant1" OR "merchant2" OR "both",
  "merchant1_query": "SQL query for Merchant_one (or null if not needed)",
  "merchant2_query": "SQL query for Merchant_two (or null if not needed)",
  "query_unstructured": true/false (true if unstructured data needed),
  "unstructured_keywords": "keywords to search in unstructured data (if query_unstructured is true)",
  "explanation": "Brief explanation of what the queries will return",
  "aggregation_needed": true/false (true if results from multiple sources need to be combined)
}

4. Only generate SELECT queries (no INSERT, UPDATE, DELETE for safety)
5. Use proper PostgreSQL syntax
6. Consider the schema differences when generating queries
7. IMPORTANT: Generate ONE query per database. Do NOT use multiple queries separated by semicolons.
   - ❌ WRONG: "SELECT * FROM products_sales; SELECT * FROM supply_chain_logistics;"
   - ✅ CORRECT: Use single query or explain that multiple tables cannot be queried together
   - For "list all data" queries, choose the most relevant table or explain the limitation

Examples:
- "Show total revenue" → target: "both", sum revenue_generated from merchant1 and sales_revenue from merchant2
- "List all cosmetics products" → target: "both", use product_type='cosmetics' for merchant1 and category='cosmetics' for merchant2
- "Show skincare items" → target: "both", use product_type='skincare' for merchant1 and category='skincare' for merchant2
${dynamicSchemaContext}

🚨 CRITICAL RULES:
1. Use ONLY the tables and columns listed above (they are auto-discovered)
2. Write table names WITHOUT any database/schema prefix
3. ✅ CORRECT: "FROM table_name" 
4. ❌ WRONG: "FROM database.table_name" or "FROM schema.table_name"
5. Each query executes on its own database connection - prefixes will cause errors
6. Use ILIKE for text searches (case-insensitive fuzzy matching)
7. Handle NULL values with COALESCE when needed
8. Only generate SELECT queries (no INSERT, UPDATE, DELETE)

QUERY GENERATION STRUCTURE:
Return a JSON object with this exact structure:
{
  "target": "merchant1" OR "merchant2" OR "both",
  "merchant1_query": "SQL query for merchant1 database (or null if not needed)",
  "merchant2_query": "SQL query for merchant2 database (or null if not needed)", 
  "explanation": "Brief explanation of what the queries will return",
  "aggregation_needed": true/false (true if results need combining)
}

🧠 INTELLIGENT FEATURES:
- Use semantic column types for better targeting
- Apply fuzzy matching with % wildcards for partial matches
- Handle company name variations and product synonyms
- Generate queries that adapt to the discovered schema structure
`;
}

// Serve main dashboard page
app.get('/', (req, res) => {
    res.render('index');
});

// API: Get combined statistics from both databases
app.get('/api/stats', async (req, res) => {
    try {
        // Merchant_one stats
        const m1Products = await merchant1Pool.query('SELECT COUNT(*) as count FROM products_sales');
        const m1Revenue = await merchant1Pool.query('SELECT SUM(revenue_generated) as total FROM products_sales');
        const m1AvgPrice = await merchant1Pool.query('SELECT AVG(price) as avg FROM products_sales');
        const m1Types = await merchant1Pool.query('SELECT DISTINCT product_type FROM products_sales');

        // Merchant_two stats
        const m2Products = await merchant2Pool.query('SELECT COUNT(*) as count FROM products');
        const m2Revenue = await merchant2Pool.query('SELECT SUM(sales_revenue) as total FROM products');
        const m2AvgPrice = await merchant2Pool.query('SELECT AVG(unit_price) as avg FROM products');
        const m2Categories = await merchant2Pool.query('SELECT DISTINCT category FROM products');

        const stats = {
            merchant1: {
                totalProducts: parseInt(m1Products.rows[0].count) || 0,
                totalRevenue: parseFloat(m1Revenue.rows[0].total) || 0,
                avgPrice: parseFloat(m1AvgPrice.rows[0].avg) || 0,
                productTypes: m1Types.rows.length
            },
            merchant2: {
                totalProducts: parseInt(m2Products.rows[0].count) || 0,
                totalRevenue: parseFloat(m2Revenue.rows[0].total) || 0,
                avgPrice: parseFloat(m2AvgPrice.rows[0].avg) || 0,
                productTypes: m2Categories.rows.length
            },
            combined: {
                totalProducts: (parseInt(m1Products.rows[0].count) || 0) + (parseInt(m2Products.rows[0].count) || 0),
                totalRevenue: (parseFloat(m1Revenue.rows[0].total) || 0) + (parseFloat(m2Revenue.rows[0].total) || 0),
                avgPrice: ((parseFloat(m1AvgPrice.rows[0].avg) || 0) + (parseFloat(m2AvgPrice.rows[0].avg) || 0)) / 2,
                totalMerchants: 2
            }
        };

        res.json(stats);
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// API: Natural language query endpoint
app.post('/api/query', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.' 
            });
        }

        console.log(`🔍 Processing query: "${question}"`);

        // 🧠 INTELLIGENT SEARCH PREPROCESSING
        console.log('🧠 Analyzing query with intelligent search...');
        const searchResults = intelligentSearch.performIntelligentSearch(question);
        
        // Build enhanced context with fuzzy matches and semantic expansions
        let intelligentContext = '';
        if (searchResults.length > 0) {
            console.log(`   📊 Found ${searchResults.length} intelligent matches`);
            
            const topMatches = searchResults.slice(0, 10); // Top 10 matches
            intelligentContext = `\n\n🧠 INTELLIGENT SEARCH CONTEXT:
Based on fuzzy matching and semantic analysis, here are relevant database entries that match your query:

${topMatches.map(match => 
    `- "${match.value}" (${match.contentGroup}, similarity: ${(match.similarity?.combined || 0).toFixed(2)}, match: ${match.matchType})`
).join('\n')}

Use this context to generate better SQL queries that include similar terms, fuzzy matches, and semantic variations.
For example, if user searches "lipsticks", also include "cosmetics" in your query.
If user searches "K.P traders", also include variations like "Kapil Prakash" or "KP" in your query.

Generate SQL with ILIKE patterns that capture these variations:`;
        } else {
            console.log('   💭 No specific matches found, using general intelligent search');
            intelligentContext = '\n\n🧠 INTELLIGENT SEARCH: Use fuzzy matching with ILIKE patterns (e.g., %term% for partial matches).';
        }

        // Use Gemini to convert natural language to SQL with intelligent context
        const prompt = `${getCurrentSchemaContext()}${intelligentContext}\n\nUser Question: "${question}"\n\nGenerate the appropriate SQL query/queries as JSON:`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiResponse = response.text();

        // Clean up the response (remove markdown code blocks if present)
        aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        console.log('🤖 AI Response:', aiResponse);

        const queryPlan = JSON.parse(aiResponse);

        // Execute queries based on target
        let merchant1Results = null;
        let merchant2Results = null;
        let unstructuredResults = null;

        // Query structured databases
        if (queryPlan.target === 'merchant1' || queryPlan.target === 'both') {
            if (queryPlan.merchant1_query) {
                console.log('📊 Executing Merchant_one query:', queryPlan.merchant1_query);
                merchant1Results = await executeMultipleQueries(merchant1Pool, queryPlan.merchant1_query);
            }
        }

        if (queryPlan.target === 'merchant2' || queryPlan.target === 'both') {
            if (queryPlan.merchant2_query) {
                console.log('📊 Executing Merchant_two query:', queryPlan.merchant2_query);
                merchant2Results = await executeMultipleQueries(merchant2Pool, queryPlan.merchant2_query);
            }
        }

        // Query unstructured data if needed
        if (queryPlan.query_unstructured) {
            console.log('📄 Querying unstructured data with keywords:', queryPlan.unstructured_keywords || question);
            const unstructuredQuery = queryPlan.unstructured_keywords || question;
            unstructuredResults = await unstructuredData.queryWithLLM(unstructuredQuery, model);
        }

        // Prepare response
        const responseData = {
            success: true,
            question: question,
            target: queryPlan.target,
            explanation: queryPlan.explanation,
            queries: {
                merchant1: queryPlan.merchant1_query,
                merchant2: queryPlan.merchant2_query
            },
            results: {
                merchant1: merchant1Results,
                merchant2: merchant2Results,
                unstructured: unstructuredResults ? {
                    analysis: unstructuredResults.analysis,
                    entriesAnalyzed: unstructuredResults.dataEntriesAnalyzed,
                    sampleData: unstructuredResults.sampleData
                } : null
            },
            aggregation_needed: queryPlan.aggregation_needed || false,
            unstructured_queried: queryPlan.query_unstructured || false
        };

        // Perform aggregation if needed
        if (queryPlan.aggregation_needed && merchant1Results && merchant2Results) {
            responseData.aggregated = performAggregation(merchant1Results, merchant2Results, question);
        }

        // Generate natural language insights (including unstructured data)
        responseData.insights = await generateInsights(
            question, 
            merchant1Results, 
            merchant2Results, 
            responseData.aggregated,
            unstructuredResults
        );

        console.log('✅ Query executed successfully');
        res.json(responseData);

    } catch (err) {
        console.error('❌ Error processing query:', err);
        res.status(500).json({ 
            error: 'Failed to process query: ' + err.message,
            details: err.stack 
        });
    }
});

// Helper function to execute multiple SQL queries (separated by semicolons or newlines)
async function executeMultipleQueries(pool, queryString) {
    if (!queryString || queryString.trim() === '') {
        return [];
    }

    // Replace newlines with spaces, then split by semicolon
    const normalizedQuery = queryString.replace(/\n/g, ' ');
    
    // Split queries by semicolon and filter out empty ones
    const queries = normalizedQuery
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

    // If only one query, execute directly
    if (queries.length === 1) {
        const result = await pool.query(queries[0]);
        return result.rows;
    }

    // For multiple queries, execute them sequentially and combine results
    let combinedResults = [];
    
    for (const query of queries) {
        try {
            console.log(`   └─ Executing sub-query: ${query.substring(0, 60)}...`);
            const result = await pool.query(query);
            // Combine all results into a single array
            if (result.rows && result.rows.length > 0) {
                combinedResults = combinedResults.concat(result.rows);
            }
        } catch (err) {
            console.error(`   ❌ Error executing query: ${query}`, err.message);
            // Continue with other queries even if one fails
        }
    }

    return combinedResults;
}

// Helper function to perform intelligent aggregation
function performAggregation(m1Data, m2Data, question) {
    const lowerQuestion = question.toLowerCase();
    
    // Check if this is a single-value aggregation query (SUM, AVG, COUNT, etc.)
    const isSingleValueQuery = m1Data.length === 1 && m2Data.length === 1;
    
    if (isSingleValueQuery) {
        // SMART AGGREGATION: Sum all numeric values from both results
        const aggregated = {};
        let totalSum = 0;
        let valueCount = 0;
        const allValues = [];
        
        // Extract all numeric values from merchant1
        if (m1Data[0]) {
            Object.entries(m1Data[0]).forEach(([key, value]) => {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    totalSum += num;
                    valueCount++;
                    allValues.push({ merchant: 'Merchant_one', column: key, value: num });
                }
            });
        }
        
        // Extract all numeric values from merchant2
        if (m2Data[0]) {
            Object.entries(m2Data[0]).forEach(([key, value]) => {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    totalSum += num;
                    valueCount++;
                    allValues.push({ merchant: 'Merchant_two', column: key, value: num });
                }
            });
        }
        
        // Determine the result format based on query type
        if (lowerQuestion.includes('average') || lowerQuestion.includes('avg')) {
            // For average queries, return the average of both averages
            const m1Val = parseFloat(Object.values(m1Data[0])[0]);
            const m2Val = parseFloat(Object.values(m2Data[0])[0]);
            aggregated.combined_average = ((m1Val + m2Val) / 2).toFixed(2);
            aggregated.merchant1_average = m1Val.toFixed(2);
            aggregated.merchant2_average = m2Val.toFixed(2);
        } else {
            // For sum/total/count queries, sum all values
            aggregated.total_combined = parseFloat(totalSum.toFixed(2));
            aggregated.merchant1_contribution = parseFloat(allValues.find(v => v.merchant === 'Merchant_one')?.value.toFixed(2) || 0);
            aggregated.merchant2_contribution = parseFloat(allValues.find(v => v.merchant === 'Merchant_two')?.value.toFixed(2) || 0);
        }
        
        // Add breakdown details
        aggregated.breakdown = allValues.map(v => ({
            merchant: v.merchant,
            value: parseFloat(v.value.toFixed(2))
        }));
        
        return aggregated;
    }
    
    // For multi-row results (list queries)
    if (m1Data.length > 0 || m2Data.length > 0) {
        // Define column mappings for normalization
        const columnMappings = {
            'sku': 'product_id',
            'product_type': 'category',
            'price': 'unit_price',
            'number_of_products_sold': 'units_sold',
            'revenue_generated': 'sales_revenue',
            'supplier_name': 'vendor_name',
            'location': 'facility_location',
            'costs': 'freight_charges',
            'lead_time': 'processing_days',
            'production_volumes': 'output_quantity',
            'manufacturing_costs': 'production_expenses',
            'shipping_carriers': 'logistics_provider',
            'transportation_modes': 'shipping_method'
        };
        
        // Create reverse mapping
        const reverseMapping = {};
        Object.entries(columnMappings).forEach(([m1Col, m2Col]) => {
            reverseMapping[m2Col] = m1Col;
        });
        
        // Function to normalize a row's column names to a standard format
        function normalizeRow(row, source) {
            const normalized = {};
            Object.entries(row).forEach(([key, value]) => {
                // Use the Merchant_one column name as the standard
                let standardKey = key;
                
                if (source === 'Merchant_two' && reverseMapping[key]) {
                    standardKey = reverseMapping[key];
                } else if (source === 'Merchant_one' && columnMappings[key]) {
                    standardKey = key; // Already standard
                }
                
                normalized[standardKey] = value;
            });
            normalized._source = source;
            return normalized;
        }
        
        const combinedData = [];
        
        // Add merchant1 data with normalized columns
        m1Data.forEach(row => {
            combinedData.push(normalizeRow(row, 'Merchant_one'));
        });
        
        // Add merchant2 data with normalized columns
        m2Data.forEach(row => {
            combinedData.push(normalizeRow(row, 'Merchant_two'));
        });
        
        // Check if this is a GROUP BY query that needs aggregation
        // Look for queries with count, sum, or other aggregations
        const needsAggregation = combinedData.length > 0 && 
            (combinedData[0].hasOwnProperty('count') || 
             combinedData[0].hasOwnProperty('product_count') ||
             combinedData[0].hasOwnProperty('total') ||
             combinedData[0].hasOwnProperty('sum') ||
             (lowerQuestion.includes('distribution') || 
              lowerQuestion.includes('count') || 
              lowerQuestion.includes('how many')));
        
        if (needsAggregation && combinedData.length > 1) {
            // Aggregate the results by grouping column
            const aggregatedMap = new Map();
            
            // Find the grouping column (non-numeric column)
            let groupByColumn = null;
            let valueColumn = null;
            
            if (combinedData[0]) {
                Object.keys(combinedData[0]).forEach(key => {
                    if (key !== '_source') {
                        const val = combinedData[0][key];
                        if (isNaN(parseFloat(val))) {
                            groupByColumn = key; // This is the category/type column
                        } else {
                            valueColumn = key; // This is the count/sum column
                        }
                    }
                });
            }
            
            if (groupByColumn && valueColumn) {
                // Group and sum by the grouping column
                combinedData.forEach(row => {
                    const groupKey = row[groupByColumn];
                    const value = parseFloat(row[valueColumn]) || 0;
                    
                    if (aggregatedMap.has(groupKey)) {
                        aggregatedMap.set(groupKey, aggregatedMap.get(groupKey) + value);
                    } else {
                        aggregatedMap.set(groupKey, value);
                    }
                });
                
                // Convert back to array format
                const aggregatedData = Array.from(aggregatedMap.entries()).map(([key, value]) => ({
                    [groupByColumn]: key,
                    [valueColumn]: value
                }));
                
                return {
                    total_records: aggregatedData.length,
                    merchant1_records: m1Data.length,
                    merchant2_records: m2Data.length,
                    combined_data: aggregatedData,
                    note: `Aggregated results: Combined totals by ${groupByColumn.replace(/_/g, ' ')}`
                };
            }
        }
        
        // For non-aggregated list queries, return all rows
        return {
            total_records: combinedData.length,
            merchant1_records: m1Data.length,
            merchant2_records: m2Data.length,
            combined_data: combinedData.slice(0, 50), // Limit to first 50 for display
            note: combinedData.length > 50 ? `Showing first 50 of ${combinedData.length} total records` : 'All records combined'
        };
    }
    
    return {
        note: 'No data to aggregate'
    };
}

// Helper function to generate natural language insights using Gemini AI
async function generateInsights(question, merchant1Data, merchant2Data, aggregatedData, unstructuredData) {
    try {
        // Only generate insights if we have data from at least one source
        if ((!merchant1Data || merchant1Data.length === 0) && 
            (!merchant2Data || merchant2Data.length === 0) &&
            (!unstructuredData || !unstructuredData.success)) {
            return null;
        }

        // Prepare data summary for AI
        let dataSummary = `User Question: "${question}"\n\n`;
        
        if (merchant1Data && merchant1Data.length > 0) {
            dataSummary += `Merchant_one Results (${merchant1Data.length} rows):\n`;
            dataSummary += JSON.stringify(merchant1Data.slice(0, 5), null, 2) + '\n';
            if (merchant1Data.length > 5) dataSummary += `... and ${merchant1Data.length - 5} more rows\n`;
            dataSummary += '\n';
        }

        if (merchant2Data && merchant2Data.length > 0) {
            dataSummary += `Merchant_two Results (${merchant2Data.length} rows):\n`;
            dataSummary += JSON.stringify(merchant2Data.slice(0, 5), null, 2) + '\n';
            if (merchant2Data.length > 5) dataSummary += `... and ${merchant2Data.length - 5} more rows\n`;
            dataSummary += '\n';
        }

        if (aggregatedData) {
            dataSummary += `Combined/Aggregated Results:\n`;
            dataSummary += JSON.stringify(aggregatedData, null, 2) + '\n\n';
        }

        // Add unstructured data analysis if available
        if (unstructuredData && unstructuredData.success) {
            dataSummary += `\nUnstructured Data Analysis (${unstructuredData.dataEntriesAnalyzed} entries):\n`;
            dataSummary += unstructuredData.analysis + '\n\n';
        }

        const insightPrompt = `${dataSummary}

Based on the query results above, provide a concise, natural language insight in 2-3 sentences that:
1. Directly answers the user's question
2. Highlights key findings or comparisons (e.g., "Merchant_one has better sales than Merchant_two")
3. Mentions specific numbers when relevant
4. Is written in a conversational, easy-to-understand style

Do NOT repeat the data. Do NOT use technical jargon. Focus on actionable insights.

Example good insights:
- "Merchant_one is outperforming Merchant_two with $577K in revenue compared to $167K. That's about 3.5x more!"
- "You have 59 skincare products total across both merchants, with Merchant_one holding 68% of the inventory."
- "Both merchants are performing well in cosmetics, with fairly balanced stock levels of 26 and 19 products respectively."

Your insight:`;

        const result = await model.generateContent(insightPrompt);
        const response = await result.response;
        let insight = response.text().trim();

        // Clean up any markdown formatting
        insight = insight.replace(/```/g, '').replace(/\*\*/g, '').trim();

        console.log('💡 Generated insight:', insight);
        return insight;

    } catch (err) {
        console.error('❌ Error generating insights:', err.message);
        return null; // Fail gracefully
    }
}

// API: Get sample queries
app.get('/api/examples', (req, res) => {
    const examples = [
        {
            category: 'Revenue & Sales',
            queries: [
                'Show me total revenue from all merchants',
                'What is the average product price across both merchants?',
                'Which merchant has higher total sales?',
                'List all products with revenue over $10000'
            ]
        },
        {
            category: 'Inventory & Stock',
            queries: [
                'Show me products with low stock levels',
                'How many total products do we have across both merchants?',
                'List all cosmetics products',
                'Which products have stock below 50 units?'
            ]
        },
        {
            category: 'Supply Chain',
            queries: [
                'Show me all suppliers/vendors from both merchants',
                'List locations where products are stored',
                'Which shipping carriers do we use?',
                'Show me vendors in Mumbai or Delhi'
            ]
        },
        {
            category: 'Comparative Analysis',
            queries: [
                'Compare skincare products between merchants',
                'Which merchant has more product variety?',
                'Show the price difference between merchants for similar products',
                'Compare supply chain costs between merchants'
            ]
        },
        {
            category: 'Performance Metrics',
            queries: [
                'Show products with highest profit margins',
                'List products with quality score above 8',
                'Which products are most sold?',
                'Show active vs inactive products across merchants'
            ]
        }
    ];
    
    res.json(examples);
});

// API: Health check
app.get('/api/health', async (req, res) => {
    try {
        const m1Check = await merchant1Pool.query('SELECT 1');
        const m2Check = await merchant2Pool.query('SELECT 1');
        
        res.json({
            status: 'healthy',
            databases: {
                merchant1: m1Check ? 'connected' : 'disconnected',
                merchant2: m2Check ? 'connected' : 'disconnected'
            },
            gemini_configured: !!process.env.GEMINI_API_KEY
        });
    } catch (err) {
        res.status(500).json({
            status: 'unhealthy',
            error: err.message
        });
    }
});

// API: Test Intelligent Search System
app.get('/api/intelligent-search', async (req, res) => {
    try {
        const { query, type } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        console.log(`🧠 Testing intelligent search for: "${query}"`);
        
        const searchResults = intelligentSearch.performIntelligentSearch(query, type || 'all');
        
        res.json({
            success: true,
            query: query,
            results: searchResults.slice(0, 20), // Top 20 results
            total_matches: searchResults.length,
            semantic_patterns: Array.from(intelligentSearch.semanticPatterns.entries())
                .filter(([key]) => key.includes(query.toLowerCase()))
                .slice(0, 10) // Top 10 semantic patterns
        });
    } catch (err) {
        console.error('❌ Error in intelligent search:', err);
        res.status(500).json({ 
            error: 'Intelligent search failed: ' + err.message 
        });
    }
});

// API: Get all discovered semantic patterns
app.get('/api/semantic-patterns', (req, res) => {
    try {
        const patterns = {};
        
        for (const [term, relatedTerms] of intelligentSearch.semanticPatterns.entries()) {
            patterns[term] = Array.from(relatedTerms);
        }
        
        res.json({
            success: true,
            total_patterns: Object.keys(patterns).length,
            patterns: patterns
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get semantic patterns: ' + err.message 
        });
    }
});

// API: Get current dynamic schema information
app.get('/api/schema', (req, res) => {
    try {
        const schemas = schemaManager.getAllSchemas();
        const summary = schemaManager.getSchemaSummary();
        
        res.json({
            success: true,
            schemas: schemas,
            summary: summary,
            last_updated: new Date(),
            context_preview: getCurrentSchemaContext().substring(0, 500) + '...'
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get schema information: ' + err.message 
        });
    }
});

// API: Force refresh schema for a specific merchant
app.post('/api/schema/refresh', async (req, res) => {
    try {
        const { merchant } = req.body;
        
        if (!merchant || !['merchant1', 'merchant2'].includes(merchant)) {
            return res.status(400).json({ 
                error: 'Invalid merchant. Must be "merchant1" or "merchant2"' 
            });
        }
        
        const pool = merchant === 'merchant1' ? merchant1Pool : merchant2Pool;
        
        console.log(`🔄 Force refreshing schema for ${merchant}...`);
        await schemaManager.refreshSchema(merchant, pool);
        
        // Update global schema context
        const pools = { 'merchant1': merchant1Pool, 'merchant2': merchant2Pool };
        dynamicSchemaContext = schemaManager.generateUnifiedSchemaContext();
        
        console.log(`✅ Schema refreshed for ${merchant}`);
        
        res.json({
            success: true,
            message: `Schema refreshed for ${merchant}`,
            updated_at: new Date()
        });
        
    } catch (err) {
        console.error(`❌ Error refreshing schema:`, err);
        res.status(500).json({ 
            error: 'Failed to refresh schema: ' + err.message 
        });
    }
});

// API: Get schema discovery status and health
app.get('/api/schema/status', (req, res) => {
    try {
        const summary = schemaManager.getSchemaSummary();
        
        res.json({
            success: true,
            status: 'active',
            schemas: summary,
            intelligent_search_ready: intelligentSearch.contentCache.size > 0,
            dynamic_context_loaded: dynamicSchemaContext !== 'Schema loading...',
            total_discovered_tables: Object.values(summary).reduce((sum, s) => sum + s.tables.length, 0)
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get schema status: ' + err.message 
        });
    }
});

// ============================================================================
// UNSTRUCTURED DATA ENDPOINTS (THIRD DATA SOURCE)
// ============================================================================

// API: Query unstructured data with natural language
app.post('/api/query-unstructured', async (req, res) => {
    const { question } = req.body;
    
    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }
    
    try {
        console.log(`🔍 Querying unstructured data: "${question}"`);
        
        const result = await unstructuredData.queryWithLLM(question, model);
        
        res.json({
            success: result.success,
            question: question,
            analysis: result.analysis,
            dataEntriesAnalyzed: result.dataEntriesAnalyzed,
            sampleData: result.sampleData,
            error: result.error
        });
        
    } catch (err) {
        console.error('❌ Error querying unstructured data:', err.message);
        res.status(500).json({ 
            error: 'Failed to query unstructured data: ' + err.message 
        });
    }
});

// API: Get unstructured data statistics
app.get('/api/unstructured-stats', (req, res) => {
    try {
        const stats = unstructuredData.getStats();
        
        res.json({
            success: true,
            stats: stats
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get unstructured data stats: ' + err.message 
        });
    }
});

// API: Search unstructured data with filters
app.post('/api/search-unstructured', async (req, res) => {
    const { query, type, merchant, category, productId, sentiment, limit } = req.body;
    
    try {
        const results = unstructuredData.searchData(query || '', {
            type,
            merchant,
            category,
            productId,
            sentiment,
            limit: limit || 50
        });
        
        res.json({
            success: true,
            query: query,
            filters: { type, merchant, category, productId, sentiment },
            totalResults: results.length,
            results: results
        });
        
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to search unstructured data: ' + err.message 
        });
    }
});

// API: Get product sentiment from unstructured data
app.get('/api/product-sentiment/:productId', (req, res) => {
    const { productId } = req.params;
    
    try {
        const sentiment = unstructuredData.getProductSentiment(productId);
        
        res.json({
            success: true,
            productId: productId,
            sentiment: sentiment
        });
        
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get product sentiment: ' + err.message 
        });
    }
});

// API: Get support tickets
app.get('/api/support-tickets', (req, res) => {
    const { merchant, category, status, priority, limit } = req.query;
    
    try {
        const tickets = unstructuredData.getSupportTickets({
            merchant,
            category,
            status,
            priority,
            limit: limit ? parseInt(limit) : 50
        });
        
        res.json({
            success: true,
            totalTickets: tickets.length,
            tickets: tickets
        });
        
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get support tickets: ' + err.message 
        });
    }
});

// API: Get social media posts
app.get('/api/social-media', (req, res) => {
    const { merchant, category, sentiment, platform, limit } = req.query;
    
    try {
        const posts = unstructuredData.getSocialMediaPosts({
            merchant,
            category,
            sentiment,
            platform,
            limit: limit ? parseInt(limit) : 50
        });
        
        res.json({
            success: true,
            totalPosts: posts.length,
            posts: posts
        });
        
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get social media posts: ' + err.message 
        });
    }
});

// API: Get product reviews
app.get('/api/product-reviews', (req, res) => {
    const { merchant, category, productId, limit } = req.query;
    
    try {
        const reviews = unstructuredData.getProductReviews({
            merchant,
            category,
            productId,
            limit: limit ? parseInt(limit) : 50
        });
        
        res.json({
            success: true,
            totalReviews: reviews.length,
            reviews: reviews
        });
        
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get product reviews: ' + err.message 
        });
    }
});

// API: Get market reports
app.get('/api/market-reports', (req, res) => {
    const { category, type, impact, limit } = req.query;
    
    try {
        const reports = unstructuredData.getMarketReports({
            category,
            type,
            impact,
            limit: limit ? parseInt(limit) : 50
        });
        
        res.json({
            success: true,
            totalReports: reports.length,
            reports: reports
        });
        
    } catch (err) {
        res.status(500).json({ 
            error: 'Failed to get market reports: ' + err.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Integrated Federated Dashboard Server Running        ║
║                                                            ║
║   📍 URL: http://localhost:${PORT}                           ║
║   🔗 Connected to 3 Data Sources:                          ║
║                                                            ║
║   1️⃣  PostgreSQL: supply_chain_management (Merchant_one)   ║
║   2️⃣  PostgreSQL: merchant_two_supply_chain (Merchant_two) ║
║   3️⃣  Unstructured: Text Data (Reviews, Tickets, Social)  ║
║                                                            ║
║   🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not Configured'}                    ║
║   📊 Federated Query System: Ready                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await merchant1Pool.end();
    await merchant2Pool.end();
    process.exit(0);
});
