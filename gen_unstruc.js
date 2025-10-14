const fs = require('fs');

// Merchant data from your CSVs
const merchant1Products = [
  {id: "ITEM001", name: "Dove Cleanser", category: "skincare", brand: "Dove"},
  {id: "ITEM002", name: "Garnier Hair Mask", category: "haircare", brand: "Garnier"},
  {id: "ITEM003", name: "Lakme Eyeliner", category: "cosmetics", brand: "Lakme"},
  {id: "ITEM004", name: "Axe Body Spray", category: "fragrance", brand: "Axe"},
  {id: "ITEM005", name: "Patanjali Face Pack", category: "wellness", brand: "Patanjali"},
  {id: "ITEM006", name: "LOreal Concealer", category: "cosmetics", brand: "LOreal"},
  {id: "ITEM007", name: "Maybelline Mascara", category: "cosmetics", brand: "Maybelline"},
  {id: "ITEM008", name: "Fogg Perfume", category: "fragrance", brand: "Fogg"},
  {id: "ITEM009", name: "Zandu Natural Soap", category: "wellness", brand: "Zandu"},
  {id: "ITEM010", name: "Axe Perfume", category: "fragrance", brand: "Axe"},
  {id: "ITEM011", name: "Zandu Face Pack", category: "wellness", brand: "Zandu"},
  {id: "ITEM012", name: "Garnier Shampoo", category: "haircare", brand: "Garnier"},
  {id: "ITEM013", name: "LOreal Concealer", category: "cosmetics", brand: "LOreal"},
  {id: "ITEM014", name: "Head & Shoulders Hair Oil", category: "haircare", brand: "Head & Shoulders"},
  {id: "ITEM015", name: "Baidyanath Herbal Oil", category: "wellness", brand: "Baidyanath"},
  {id: "ITEM016", name: "Davidoff Body Mist", category: "fragrance", brand: "Davidoff"},
  {id: "ITEM017", name: "Lakme Eyeliner", category: "cosmetics", brand: "Lakme"},
  {id: "ITEM018", name: "Pantene Conditioner", category: "haircare", brand: "Pantene"},
  {id: "ITEM019", name: "Calvin Klein Perfume", category: "fragrance", brand: "Calvin Klein"},
  {id: "ITEM020", name: "Pantene Conditioner", category: "haircare", brand: "Pantene"},
  {id: "ITEM021", name: "Pantene Hair Oil", category: "haircare", brand: "Pantene"},
  {id: "ITEM022", name: "Calvin Klein Deodorant", category: "fragrance", brand: "Calvin Klein"},
  {id: "ITEM023", name: "Olay Toner", category: "skincare", brand: "Olay"},
  {id: "ITEM024", name: "Garnier Hair Serum", category: "haircare", brand: "Garnier"},
  {id: "ITEM025", name: "TRESemme Hair Spray", category: "haircare", brand: "TRESemme"},
  {id: "ITEM026", name: "MAC Eyeliner", category: "cosmetics", brand: "MAC"},
  {id: "ITEM027", name: "Pantene Shampoo", category: "haircare", brand: "Pantene"},
  {id: "ITEM028", name: "Patanjali Natural Soap", category: "wellness", brand: "Patanjali"},
  {id: "ITEM029", name: "Garnier Hair Serum", category: "haircare", brand: "Garnier"},
  {id: "ITEM030", name: "Lakme Foundation", category: "cosmetics", brand: "Lakme"},
  {id: "ITEM031", name: "Axe Perfume", category: "fragrance", brand: "Axe"},
  {id: "ITEM032", name: "Hugo Boss Body Spray", category: "fragrance", brand: "Hugo Boss"},
  {id: "ITEM033", name: "LOreal Foundation", category: "cosmetics", brand: "LOreal"},
  {id: "ITEM034", name: "Zandu Ayurvedic Cream", category: "wellness", brand: "Zandu"},
  {id: "ITEM035", name: "LOreal Mascara", category: "cosmetics", brand: "LOreal"},
  {id: "ITEM036", name: "MAC Foundation", category: "cosmetics", brand: "MAC"},
  {id: "ITEM037", name: "Neutrogena Moisturizer", category: "skincare", brand: "Neutrogena"},
  {id: "ITEM038", name: "Dabur Herbal Tea", category: "wellness", brand: "Dabur"},
  {id: "ITEM039", name: "Dabur Ayurvedic Cream", category: "wellness", brand: "Dabur"},
  {id: "ITEM040", name: "Himalaya Cleanser", category: "skincare", brand: "Himalaya"},
  {id: "ITEM041", name: "Baidyanath Natural Soap", category: "wellness", brand: "Baidyanath"},
  {id: "ITEM042", name: "Neutrogena Cleanser", category: "skincare", brand: "Neutrogena"},
  {id: "ITEM043", name: "Garnier Hair Mask", category: "haircare", brand: "Garnier"},
  {id: "ITEM044", name: "Sunsilk Hair Serum", category: "haircare", brand: "Sunsilk"},
  {id: "ITEM045", name: "Zandu Herbal Tea", category: "wellness", brand: "Zandu"},
  {id: "ITEM046", name: "MAC Concealer", category: "cosmetics", brand: "MAC"},
  {id: "ITEM047", name: "Fogg Body Mist", category: "fragrance", brand: "Fogg"},
  {id: "ITEM048", name: "Organic India Herbal Tea", category: "wellness", brand: "Organic India"},
  {id: "ITEM049", name: "Dove Toner", category: "skincare", brand: "Dove"},
  {id: "ITEM050", name: "Maybelline Concealer", category: "cosmetics", brand: "Maybelline"}
];

const merchant2Products = [
  {id: "P-7002", name: "Skincare Product", category: "skincare"},
  {id: "P-7003", name: "Haircare Product", category: "haircare"},
  {id: "P-7004", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7005", name: "Skincare Product", category: "skincare"},
  {id: "P-7006", name: "Haircare Product", category: "haircare"},
  {id: "P-7007", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7008", name: "Skincare Product", category: "skincare"},
  {id: "P-7009", name: "Haircare Product", category: "haircare"},
  {id: "P-7010", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7011", name: "Skincare Product", category: "skincare"},
  {id: "P-7012", name: "Haircare Product", category: "haircare"},
  {id: "P-7013", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7014", name: "Skincare Product", category: "skincare"},
  {id: "P-7015", name: "Haircare Product", category: "haircare"},
  {id: "P-7016", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7017", name: "Skincare Product", category: "skincare"},
  {id: "P-7018", name: "Haircare Product", category: "haircare"},
  {id: "P-7019", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7020", name: "Skincare Product", category: "skincare"},
  {id: "P-7021", name: "Haircare Product", category: "haircare"},
  {id: "P-7022", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7023", name: "Skincare Product", category: "skincare"},
  {id: "P-7024", name: "Haircare Product", category: "haircare"},
  {id: "P-7025", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7026", name: "Skincare Product", category: "skincare"},
  {id: "P-7027", name: "Haircare Product", category: "haircare"},
  {id: "P-7028", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7029", name: "Skincare Product", category: "skincare"},
  {id: "P-7030", name: "Haircare Product", category: "haircare"},
  {id: "P-7031", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7032", name: "Skincare Product", category: "skincare"},
  {id: "P-7033", name: "Haircare Product", category: "haircare"},
  {id: "P-7034", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7035", name: "Skincare Product", category: "skincare"},
  {id: "P-7036", name: "Haircare Product", category: "haircare"},
  {id: "P-7037", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7038", name: "Skincare Product", category: "skincare"},
  {id: "P-7039", name: "Haircare Product", category: "haircare"},
  {id: "P-7040", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7041", name: "Skincare Product", category: "skincare"},
  {id: "P-7042", name: "Haircare Product", category: "haircare"},
  {id: "P-7043", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7044", name: "Skincare Product", category: "skincare"},
  {id: "P-7045", name: "Haircare Product", category: "haircare"},
  {id: "P-7046", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7047", name: "Skincare Product", category: "skincare"},
  {id: "P-7048", name: "Haircare Product", category: "haircare"},
  {id: "P-7049", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7050", name: "Skincare Product", category: "skincare"},
  {id: "P-7051", name: "Haircare Product", category: "haircare"},
  {id: "P-7052", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7053", name: "Skincare Product", category: "skincare"},
  {id: "P-7054", name: "Haircare Product", category: "haircare"},
  {id: "P-7055", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7056", name: "Skincare Product", category: "skincare"},
  {id: "P-7057", name: "Haircare Product", category: "haircare"},
  {id: "P-7058", name: "Cosmetics Product", category: "cosmetics"},
  {id: "P-7059", name: "Skincare Product", category: "skincare"},
  {id: "P-7060", name: "Haircare Product", category: "haircare"}
];

// Data generation arrays
const firstNames = ["Priya", "Amit", "Neha", "Rahul", "Sneha", "Raj", "Anjali", "Vikram", "Pooja", "Karan", "Divya", "Sanjay", "Meera", "Arun", "Shweta", "Nitin", "Kavita", "Rohit", "Sunita", "Manoj"];
const lastNames = ["Sharma", "Patel", "Gupta", "Kumar", "Singh", "Reddy", "Mehta", "Verma", "Jain", "Malhotra", "Choudhury", "Bose", "Rao", "Chopra", "Saxena", "Mishra", "Tiwari", "Yadav", "Pandey", "Nair"];
const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];
const platforms = ["Twitter", "Instagram", "Facebook", "TikTok", "YouTube", "BeautyBlogs", "SkinCareForum", "HairCareCommunity", "MakeupAddicts"];
const sentimentTypes = ["positive", "negative", "neutral", "mixed"];
const issueTypes = ["delivery", "quality", "packaging", "allergy", "performance", "price", "availability", "customer_service"];
const reviewPlatforms = ["Amazon", "Flipkart", "Nykaa", "Myntra", "Purplle", "BeautyReview", "MakeupAlley", "InfluencerPost"];

// Helper functions
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomEmail() {
  return `${getRandomItem(firstNames).toLowerCase()}.${getRandomItem(lastNames).toLowerCase()}@${getRandomItem(domains)}`;
}

function generateSupportTicket(entryId, product) {
  const ticketId = `CS-2025-${1000 + entryId}`;
  const merchant = product.id.startsWith("ITEM") ? "Merchant1" : "Merchant2";
  const issue = getRandomItem(issueTypes);
  
  const issueDescriptions = {
    delivery: `Package arrived 4 days late with damaged outer box. Tracking wasn't updated properly.`,
    quality: `Product consistency seems different from previous order - ${getRandomItem(["thinner texture", "different color", "stronger smell", "grainy particles"])}.`,
    packaging: `${getRandomItem(["Seal was broken", "Bottle was leaking", "Box was crushed", "Cap was cracked"])} upon delivery.`,
    allergy: `Developed ${getRandomItem(["redness", "itching", "rashes", "swelling"])} after using the product despite claims of being suitable for sensitive skin.`,
    performance: `Product doesn't ${getRandomItem(["last as long as advertised", "provide the promised results", "work well with my skin type", "match the color description"])}.`,
    price: `Found the same product for ${Math.floor(Math.random() * 40) + 10}% less on another platform. Price match policy wasn't honored.`,
    availability: `Product shown as in stock but order was cancelled due to inventory issues. Waited ${Math.floor(Math.random() * 10) + 2} days for notification.`,
    customer_service: `Customer service representative was ${getRandomItem(["unhelpful", "rude", "uninformed", "slow to respond"])} about my issue.`
  };

  const resolutions = {
    delivery: `Express replacement shipped with complimentary gift. Refunded shipping charges.`,
    quality: `Quality team investigating batch ${"B" + (2024000 + Math.floor(Math.random() * 1000))}. Full refund processed.`,
    packaging: `Replacement sent with upgraded packaging. Feedback forwarded to vendor.`,
    allergy: `Medical consultation arranged. Product sent for laboratory testing. Full refund issued.`,
    performance: `Product specialist provided usage guidance. Partial refund as goodwill gesture.`,
    price: `Price difference refunded. Future discount code provided for inconvenience.`,
    availability: `Priority notification enabled for restock. Alternative product suggestions provided.`,
    customer_service: `Service recovery discount applied. Case escalated to service quality team.`
  };

  return `=== SUPPORT TICKET ${ticketId} ===
TicketID: ${ticketId}
Customer: ${getRandomEmail()}
ProductID: ${product.id}
ProductName: ${product.name}
Category: ${product.category}
Merchant: ${merchant}
Date: ${getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31)).toISOString().split('T')[0]}
Status: ${getRandomItem(["Resolved", "Open", "In Progress", "Escalated"])}
Priority: ${getRandomItem(["High", "Medium", "Low", "Critical"])}
IssueType: ${issue}
Description: "${issueDescriptions[issue]} Customer from ${getRandomItem(cities)} reported additional concerns about ${getRandomItem(["product authenticity", "expiry date", "missing items", "wrong product shipped"])}."
Resolution: "${resolutions[issue]} ${getRandomItem(["Customer satisfaction survey sent", "Follow-up scheduled", "Case closed with customer approval", "Quality improvement initiated"])}."
AgentNotes: "Customer has ${getRandomItem(["previous positive history", "multiple recent complaints", "been with us for 2+ years", "first-time purchase"])}. ${getRandomItem(["Loyalty points added", "Premium support enabled", "Feedback recorded for product improvement", "Vendor notified about pattern"])}."\n`;
}

function generateSocialMediaPost(entryId, product) {
  const platform = getRandomItem(platforms);
  const sentiment = getRandomItem(sentimentTypes);
  const merchant = product.id.startsWith("ITEM") ? "Merchant1" : "Merchant2";
  
  const positivePosts = [
    `Just tried ${product.name} and WOW! ${getRandomItem(["My skin has never felt better", "The results are incredible", "Worth every penny", "Already seeing amazing results"])}!`,
    `Shoutout to ${merchant} for ${product.name}! ${getRandomItem(["Life-changing product", "Holy grail found", "My new favorite", "Game-changer alert"])} 💫`,
    `If you're looking for a good ${product.category} product, ${product.name} is ${getRandomItem(["absolutely fantastic", "worth trying", "highly recommended", "surprisingly effective"])}!`,
    `My ${getRandomItem(["third", "fifth", "tenth"])} purchase of ${product.name} and still loving it! ${getRandomItem(["Consistent quality", "Reliable results", "Never disappoints", "Always delivers"])} 👍`
  ];

  const negativePosts = [
    `Disappointed with ${product.name} from ${merchant}. ${getRandomItem(["Didn't work as expected", "Poor quality", "Not worth the price", "Caused issues"])} 😞`,
    `Expected so much from ${product.name} but ${getRandomItem(["it fell short", "complete letdown", "didn't deliver", "was underwhelming"])}. ${getRandomItem(["Returning it", "Won't repurchase", "Looking for alternatives", "Very disappointed"])}.`,
    `Warning about ${product.name}: ${getRandomItem(["Broke me out", "Irritated my skin", "Smells terrible", "Packaging leaked"])}. ${getRandomItem(["Be cautious", "Read reviews first", "Patch test recommended", "Not for sensitive types"])}!`,
    `${merchant} needs to improve ${product.name}. ${getRandomItem(["Quality control issues", "Inconsistent batches", "Poor performance", "Bad customer experience"])} reported.`
  ];

  const neutralPosts = [
    `Trying out ${product.name} from ${merchant}. ${getRandomItem(["First impressions tomorrow", "Will update with results", "Testing phase started", "Review coming soon"])}.`,
    `Has anyone used ${product.name}? ${getRandomItem(["Looking for reviews", "Considering purchase", "Need opinions", "Would love feedback"])} before I buy.`,
    `Comparing ${product.name} with ${getRandomItem(["similar products", "competing brands", "previous version", "alternative options"])}. ${getRandomItem(["Detailed review upcoming", "Testing different approaches", "Methodology in progress", "Analysis phase"])}.`,
    `Received ${product.name} today. ${getRandomItem(["Packaging looks good", "First application done", "Initial thoughts positive", "Will monitor results"])}. Full review after ${Math.floor(Math.random() * 14) + 7} days of use.`
  ];

  let content;
  if (sentiment === "positive") content = getRandomItem(positivePosts);
  else if (sentiment === "negative") content = getRandomItem(negativePosts);
  else content = getRandomItem(neutralPosts);

  return `=== SOCIAL MEDIA POST SM-${2025000 + entryId} ===
Platform: ${platform}
User: @${getRandomItem(firstNames).toLowerCase()}${getRandomItem(["Beauty", "Style", "Care", "Review", "Diaries", "Lover", "Expert"])}${Math.floor(Math.random() * 1000)}
ProductID: ${product.id}
ProductName: ${product.name}
Category: ${product.category}
Merchant: ${merchant}
Date: ${getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31)).toISOString()}
Sentiment: ${sentiment}
Content: "${content}"
Engagement: ${Math.floor(Math.random() * 500) + 10} ${getRandomItem(["likes", "retweets", "shares", "views"])}, ${Math.floor(Math.random() * 100) + 5} ${getRandomItem(["comments", "replies", "mentions", "quotes"])}
Hashtags: ${getRandomItem(["#skincare", "#haircare", "#cosmetics", "#beauty", "#review", "#makeup", "#selfcare", "#productreview"])} ${getRandomItem(["#indianbeauty", "#madeinindia", "#beautycommunity", "#skincareroutine"])}\n`;
}

function generateProductReview(entryId, product) {
  const platform = getRandomItem(reviewPlatforms);
  const rating = Math.floor(Math.random() * 5) + 1;
  const merchant = product.id.startsWith("ITEM") ? "Merchant1" : "Merchant2";
  
  const reviewTemplates = [
    `After ${Math.floor(Math.random() * 8) + 2} weeks of using ${product.name}, I can confidently say this is ${getRandomItem(["one of the best", "a decent", "an average", "a disappointing"])} ${product.category} product. ${getRandomItem(["Packaging is practical", "Scent is pleasant", "Texture is nice", "Application is easy"])} but ${getRandomItem(["long-term results are questionable", "it could be improved", "there's room for enhancement", "competitors do it better"])}.`,
    
    `As someone with ${getRandomItem(["sensitive", "oily", "dry", "combination", "normal"])} ${product.category === "skincare" ? "skin" : "hair"}, I found ${product.name} to be ${getRandomItem(["very effective", "moderately helpful", "somewhat useful", "completely ineffective"])}. ${getRandomItem(["The price point is justified", "It's reasonably priced", "A bit expensive for what it offers", "Overpriced compared to alternatives"])}.`,
    
    `Compared to ${getRandomItem(["other brands I've tried", "my previous product", "market leaders", "budget alternatives"])}, ${product.name} ${getRandomItem(["stands out positively", "holds its own", "falls somewhere in the middle", "doesn't measure up"])}. ${getRandomItem(["Would repurchase", "Might consider alternatives", "Probably won't buy again", "Definitely switching"])}.`,
    
    `The ${getRandomItem(["consistency", "fragrance", "packaging", "performance", "ingredients"])} of ${product.name} is ${getRandomItem(["outstanding", "good", "average", "poor"])}. ${getRandomItem(["Lasts all day", "Fades quickly", "Builds up nicely", "Requires multiple applications"])} and ${getRandomItem(["works well with other products", "doesn't layer well", "mixes beautifully", "clashes with my routine"])}.`
  ];

  return `=== PRODUCT REVIEW RV-${2025000 + entryId} ===
ReviewID: RV-${2025000 + entryId}
Platform: ${platform}
ProductID: ${product.id}
ProductName: ${product.name}
Category: ${product.category}
Merchant: ${merchant}
Reviewer: ${getRandomItem(firstNames)} ${getRandomItem(lastNames)}
Rating: ${rating}/5
Date: ${getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31)).toISOString()}
Title: "${getRandomItem(["Great product with minor issues", "Exactly what I needed", "Mixed feelings", "Below expectations", "Surprisingly good", "Average performance"])}"
Content: "${getRandomItem(reviewTemplates)} ${getRandomItem(["Delivery was prompt", "Packaging could be better", "Customer service was helpful", "Would recommend with reservations", "Perfect for beginners", "Better options available"])}."
VerifiedPurchase: ${getRandomItem(["Yes", "No"])}
HelpfulVotes: ${Math.floor(Math.random() * 50)}\n`;
}

function generateMarketReport(entryId) {
  const reportTypes = ["Consumer Trends", "Competitor Analysis", "Market Share", "Product Performance", "Regional Analysis"];
  const reportType = getRandomItem(reportTypes);
  const focusCategory = getRandomItem(["skincare", "haircare", "cosmetics", "fragrance", "wellness"]);
  
  const insights = {
    "Consumer Trends": [
      `Growing demand for ${getRandomItem(["sustainable packaging", "clean beauty", "Ayurvedic formulations", "gender-neutral products", "multi-purpose items"])} in ${focusCategory} segment.`,
      `Consumers increasingly prioritizing ${getRandomItem(["ingredient transparency", "cruelty-free certification", "local sourcing", "clinical testing", "natural formulas"])} when choosing ${focusCategory} products.`,
      `Shift towards ${getRandomItem(["digital-first brands", "subscription models", "personalized solutions", "community-driven marketing", "influencer collaborations"])} observed in ${focusCategory} market.`
    ],
    "Competitor Analysis": [
      `${getRandomItem(["L'Oreal", "Unilever", "Procter & Gamble", "Estee Lauder", "Natura"])} gaining market share through ${getRandomItem(["aggressive pricing", "innovative formulations", "celebrity endorsements", "digital marketing", "retail expansion"])}.`,
      `New entrants focusing on ${getRandomItem(["niche segments", "direct-to-consumer", "subscription boxes", "customization", "sustainability"])} challenging established ${focusCategory} brands.`,
      `Competitor ${getRandomItem(["product launch", "pricing strategy", "marketing campaign", "retail partnership", "acquisition"])} impacting ${focusCategory} category performance.`
    ],
    "Market Share": [
      `Premium ${focusCategory} segment growing at ${Math.floor(Math.random() * 30) + 15}% annually, outpacing mass market.`,
      `E-commerce now accounts for ${Math.floor(Math.random() * 40) + 30}% of ${focusCategory} sales, up from previous year.`,
      `Regional variations: ${getRandomItem(["South India", "Metro cities", "Tier 2 cities", "North East markets"])} showing strongest ${focusCategory} growth at ${Math.floor(Math.random() * 25) + 10}%.`
    ]
  };

  return `=== MARKET REPORT MR-${2025000 + entryId} ===
ReportID: MR-${2025000 + entryId}
Type: ${reportType}
Category: ${focusCategory}
Publisher: ${getRandomItem(["BeautyMarketInsights", "ConsumerResearchGroup", "IndustryAnalystsInc", "MarketWatchBeauty", "TrendForecasters"])}
Date: ${getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31)).toISOString().split('T')[0]}
KeyFinding: "${getRandomItem(insights[reportType] || insights["Consumer Trends"])}"
Impact: ${getRandomItem(["High", "Medium", "Low"])}
Recommendation: "${getRandomItem(["Increase marketing spend", "Review pricing strategy", "Expand product line", "Improve digital presence", "Enhance customer experience", "Optimize supply chain"])} for ${focusCategory} products."
Region: ${getRandomItem(["National", "South Asia", "Global", getRandomItem(cities) + " Metro Area"])}
Confidence: ${Math.floor(Math.random() * 40) + 60}%\n`;
}

// Main generation function
function generateUnstructuredData() {
  let data = "# UNSTRUCTURED DATA FOR FEDERATED QUERY SYSTEM\n";
  data += "# Generated: " + new Date().toISOString() + "\n";
  data += "# Total Entries: 3000\n# Products Covered: 110\n\n";
  
  const allProducts = [...merchant1Products, ...merchant2Products];
  const entryTypes = [generateSupportTicket, generateSocialMediaPost, generateProductReview, generateMarketReport];
  
  for (let i = 1; i <= 3000; i++) {
    if (i % 100 === 0) {
      console.log(`Generated ${i} entries...`);
    }
    
    const entryType = getRandomItem(entryTypes);
    let entry;
    
    if (entryType === generateMarketReport) {
      entry = generateMarketReport(i);
    } else {
      const product = getRandomItem(allProducts);
      entry = entryType(i, product);
    }
    
    data += entry + "\n";
  }
  
  return data;
}

// Generate and save the data
console.log("Starting generation of 3000 unstructured data entries...");
const unstructuredData = generateUnstructuredData();

fs.writeFile('unstructured_data_3000_entries.txt', unstructuredData, (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('Successfully generated unstructured_data_3000_entries.txt');
    console.log('File contains 3000 unique entries across both merchants');
  }
});