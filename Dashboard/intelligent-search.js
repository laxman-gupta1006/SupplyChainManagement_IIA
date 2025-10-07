/**
 * Universal Intelligent Search System
 * Works dynamically with ALL database entries without manual configuration
 * Finds similar terms, fuzzy matches, and semantic relationships automatically
 */

const Fuse = require('fuse.js');
const natural = require('natural');
const levenshtein = require('fast-levenshtein');
const jaroWinkler = require('jaro-winkler');

class UniversalIntelligentSearch {
    constructor() {
        this.contentCache = new Map(); // Cache for database content analysis
        this.similarityCache = new Map(); // Cache for computed similarities
        this.semanticPatterns = new Map(); // Auto-discovered semantic patterns
        
        // Configurable matching algorithms with weights
        this.algorithms = {
            levenshtein: { weight: 0.3, threshold: 0.6 },
            jaroWinkler: { weight: 0.3, threshold: 0.7 },
            soundex: { weight: 0.2, threshold: 1.0 }, // Exact match for soundex
            metaphone: { weight: 0.2, threshold: 1.0 } // Exact match for metaphone
        };
        
        // Auto-discovery patterns for semantic relationships
        this.semanticIndicators = {
            // Product categories that might be related
            categoryPatterns: [
                { pattern: /lipstick|lip\s*stick/i, category: 'cosmetics' },
                { pattern: /phone|mobile|smartphone/i, category: 'electronics' },
                { pattern: /shirt|pant|dress|cloth/i, category: 'apparel' },
                { pattern: /food|snack|beverage/i, category: 'consumables' }
            ],
            
            // Company name variations (automatically detect these patterns)
            companyPatterns: [
                { pattern: /\b([A-Z]\.?\s*[A-Z]\.?\s*)/i, type: 'initials' }, // K.P, A.B, etc.
                { pattern: /\b(\w+)\s+(?:traders?|corp|ltd|inc|pvt)/i, type: 'company_suffix' },
                { pattern: /\b(\w+)\s+(\w+)\s+(?:traders?|corp|ltd)/i, type: 'full_name_company' }
            ]
        };
    }

    /**
     * Analyze all database content to build intelligent search index
     */
    async analyzeAllDatabaseContent(merchant1Pool, merchant2Pool) {
        console.log('🧠 Analyzing all database content for intelligent search...');
        
        try {
            // Get all content from both databases
            const m1Data = await this.extractAllContent(merchant1Pool, 'merchant1');
            const m2Data = await this.extractAllContent(merchant2Pool, 'merchant2');
            
            const allContent = [...m1Data, ...m2Data];
            
            // Build comprehensive content index
            this.buildContentIndex(allContent);
            
            // Discover semantic patterns automatically
            this.discoverSemanticPatterns(allContent);
            
            console.log(`✅ Analyzed ${allContent.length} database entries`);
            console.log(`📊 Discovered ${this.semanticPatterns.size} semantic patterns`);
            
            return true;
        } catch (error) {
            console.error('❌ Error analyzing database content:', error);
            return false;
        }
    }

    /**
     * Dynamically discover database schema and extract all searchable content
     */
    async extractAllContent(pool, merchantName) {
        const allContent = [];
        
        try {
            // Step 1: Discover all tables in the database
            const tablesResult = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
            `);
            
            console.log(`📊 Found ${tablesResult.rows.length} tables in ${merchantName}:`, 
                tablesResult.rows.map(r => r.table_name).join(', '));
            
            // Step 2: For each table, discover its columns
            for (const tableRow of tablesResult.rows) {
                const tableName = tableRow.table_name;
                
                try {
                    // Get column information
                    const columnsResult = await pool.query(`
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = $1 
                        AND table_schema = 'public'
                        AND data_type IN ('character varying', 'text', 'varchar')
                    `, [tableName]);
                    
                    if (columnsResult.rows.length === 0) {
                        console.log(`   ⏭️  Skipping ${tableName} - no text columns found`);
                        continue;
                    }
                    
                    const textColumns = columnsResult.rows.map(col => col.column_name);
                    console.log(`   📝 Text columns in ${tableName}:`, textColumns.join(', '));
                    
                    // Step 3: Extract data from text columns
                    const dataResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 500`);
                    
                    dataResult.rows.forEach(row => {
                        textColumns.forEach(column => {
                            if (row[column] && row[column].toString().trim()) {
                                allContent.push({
                                    merchant: merchantName,
                                    table: tableName,
                                    field: column,
                                    value: row[column].toString().trim(),
                                    fullRow: row
                                });
                            }
                        });
                    });
                    
                    console.log(`   ✅ Extracted ${dataResult.rows.length} rows from ${tableName}`);
                    
                } catch (tableErr) {
                    console.log(`   ❌ Error processing table ${tableName}:`, tableErr.message);
                }
            }
            
        } catch (err) {
            console.error(`❌ Error discovering schema for ${merchantName}:`, err.message);
        }
        
        console.log(`📊 Total content extracted from ${merchantName}: ${allContent.length} items`);
        return allContent;
    }

    /**
     * Build searchable content index for fast fuzzy matching
     */
    buildContentIndex(allContent) {
        // Group content by type for better matching
        const contentGroups = {
            products: [],
            companies: [],
            locations: [],
            categories: []
        };
        
        allContent.forEach(item => {
            const value = item.value.toLowerCase();
            
            // Categorize content automatically
            if (item.field.includes('product') || item.field.includes('category')) {
                contentGroups.products.push(item);
            } else if (item.field.includes('supplier') || item.field.includes('vendor')) {
                contentGroups.companies.push(item);
            } else if (item.field.includes('location')) {
                contentGroups.locations.push(item);
            } else {
                contentGroups.categories.push(item);
            }
        });
        
        // Create Fuse.js indexes for each group
        this.contentCache.set('products', new Fuse(contentGroups.products, {
            keys: ['value'],
            threshold: 0.4,
            includeScore: true
        }));
        
        this.contentCache.set('companies', new Fuse(contentGroups.companies, {
            keys: ['value'],
            threshold: 0.3, // Stricter for company names
            includeScore: true
        }));
        
        this.contentCache.set('locations', new Fuse(contentGroups.locations, {
            keys: ['value'],
            threshold: 0.4,
            includeScore: true
        }));
        
        this.contentCache.set('categories', new Fuse(contentGroups.categories, {
            keys: ['value'],
            threshold: 0.5,
            includeScore: true
        }));
    }

    /**
     * Automatically discover semantic patterns from database content
     */
    discoverSemanticPatterns(allContent) {
        const valueFrequency = new Map();
        const cooccurrenceMatrix = new Map();
        
        // Analyze value frequency and co-occurrence
        allContent.forEach(item => {
            const value = item.value.toLowerCase();
            valueFrequency.set(value, (valueFrequency.get(value) || 0) + 1);
            
            // Find items from same row (likely related)
            const relatedValues = allContent
                .filter(other => other.fullRow === item.fullRow && other.value !== item.value)
                .map(other => other.value.toLowerCase());
            
            relatedValues.forEach(related => {
                const key = `${value}|${related}`;
                cooccurrenceMatrix.set(key, (cooccurrenceMatrix.get(key) || 0) + 1);
            });
        });
        
        // Build semantic relationships based on co-occurrence
        for (const [key, frequency] of cooccurrenceMatrix.entries()) {
            if (frequency >= 2) { // Appeared together at least twice
                const [term1, term2] = key.split('|');
                
                if (!this.semanticPatterns.has(term1)) {
                    this.semanticPatterns.set(term1, new Set());
                }
                this.semanticPatterns.get(term1).add(term2);
                
                if (!this.semanticPatterns.has(term2)) {
                    this.semanticPatterns.set(term2, new Set());
                }
                this.semanticPatterns.get(term2).add(term1);
            }
        }
        
        // Apply predefined semantic indicators
        this.semanticIndicators.categoryPatterns.forEach(indicator => {
            allContent.forEach(item => {
                if (indicator.pattern.test(item.value)) {
                    const itemLower = item.value.toLowerCase();
                    if (!this.semanticPatterns.has(itemLower)) {
                        this.semanticPatterns.set(itemLower, new Set());
                    }
                    this.semanticPatterns.get(itemLower).add(indicator.category);
                    
                    // Also create reverse mapping
                    if (!this.semanticPatterns.has(indicator.category)) {
                        this.semanticPatterns.set(indicator.category, new Set());
                    }
                    this.semanticPatterns.get(indicator.category).add(itemLower);
                }
            });
        });
        
        // Auto-discover company name variations
        this.semanticIndicators.companyPatterns.forEach(pattern => {
            allContent.forEach(item => {
                if (item.field.toLowerCase().includes('supplier') || 
                    item.field.toLowerCase().includes('vendor')) {
                    
                    const match = pattern.pattern.exec(item.value);
                    if (match) {
                        const normalized = this.normalizeCompanyName(item.value);
                        
                        if (!this.semanticPatterns.has(normalized)) {
                            this.semanticPatterns.set(normalized, new Set());
                        }
                        this.semanticPatterns.get(normalized).add(item.value.toLowerCase());
                    }
                }
            });
        });
    }

    /**
     * Perform universal intelligent search on any query
     */
    performIntelligentSearch(query, contentType = 'all') {
        const searchTerms = this.extractSearchTerms(query);
        let allResults = [];
        
        searchTerms.forEach(term => {
            // Direct fuzzy search
            const fuzzyResults = this.performFuzzySearch(term, contentType);
            allResults = allResults.concat(fuzzyResults);
            
            // Semantic expansion search
            const expandedTerms = this.getSemanticExpansions(term);
            expandedTerms.forEach(expandedTerm => {
                const semanticResults = this.performFuzzySearch(expandedTerm, contentType);
                allResults = allResults.concat(semanticResults);
            });
            
            // Phonetic matching
            const phoneticMatches = this.getPhoneticMatches(term, contentType);
            allResults = allResults.concat(phoneticMatches);
        });
        
        // Remove duplicates and rank by relevance
        return this.rankAndDeduplicateResults(allResults, query);
    }

    /**
     * Extract meaningful search terms from query
     */
    extractSearchTerms(query) {
        // Remove stop words and extract meaningful terms
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'from', 'to', 'with', 'by', 'for']);
        
        return query.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
            .map(word => word.replace(/[^\w]/g, ''));
    }

    /**
     * Get semantic expansions for a term
     */
    getSemanticExpansions(term) {
        const expansions = new Set();
        
        // Check direct semantic patterns
        if (this.semanticPatterns.has(term)) {
            this.semanticPatterns.get(term).forEach(related => expansions.add(related));
        }
        
        // Check partial matches in semantic patterns
        for (const [key, values] of this.semanticPatterns.entries()) {
            if (key.includes(term) || term.includes(key)) {
                values.forEach(value => expansions.add(value));
            }
        }
        
        return Array.from(expansions);
    }

    /**
     * Perform fuzzy search using multiple algorithms
     */
    performFuzzySearch(term, contentType) {
        const results = [];
        
        try {
            // Determine which content groups to search
            const searchGroups = contentType === 'all' 
                ? ['products', 'companies', 'locations', 'categories']
                : [contentType];
            
            searchGroups.forEach(groupName => {
                try {
                    const fuseIndex = this.contentCache.get(groupName);
                    if (fuseIndex) {
                        const fuseResults = fuseIndex.search(term);
                        
                        fuseResults.forEach(result => {
                            try {
                                const similarity = this.calculateMultiAlgorithmSimilarity(term, result.item.value);
                                
                                if (similarity.combined >= 0.4) { // Lower threshold for better matching
                                    results.push({
                                        ...result.item,
                                        searchTerm: term,
                                        similarity: similarity,
                                        matchType: 'fuzzy',
                                        contentGroup: groupName
                                    });
                                }
                            } catch (simErr) {
                                console.warn('⚠️ Similarity calculation error:', simErr.message);
                            }
                        });
                    }
                } catch (groupErr) {
                    console.warn(`⚠️ Error searching group ${groupName}:`, groupErr.message);
                }
            });
        } catch (err) {
            console.warn('⚠️ Error in fuzzy search:', err.message);
        }
        
        return results;
    }

    /**
     * Get phonetic matches using Soundex and Metaphone
     */
    getPhoneticMatches(term, contentType) {
        const results = [];
        
        try {
            const termSoundex = natural.SoundEx(term);
            const termMetaphone = natural.Metaphone(term);
            
            // Search through content cache for phonetic matches
            for (const [groupName, fuseIndex] of this.contentCache.entries()) {
                if (contentType !== 'all' && contentType !== groupName) continue;
                
                const docs = fuseIndex._docs || [];
                docs.forEach(item => {
                    try {
                        const valueSoundex = natural.SoundEx(item.value);
                        const valueMetaphone = natural.Metaphone(item.value);
                        
                        if (termSoundex === valueSoundex || termMetaphone === valueMetaphone) {
                            results.push({
                                ...item,
                                searchTerm: term,
                                matchType: 'phonetic',
                                phoneticMatch: {
                                    soundex: termSoundex === valueSoundex,
                                    metaphone: termMetaphone === valueMetaphone
                                },
                                contentGroup: groupName
                            });
                        }
                    } catch (itemErr) {
                        // Skip items that cause phonetic processing errors
                        console.warn('⚠️ Phonetic processing error for item:', item.value, itemErr.message);
                    }
                });
            }
        } catch (err) {
            console.warn('⚠️ Error in phonetic matching:', err.message);
        }
        
        return results;
    }

    /**
     * Calculate similarity using multiple algorithms
     */
    calculateMultiAlgorithmSimilarity(term1, term2) {
        const cacheKey = `${term1}|${term2}`;
        if (this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }
        
        const similarities = {};
        
        try {
            // Levenshtein distance (normalized)
            const maxLen = Math.max(term1.length, term2.length);
            similarities.levenshtein = maxLen > 0 ? 1 - (levenshtein.get(term1, term2) / maxLen) : 1;
            
            // Jaro-Winkler similarity
            similarities.jaroWinkler = jaroWinkler(term1, term2);
            
            // Soundex match - correct API usage
            const soundex1 = natural.SoundEx(term1);
            const soundex2 = natural.SoundEx(term2);
            similarities.soundex = soundex1 === soundex2 ? 1 : 0;
            
            // Metaphone match - correct API usage
            const metaphone1 = natural.Metaphone(term1);
            const metaphone2 = natural.Metaphone(term2);
            similarities.metaphone = metaphone1 === metaphone2 ? 1 : 0;
            
        } catch (err) {
            console.warn('⚠️ Error in similarity calculation:', err.message);
            // Fallback to basic similarity
            similarities.levenshtein = term1 === term2 ? 1 : 0.5;
            similarities.jaroWinkler = term1 === term2 ? 1 : 0.5;
            similarities.soundex = 0;
            similarities.metaphone = 0;
        }
        
        // Calculate weighted combined score
        similarities.combined = 
            (similarities.levenshtein * this.algorithms.levenshtein.weight) +
            (similarities.jaroWinkler * this.algorithms.jaroWinkler.weight) +
            (similarities.soundex * this.algorithms.soundex.weight) +
            (similarities.metaphone * this.algorithms.metaphone.weight);
        
        this.similarityCache.set(cacheKey, similarities);
        return similarities;
    }

    /**
     * Rank and deduplicate search results
     */
    rankAndDeduplicateResults(results, originalQuery) {
        // Remove duplicates based on value and merchant
        const uniqueResults = results.filter((result, index, self) => 
            index === self.findIndex(r => 
                r.value === result.value && 
                r.merchant === result.merchant &&
                r.table === result.table
            )
        );
        
        // Sort by relevance score
        return uniqueResults.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, originalQuery);
            const scoreB = this.calculateRelevanceScore(b, originalQuery);
            return scoreB - scoreA;
        });
    }

    /**
     * Normalize company names for better matching
     */
    normalizeCompanyName(companyName) {
        return companyName.toLowerCase()
            .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|pvt|private|traders?)\b/gi, '')
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ')    // Normalize spaces
            .trim();
    }

    /**
     * Calculate relevance score for ranking
     */
    calculateRelevanceScore(result, originalQuery) {
        let score = 0;
        
        // Base similarity score
        if (result.similarity) {
            score += result.similarity.combined * 100;
        }
        
        // Boost for exact matches
        if (result.value.toLowerCase().includes(originalQuery.toLowerCase())) {
            score += 50;
        }
        
        // Boost for semantic matches
        if (result.matchType === 'semantic') {
            score += 30;
        }
        
        // Boost for phonetic matches
        if (result.matchType === 'phonetic') {
            score += 20;
        }
        
        // Boost for company name matches (often more important)
        if (result.contentGroup === 'companies') {
            score += 15;
        }
        
        return score;
    }

    /**
     * Generate intelligent WHERE clauses for SQL queries
     */
    generateIntelligentWhereClause(searchTerm, tableName) {
        const matches = this.performIntelligentSearch(searchTerm);
        
        if (matches.length === 0) {
            return `(${tableName}.supplier ILIKE '%${searchTerm}%' OR ${tableName}.product_name ILIKE '%${searchTerm}%')`;
        }
        
        const conditions = [];
        
        // Group matches by field type
        const fieldMatches = {
            supplier: matches.filter(m => m.field.includes('supplier') || m.field.includes('vendor')),
            product: matches.filter(m => m.field.includes('product') || m.field.includes('category')),
            location: matches.filter(m => m.field.includes('location'))
        };
        
        // Generate ILIKE conditions for each field type
        Object.entries(fieldMatches).forEach(([fieldType, matchList]) => {
            if (matchList.length > 0) {
                const fieldName = this.getFieldName(fieldType, tableName);
                const likeConditions = matchList
                    .slice(0, 5) // Limit to top 5 matches to avoid overly complex queries
                    .map(match => `${fieldName} ILIKE '%${match.value}%'`)
                    .join(' OR ');
                
                if (likeConditions) {
                    conditions.push(`(${likeConditions})`);
                }
            }
        });
        
        return conditions.length > 0 
            ? conditions.join(' OR ')
            : `(${tableName}.supplier ILIKE '%${searchTerm}%' OR ${tableName}.product_name ILIKE '%${searchTerm}%')`;
    }

    /**
     * Dynamically map field types to actual database field names
     */
    getFieldName(fieldType, tableName) {
        // Try to find the best matching field name from our content cache
        for (const [groupName, fuseIndex] of this.contentCache.entries()) {
            const items = fuseIndex._docs || [];
            
            // Find fields that match the semantic type we're looking for
            const matchingFields = items.filter(item => {
                if (item.table !== tableName) return false;
                
                const fieldLower = item.field.toLowerCase();
                const typeLower = fieldType.toLowerCase();
                
                // Semantic matching for field types
                if (typeLower === 'supplier' || typeLower === 'companies') {
                    return fieldLower.includes('supplier') || fieldLower.includes('vendor') || 
                           fieldLower.includes('company') || fieldLower.includes('trader');
                }
                if (typeLower === 'product') {
                    return fieldLower.includes('product') || fieldLower.includes('name') || 
                           fieldLower.includes('item') || fieldLower.includes('category');
                }
                if (typeLower === 'location') {
                    return fieldLower.includes('location') || fieldLower.includes('address') || 
                           fieldLower.includes('city') || fieldLower.includes('place');
                }
                
                return fieldLower.includes(typeLower);
            });
            
            if (matchingFields.length > 0) {
                // Return the most common field name for this type
                const fieldCounts = {};
                matchingFields.forEach(item => {
                    fieldCounts[item.field] = (fieldCounts[item.field] || 0) + 1;
                });
                
                const bestField = Object.entries(fieldCounts)
                    .sort(([,a], [,b]) => b - a)[0];
                
                if (bestField) {
                    return bestField[0];
                }
            }
        }
        
        // Fallback to original field type if no mapping found
        return fieldType;
    }
}

module.exports = UniversalIntelligentSearch;