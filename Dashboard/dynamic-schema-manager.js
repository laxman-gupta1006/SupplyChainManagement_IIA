/**
 * Dynamic Schema Manager
 * Automatically discovers and maintains database schemas without manual configuration
 * Provides crash-proof, adaptive schema management for any PostgreSQL database
 */

class DynamicSchemaManager {
    constructor() {
        this.schemas = new Map(); // merchantName -> schema info
        this.schemaCache = new Map(); // Cache for performance
        this.lastUpdate = new Map(); // Track last schema update time
        this.updateInterval = 5 * 60 * 1000; // Update schemas every 5 minutes
        this.maxRetries = 3;
        this.isUpdating = false;
    }

    /**
     * Initialize schema discovery for all merchants
     */
    async initializeSchemas(pools) {
        console.log('🔍 Initializing dynamic schema discovery...');
        
        const promises = Object.entries(pools).map(async ([merchantName, pool]) => {
            try {
                await this.discoverSchema(merchantName, pool);
                console.log(`✅ Schema discovered for ${merchantName}`);
            } catch (err) {
                console.error(`❌ Failed to discover schema for ${merchantName}:`, err.message);
                // Don't crash - continue with other merchants
                this.schemas.set(merchantName, this.getEmptySchema());
            }
        });

        await Promise.allSettled(promises);
        
        // Set up automatic schema refresh
        this.startAutoRefresh(pools);
        
        console.log('🚀 Dynamic schema manager ready!');
        return this.generateUnifiedSchemaContext();
    }

    /**
     * Discover complete schema for a single merchant database
     */
    async discoverSchema(merchantName, pool, retryCount = 0) {
        try {
            console.log(`🔍 Discovering schema for ${merchantName}...`);
            
            // Step 1: Get all tables
            const tablesQuery = `
                SELECT 
                    table_name,
                    table_type,
                    table_schema
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `;
            
            const tablesResult = await pool.query(tablesQuery);
            const tables = {};

            // Step 2: For each table, get detailed column information
            for (const tableRow of tablesResult.rows) {
                const tableName = tableRow.table_name;
                
                try {
                    // Get column details
                    const columnsQuery = `
                        SELECT 
                            column_name,
                            data_type,
                            is_nullable,
                            column_default,
                            character_maximum_length,
                            numeric_precision,
                            numeric_scale
                        FROM information_schema.columns 
                        WHERE table_name = $1 
                        AND table_schema = 'public'
                        ORDER BY ordinal_position
                    `;
                    
                    const columnsResult = await pool.query(columnsQuery, [tableName]);
                    
                    // Get sample data to understand content patterns
                    const sampleQuery = `SELECT * FROM ${tableName} LIMIT 5`;
                    const sampleResult = await pool.query(sampleQuery);
                    
                    // Get row count
                    const countQuery = `SELECT COUNT(*) as row_count FROM ${tableName}`;
                    const countResult = await pool.query(countQuery);
                    
                    // Analyze column content for better understanding
                    const columnAnalysis = await this.analyzeTableColumns(pool, tableName, columnsResult.rows);
                    
                    tables[tableName] = {
                        columns: columnsResult.rows.map(col => ({
                            name: col.column_name,
                            type: col.data_type,
                            nullable: col.is_nullable === 'YES',
                            default: col.column_default,
                            maxLength: col.character_maximum_length,
                            precision: col.numeric_precision,
                            scale: col.numeric_scale,
                            analysis: columnAnalysis[col.column_name] || {}
                        })),
                        sampleData: sampleResult.rows,
                        rowCount: parseInt(countResult.rows[0].row_count),
                        textColumns: columnsResult.rows
                            .filter(col => ['character varying', 'text', 'varchar', 'char'].includes(col.data_type))
                            .map(col => col.column_name),
                        numericColumns: columnsResult.rows
                            .filter(col => ['integer', 'bigint', 'numeric', 'decimal', 'real', 'double precision'].includes(col.data_type))
                            .map(col => col.column_name),
                        dateColumns: columnsResult.rows
                            .filter(col => ['date', 'timestamp', 'timestamptz'].includes(col.data_type))
                            .map(col => col.column_name)
                    };
                    
                    console.log(`   📊 Table ${tableName}: ${columnsResult.rows.length} columns, ${tables[tableName].rowCount} rows`);
                    
                } catch (tableErr) {
                    console.warn(`   ⚠️ Error analyzing table ${tableName}:`, tableErr.message);
                    // Don't fail completely - create minimal table info
                    tables[tableName] = this.getMinimalTableSchema(tableName);
                }
            }

            // Step 3: Detect relationships and patterns
            const relationships = await this.detectTableRelationships(pool, tables);
            const semanticPatterns = this.detectSemanticPatterns(tables);

            const schemaInfo = {
                merchantName,
                lastUpdated: new Date(),
                tables,
                relationships,
                semanticPatterns,
                summary: {
                    totalTables: Object.keys(tables).length,
                    totalColumns: Object.values(tables).reduce((sum, table) => sum + table.columns.length, 0),
                    textColumns: Object.values(tables).reduce((sum, table) => sum + table.textColumns.length, 0),
                    totalRows: Object.values(tables).reduce((sum, table) => sum + table.rowCount, 0)
                }
            };

            this.schemas.set(merchantName, schemaInfo);
            this.lastUpdate.set(merchantName, Date.now());
            
            console.log(`✅ Schema discovery complete for ${merchantName}:`, schemaInfo.summary);
            return schemaInfo;

        } catch (err) {
            console.error(`❌ Schema discovery failed for ${merchantName}:`, err.message);
            
            if (retryCount < this.maxRetries) {
                console.log(`🔄 Retrying schema discovery for ${merchantName} (${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
                return this.discoverSchema(merchantName, pool, retryCount + 1);
            }
            
            // After max retries, return minimal schema to prevent crashes
            const minimalSchema = this.getEmptySchema();
            this.schemas.set(merchantName, minimalSchema);
            return minimalSchema;
        }
    }

    /**
     * Analyze individual table columns for content patterns
     */
    async analyzeTableColumns(pool, tableName, columns) {
        const analysis = {};
        
        for (const column of columns) {
            if (['character varying', 'text', 'varchar'].includes(column.data_type)) {
                try {
                    // Get unique values sample for pattern recognition
                    const uniqueQuery = `
                        SELECT DISTINCT ${column.column_name} as value, COUNT(*) as frequency
                        FROM ${tableName} 
                        WHERE ${column.column_name} IS NOT NULL 
                        AND LENGTH(TRIM(${column.column_name})) > 0
                        GROUP BY ${column.column_name}
                        ORDER BY COUNT(*) DESC
                        LIMIT 20
                    `;
                    
                    const uniqueResult = await pool.query(uniqueQuery);
                    
                    analysis[column.column_name] = {
                        uniqueValues: uniqueResult.rows,
                        patterns: this.detectColumnPatterns(uniqueResult.rows),
                        semanticType: this.inferSemanticType(column.column_name, uniqueResult.rows)
                    };
                    
                } catch (colErr) {
                    console.warn(`   ⚠️ Error analyzing column ${column.column_name}:`, colErr.message);
                    analysis[column.column_name] = { error: colErr.message };
                }
            }
        }
        
        return analysis;
    }

    /**
     * Detect patterns in column data
     */
    detectColumnPatterns(uniqueValues) {
        const patterns = {
            isEmail: false,
            isPhone: false,
            isCompanyName: false,
            isProductName: false,
            isLocation: false,
            isCategory: false,
            avgLength: 0,
            commonPrefixes: new Set(),
            commonSuffixes: new Set()
        };

        if (uniqueValues.length === 0) return patterns;

        const values = uniqueValues.map(row => row.value).filter(Boolean);
        
        // Email pattern
        patterns.isEmail = values.some(val => /\S+@\S+\.\S+/.test(val));
        
        // Phone pattern
        patterns.isPhone = values.some(val => /[\d\s\-\(\)\+]{7,}/.test(val));
        
        // Company name patterns
        patterns.isCompanyName = values.some(val => 
            /\b(ltd|limited|inc|incorporated|corp|corporation|llc|pvt|private|traders?)\b/i.test(val)
        );
        
        // Location patterns
        patterns.isLocation = values.some(val => 
            /\b(street|st|avenue|ave|road|rd|city|town|state|country|zip|postal)\b/i.test(val)
        );
        
        // Average length
        patterns.avgLength = values.reduce((sum, val) => sum + val.length, 0) / values.length;
        
        // Common prefixes and suffixes
        values.forEach(val => {
            if (val.length > 3) {
                patterns.commonPrefixes.add(val.substring(0, 3).toLowerCase());
                patterns.commonSuffixes.add(val.substring(val.length - 3).toLowerCase());
            }
        });
        
        return patterns;
    }

    /**
     * Infer semantic type of column based on name and content
     */
    inferSemanticType(columnName, uniqueValues) {
        const name = columnName.toLowerCase();
        const sampleValues = uniqueValues.slice(0, 5).map(row => row.value?.toLowerCase() || '');
        
        // Supplier/Vendor detection
        if (name.includes('supplier') || name.includes('vendor') || name.includes('company')) {
            return 'supplier';
        }
        
        // Product detection
        if (name.includes('product') || name.includes('item') || name.includes('goods')) {
            return 'product';
        }
        
        // Category detection
        if (name.includes('category') || name.includes('type') || name.includes('class')) {
            return 'category';
        }
        
        // Location detection
        if (name.includes('location') || name.includes('address') || name.includes('city') || name.includes('place')) {
            return 'location';
        }
        
        // Name detection
        if (name.includes('name') || name.includes('title')) {
            // Determine if it's likely a company, product, or person name
            if (sampleValues.some(val => val.includes('ltd') || val.includes('corp') || val.includes('inc'))) {
                return 'company_name';
            }
            return 'name';
        }
        
        return 'text';
    }

    /**
     * Detect relationships between tables
     */
    async detectTableRelationships(pool, tables) {
        const relationships = [];
        
        try {
            // Query foreign key constraints
            const fkQuery = `
                SELECT 
                    tc.constraint_name,
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE constraint_type = 'FOREIGN KEY'
            `;
            
            const fkResult = await pool.query(fkQuery);
            relationships.push(...fkResult.rows);
            
        } catch (err) {
            console.warn('⚠️ Could not detect formal relationships:', err.message);
        }
        
        // Also detect implicit relationships based on column names
        const implicitRelationships = this.detectImplicitRelationships(tables);
        relationships.push(...implicitRelationships);
        
        return relationships;
    }

    /**
     * Detect semantic patterns across tables
     */
    detectSemanticPatterns(tables) {
        const patterns = {
            supplierColumns: [],
            productColumns: [],
            locationColumns: [],
            amountColumns: [],
            dateColumns: []
        };
        
        Object.entries(tables).forEach(([tableName, tableInfo]) => {
            tableInfo.columns.forEach(column => {
                const semanticType = column.analysis?.semanticType;
                const columnName = column.name.toLowerCase();
                
                if (semanticType === 'supplier' || columnName.includes('supplier') || columnName.includes('vendor')) {
                    patterns.supplierColumns.push({ table: tableName, column: column.name });
                }
                
                if (semanticType === 'product' || columnName.includes('product') || columnName.includes('item')) {
                    patterns.productColumns.push({ table: tableName, column: column.name });
                }
                
                if (semanticType === 'location' || columnName.includes('location') || columnName.includes('address')) {
                    patterns.locationColumns.push({ table: tableName, column: column.name });
                }
                
                if (columnName.includes('amount') || columnName.includes('price') || columnName.includes('cost') || columnName.includes('revenue')) {
                    patterns.amountColumns.push({ table: tableName, column: column.name });
                }
                
                if (column.type.includes('date') || column.type.includes('timestamp')) {
                    patterns.dateColumns.push({ table: tableName, column: column.name });
                }
            });
        });
        
        return patterns;
    }

    /**
     * Generate unified schema context for AI
     */
    generateUnifiedSchemaContext() {
        let context = `
🤖 DYNAMIC DATABASE SCHEMA CONTEXT
This schema is automatically discovered and updated. Do not assume any specific table or column names.

AVAILABLE DATABASES:
`;

        for (const [merchantName, schema] of this.schemas.entries()) {
            context += `\n📊 ${merchantName.toUpperCase()} DATABASE:\n`;
            context += `   └─ Last Updated: ${schema.lastUpdated}\n`;
            context += `   └─ Tables: ${schema.summary.totalTables}, Columns: ${schema.summary.totalColumns}, Rows: ${schema.summary.totalRows}\n\n`;
            
            // Add table details
            Object.entries(schema.tables).forEach(([tableName, tableInfo]) => {
                context += `   📋 Table: ${tableName} (${tableInfo.rowCount} rows)\n`;
                
                // Group columns by type for better readability
                const columnGroups = {
                    text: tableInfo.textColumns,
                    numeric: tableInfo.numericColumns,
                    date: tableInfo.dateColumns
                };
                
                Object.entries(columnGroups).forEach(([type, columns]) => {
                    if (columns.length > 0) {
                        context += `      └─ ${type}: ${columns.join(', ')}\n`;
                    }
                });
                
                // Add semantic information
                if (tableInfo.columns.some(col => col.analysis?.semanticType)) {
                    const semanticColumns = tableInfo.columns
                        .filter(col => col.analysis?.semanticType)
                        .map(col => `${col.name} (${col.analysis.semanticType})`)
                        .join(', ');
                    
                    if (semanticColumns) {
                        context += `      └─ semantic types: ${semanticColumns}\n`;
                    }
                }
                
                context += '\n';
            });
            
            // Add semantic patterns
            if (schema.semanticPatterns) {
                context += `   🧠 SEMANTIC PATTERNS:\n`;
                Object.entries(schema.semanticPatterns).forEach(([type, columns]) => {
                    if (columns.length > 0) {
                        context += `      └─ ${type}: ${columns.map(c => `${c.table}.${c.column}`).join(', ')}\n`;
                    }
                });
                context += '\n';
            }
        }

        context += `
🎯 QUERY GENERATION RULES:
1. Use ONLY the tables and columns listed above
2. Always use ILIKE for text searches (case-insensitive)
3. Handle NULL values gracefully with COALESCE when needed
4. Use semantic column mapping (supplier columns for company searches, etc.)
5. Generate proper PostgreSQL syntax
6. If a table/column doesn't exist, return an appropriate error message

🔍 INTELLIGENT SEARCH:
- Use % wildcards for partial matching
- Consider semantic column types for better targeting
- Handle variations in company names, product names, etc.
`;

        return context;
    }

    /**
     * Get minimal table schema for error cases
     */
    getMinimalTableSchema(tableName) {
        return {
            columns: [],
            sampleData: [],
            rowCount: 0,
            textColumns: [],
            numericColumns: [],
            dateColumns: []
        };
    }

    /**
     * Get empty schema for failed merchant connections
     */
    getEmptySchema() {
        return {
            merchantName: 'unknown',
            lastUpdated: new Date(),
            tables: {},
            relationships: [],
            semanticPatterns: {},
            summary: {
                totalTables: 0,
                totalColumns: 0,
                textColumns: 0,
                totalRows: 0
            }
        };
    }

    /**
     * Start automatic schema refresh
     */
    startAutoRefresh(pools) {
        setInterval(async () => {
            if (this.isUpdating) return;
            
            console.log('🔄 Auto-refreshing database schemas...');
            this.isUpdating = true;
            
            try {
                for (const [merchantName, pool] of Object.entries(pools)) {
                    const lastUpdate = this.lastUpdate.get(merchantName) || 0;
                    
                    if (Date.now() - lastUpdate > this.updateInterval) {
                        await this.discoverSchema(merchantName, pool);
                    }
                }
            } catch (err) {
                console.error('❌ Error in auto-refresh:', err.message);
            }
            
            this.isUpdating = false;
        }, this.updateInterval);
    }

    /**
     * Get current schema for a merchant
     */
    getSchema(merchantName) {
        return this.schemas.get(merchantName) || this.getEmptySchema();
    }

    /**
     * Get all schemas
     */
    getAllSchemas() {
        return Object.fromEntries(this.schemas);
    }

    /**
     * Detect implicit relationships based on column names
     */
    detectImplicitRelationships(tables) {
        const relationships = [];
        
        // Look for columns with similar names across tables
        const tableNames = Object.keys(tables);
        
        for (let i = 0; i < tableNames.length; i++) {
            for (let j = i + 1; j < tableNames.length; j++) {
                const table1 = tables[tableNames[i]];
                const table2 = tables[tableNames[j]];
                
                // Find potentially related columns
                table1.columns.forEach(col1 => {
                    table2.columns.forEach(col2 => {
                        if (this.areColumnsRelated(col1.name, col2.name)) {
                            relationships.push({
                                type: 'implicit',
                                table1: tableNames[i],
                                column1: col1.name,
                                table2: tableNames[j],
                                column2: col2.name,
                                confidence: this.calculateRelationshipConfidence(col1.name, col2.name)
                            });
                        }
                    });
                });
            }
        }
        
        return relationships;
    }

    /**
     * Check if two columns are potentially related
     */
    areColumnsRelated(name1, name2) {
        const n1 = name1.toLowerCase();
        const n2 = name2.toLowerCase();
        
        // Direct name matches
        if (n1 === n2) return true;
        
        // Semantic matches
        const synonyms = [
            ['supplier', 'vendor'],
            ['product', 'item'],
            ['location', 'address', 'place'],
            ['amount', 'price', 'cost', 'revenue'],
            ['name', 'title']
        ];
        
        return synonyms.some(group => 
            group.some(word => n1.includes(word)) && 
            group.some(word => n2.includes(word))
        );
    }

    /**
     * Calculate confidence score for relationship
     */
    calculateRelationshipConfidence(name1, name2) {
        if (name1.toLowerCase() === name2.toLowerCase()) return 1.0;
        
        // Use basic string similarity
        const longer = name1.length > name2.length ? name1 : name2;
        const shorter = name1.length > name2.length ? name2 : name1;
        
        const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
        return Math.max(0, (longer.length - editDistance) / longer.length);
    }

    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Force refresh schema for a merchant
     */
    async refreshSchema(merchantName, pool) {
        console.log(`🔄 Force refreshing schema for ${merchantName}...`);
        return this.discoverSchema(merchantName, pool);
    }

    /**
     * Get schema summary for debugging
     */
    getSchemaSummary() {
        const summary = {};
        
        for (const [merchantName, schema] of this.schemas.entries()) {
            summary[merchantName] = {
                lastUpdated: schema.lastUpdated,
                tables: Object.keys(schema.tables),
                totalColumns: schema.summary.totalColumns,
                totalRows: schema.summary.totalRows,
                hasErrors: Object.values(schema.tables).some(table => table.columns.length === 0)
            };
        }
        
        return summary;
    }
}

module.exports = DynamicSchemaManager;