#!/usr/bin/env node

/**
 * Unstructured Data Handler for Federated Query System
 * 
 * This module handles querying unstructured data (customer reviews, support tickets, 
 * social media posts, market reports) using LLM-based semantic search and extraction.
 * 
 * Data Sources:
 * - Support Tickets (customer service issues)
 * - Social Media Posts (Twitter, Facebook, Instagram, YouTube)
 * - Product Reviews (customer feedback)
 * - Market Reports (industry insights)
 * 
 * This acts as the THIRD data source in the federated query system:
 * 1. Merchant_one (PostgreSQL - supply_chain_management)
 * 2. Merchant_two (PostgreSQL - merchant_two_supply_chain)
 * 3. Unstructured Data (Text files - queried via LLM)
 */

const fs = require('fs').promises;
const path = require('path');

class UnstructuredDataHandler {
    constructor(dataFilePath = null) {
        this.dataFilePath = dataFilePath || path.join(__dirname, 'unstructured_data_3000_entries.txt');
        this.data = null;
        this.parsedEntries = [];
        this.isInitialized = false;
        
        // Statistics
        this.stats = {
            totalEntries: 0,
            supportTickets: 0,
            socialMediaPosts: 0,
            productReviews: 0,
            marketReports: 0,
            products: new Set(),
            merchants: new Set(),
            categories: new Set()
        };
    }

    /**
     * Initialize and parse the unstructured data file
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('📄 Loading unstructured data from file...');
            this.data = await fs.readFile(this.dataFilePath, 'utf-8');
            
            // Parse the data into structured entries
            this.parseData();
            
            this.isInitialized = true;
            console.log(`✅ Unstructured data loaded: ${this.stats.totalEntries} entries`);
            console.log(`   - Support Tickets: ${this.stats.supportTickets}`);
            console.log(`   - Social Media Posts: ${this.stats.socialMediaPosts}`);
            console.log(`   - Product Reviews: ${this.stats.productReviews}`);
            console.log(`   - Market Reports: ${this.stats.marketReports}`);
            console.log(`   - Unique Products: ${this.stats.products.size}`);
            console.log(`   - Categories: ${Array.from(this.stats.categories).join(', ')}`);
            
        } catch (err) {
            console.error('❌ Error loading unstructured data:', err.message);
            throw err;
        }
    }

    /**
     * Parse the unstructured data into categorized entries
     */
    parseData() {
        // Split by entry markers
        const entries = this.data.split(/===\s+(?:SUPPORT TICKET|SOCIAL MEDIA POST|PRODUCT REVIEW|MARKET REPORT)\s+/);
        
        for (const entry of entries) {
            if (!entry.trim()) continue;
            
            const parsed = this.parseEntry(entry);
            if (parsed) {
                this.parsedEntries.push(parsed);
                this.updateStats(parsed);
            }
        }
    }

    /**
     * Parse a single entry
     */
    parseEntry(entryText) {
        const lines = entryText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;
        
        const entry = { rawText: entryText };
        
        // Determine entry type from first line
        const firstLine = lines[0];
        if (firstLine.includes('CS-')) {
            entry.type = 'support_ticket';
            this.stats.supportTickets++;
        } else if (firstLine.includes('SM-')) {
            entry.type = 'social_media';
            this.stats.socialMediaPosts++;
        } else if (firstLine.includes('RV-')) {
            entry.type = 'product_review';
            this.stats.productReviews++;
        } else if (firstLine.includes('MR-')) {
            entry.type = 'market_report';
            this.stats.marketReports++;
        } else {
            return null;
        }
        
        // Extract key-value pairs
        for (const line of lines) {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const key = match[1].toLowerCase();
                const value = match[2].replace(/^"|"$/g, '').trim();
                entry[key] = value;
            }
        }
        
        this.stats.totalEntries++;
        return entry;
    }

    /**
     * Update statistics
     */
    updateStats(entry) {
        if (entry.productid) this.stats.products.add(entry.productid);
        if (entry.merchant) this.stats.merchants.add(entry.merchant);
        if (entry.category) this.stats.categories.add(entry.category);
    }

    /**
     * Search unstructured data based on natural language query
     * This uses keyword matching and semantic understanding
     */
    searchData(query, options = {}) {
        const {
            type = null,           // Filter by type: 'support_ticket', 'social_media', 'product_review', 'market_report'
            merchant = null,       // Filter by merchant
            category = null,       // Filter by category
            productId = null,      // Filter by product ID
            sentiment = null,      // Filter by sentiment
            limit = 50             // Maximum results
        } = options;

        let results = [...this.parsedEntries];

        // Apply filters
        if (type) {
            results = results.filter(e => e.type === type);
        }
        
        if (merchant) {
            results = results.filter(e => 
                e.merchant && e.merchant.toLowerCase().includes(merchant.toLowerCase())
            );
        }
        
        if (category) {
            results = results.filter(e => 
                e.category && e.category.toLowerCase().includes(category.toLowerCase())
            );
        }
        
        if (productId) {
            results = results.filter(e => 
                e.productid && e.productid.toLowerCase().includes(productId.toLowerCase())
            );
        }
        
        if (sentiment) {
            results = results.filter(e => 
                e.sentiment && e.sentiment.toLowerCase() === sentiment.toLowerCase()
            );
        }

        // Keyword search in text content
        if (query && query.trim()) {
            const keywords = query.toLowerCase().split(/\s+/);
            results = results.filter(entry => {
                const searchText = JSON.stringify(entry).toLowerCase();
                return keywords.some(keyword => searchText.includes(keyword));
            });
        }

        // Limit results
        return results.slice(0, limit);
    }

    /**
     * Get all support tickets
     */
    getSupportTickets(filters = {}) {
        return this.searchData('', { ...filters, type: 'support_ticket' });
    }

    /**
     * Get all social media posts
     */
    getSocialMediaPosts(filters = {}) {
        return this.searchData('', { ...filters, type: 'social_media' });
    }

    /**
     * Get all product reviews
     */
    getProductReviews(filters = {}) {
        return this.searchData('', { ...filters, type: 'product_review' });
    }

    /**
     * Get all market reports
     */
    getMarketReports(filters = {}) {
        return this.searchData('', { ...filters, type: 'market_report' });
    }

    /**
     * Get customer sentiment analysis for a product
     */
    getProductSentiment(productId) {
        const entries = this.searchData('', { productId });
        
        const sentiments = {
            positive: 0,
            negative: 0,
            neutral: 0,
            total: entries.length
        };
        
        for (const entry of entries) {
            if (entry.sentiment) {
                const s = entry.sentiment.toLowerCase();
                if (s === 'positive') sentiments.positive++;
                else if (s === 'negative') sentiments.negative++;
                else if (s === 'neutral') sentiments.neutral++;
            }
        }
        
        return sentiments;
    }

    /**
     * Get statistics about the unstructured data
     */
    getStats() {
        return {
            ...this.stats,
            products: Array.from(this.stats.products),
            merchants: Array.from(this.stats.merchants),
            categories: Array.from(this.stats.categories)
        };
    }

    /**
     * Get raw data for LLM context
     * Returns a text summary suitable for LLM processing
     */
    getContextForLLM(query, maxEntries = 20) {
        const results = this.searchData(query, { limit: maxEntries });
        
        if (results.length === 0) {
            return 'No relevant unstructured data found.';
        }
        
        let context = `Found ${results.length} relevant unstructured data entries:\n\n`;
        
        for (const entry of results) {
            context += this.formatEntryForLLM(entry);
            context += '\n---\n\n';
        }
        
        return context;
    }

    /**
     * Format a single entry for LLM consumption
     */
    formatEntryForLLM(entry) {
        let formatted = `Type: ${entry.type.replace('_', ' ').toUpperCase()}\n`;
        
        if (entry.type === 'support_ticket') {
            formatted += `Ticket ID: ${entry.ticketid || 'N/A'}\n`;
            formatted += `Product: ${entry.productname || 'N/A'} (${entry.productid || 'N/A'})\n`;
            formatted += `Category: ${entry.category || 'N/A'}\n`;
            formatted += `Merchant: ${entry.merchant || 'N/A'}\n`;
            formatted += `Status: ${entry.status || 'N/A'}\n`;
            formatted += `Priority: ${entry.priority || 'N/A'}\n`;
            formatted += `Issue: ${entry.issuetype || 'N/A'}\n`;
            formatted += `Description: ${entry.description || 'N/A'}\n`;
            formatted += `Resolution: ${entry.resolution || 'N/A'}\n`;
        } else if (entry.type === 'social_media') {
            formatted += `Platform: ${entry.platform || 'N/A'}\n`;
            formatted += `User: ${entry.user || 'N/A'}\n`;
            formatted += `Product: ${entry.productname || 'N/A'} (${entry.productid || 'N/A'})\n`;
            formatted += `Category: ${entry.category || 'N/A'}\n`;
            formatted += `Merchant: ${entry.merchant || 'N/A'}\n`;
            formatted += `Sentiment: ${entry.sentiment || 'N/A'}\n`;
            formatted += `Content: ${entry.content || 'N/A'}\n`;
            formatted += `Engagement: ${entry.engagement || 'N/A'}\n`;
        } else if (entry.type === 'product_review') {
            formatted += `Product: ${entry.productname || 'N/A'} (${entry.productid || 'N/A'})\n`;
            formatted += `Category: ${entry.category || 'N/A'}\n`;
            formatted += `Merchant: ${entry.merchant || 'N/A'}\n`;
            formatted += `Rating: ${entry.rating || 'N/A'}\n`;
            formatted += `Verified: ${entry.verified || 'N/A'}\n`;
            formatted += `Review: ${entry.reviewtext || 'N/A'}\n`;
        } else if (entry.type === 'market_report') {
            formatted += `Report ID: ${entry.reportid || 'N/A'}\n`;
            formatted += `Type: ${entry.type || 'N/A'}\n`;
            formatted += `Category: ${entry.category || 'N/A'}\n`;
            formatted += `Key Finding: ${entry.keyfinding || 'N/A'}\n`;
            formatted += `Impact: ${entry.impact || 'N/A'}\n`;
            formatted += `Recommendation: ${entry.recommendation || 'N/A'}\n`;
        }
        
        return formatted;
    }

    /**
     * Query unstructured data with natural language using LLM analysis
     */
    async queryWithLLM(question, genAIModel) {
        try {
            // First, do a broad search to get relevant entries
            const keywords = this.extractKeywords(question);
            const relevantEntries = this.searchData(keywords, { limit: 30 });
            
            if (relevantEntries.length === 0) {
                return {
                    success: false,
                    message: 'No relevant unstructured data found for this query.',
                    data: []
                };
            }
            
            // Prepare context for LLM
            const context = this.getContextForLLM(keywords, 30);
            
            // Ask LLM to analyze and answer
            const prompt = `You are analyzing unstructured data (customer reviews, support tickets, social media posts, market reports) to answer a business question.

Question: ${question}

Available Unstructured Data:
${context}

Based on this unstructured data, provide:
1. A direct answer to the question
2. Key insights from the data
3. Any patterns or trends observed
4. Relevant statistics (if applicable)

Format your response as a clear, structured analysis.`;

            const result = await genAIModel.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            const analysis = result.text;
            
            return {
                success: true,
                analysis: analysis,
                dataEntriesAnalyzed: relevantEntries.length,
                sampleData: relevantEntries.slice(0, 5),
                rawEntries: relevantEntries
            };
            
        } catch (err) {
            console.error('❌ Error querying unstructured data with LLM:', err.message);
            return {
                success: false,
                error: err.message,
                data: []
            };
        }
    }

    /**
     * Extract keywords from a question
     */
    extractKeywords(question) {
        // Remove common words and extract meaningful terms
        const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about', 'show', 'me', 'all', 'find', 'get', 'list'];
        
        const words = question.toLowerCase().split(/\s+/);
        const keywords = words.filter(word => !stopWords.includes(word) && word.length > 2);
        
        return keywords.join(' ');
    }
}

module.exports = UnstructuredDataHandler;
