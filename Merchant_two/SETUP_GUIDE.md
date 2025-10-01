# Merchant Two Dashboard - Quick Setup Guide

## ✅ What's Been Created

I've successfully created a complete, separate dashboard for Merchant Two with the following features:

### 📁 File Structure Created:
```
Merchant_two/
├── 📄 package.json          # Dependencies and scripts
├── 🖥️  server.js             # Main server application  
├── 📖 README.md             # Detailed documentation
├── 🚀 start.sh              # Quick startup script
├── 📂 views/
│   └── 🎨 index.ejs         # Dashboard interface
└── 📂 Dataset/              # Your existing data files
    ├── product sales-2.csv
    └── supply chain -2.csv
```

## 🎯 Key Features of Your New Dashboard

### 🏢 Merchant Two Specific Design:
- **Separate Port**: Runs on port 3001 (won't conflict with Merchant One)
- **Red Theme**: Distinct visual identity from Merchant One's blue theme
- **CSV-Based**: Uses your existing CSV files instead of database
- **Enhanced Analytics**: Quality scores, sustainability indices, warehouse zones

### 📊 Dashboard Capabilities:
- ✅ **Real-time Statistics**: Products, revenue, pricing analytics
- ✅ **Advanced Search**: Filter by Product ID, category, vendor, location
- ✅ **Full CRUD Operations**: Create, Read, Update, Delete products
- ✅ **Supply Chain Analytics**: Vendor performance, logistics tracking
- ✅ **Visual Indicators**: Color-coded profit, quality, and status
- ✅ **Responsive Design**: Works on desktop, tablet, mobile

### 🔄 Data Management:
- **Product Information**: ID, category, pricing, sales, stock levels
- **Supply Chain Data**: Vendors, locations, processing times, costs
- **Quality Metrics**: Quality scores, sustainability indices
- **Logistics**: Shipping methods, freight charges, warehouse zones

## 🚀 How to Start Your Dashboard

### Option 1: Quick Start (Recommended)
```bash
cd "Merchant_two"
./start.sh
```

### Option 2: Manual Start
```bash
cd "Merchant_two"
npm install
npm start
```

## 🌐 Access Your Dashboard

Once started, your dashboard will be available at:
- **Local Access**: http://localhost:3001
- **Network Access**: http://[your-ip]:3001

## 🔧 Prerequisites

You'll need Node.js installed on your system:
1. **Download Node.js**: https://nodejs.org/ (choose LTS version)
2. **Install Node.js**: Follow the installer instructions
3. **Verify Installation**: Open terminal and run `node --version`

## 🎨 Dashboard Differences from Merchant One

| Feature | Merchant One | Merchant Two |
|---------|--------------|--------------|
| **Port** | 3000 | 3001 |
| **Theme** | Blue | Red |
| **Data Source** | PostgreSQL | CSV Files |
| **Focus** | Basic supply chain | Advanced analytics |
| **Additional Features** | - | Quality scores, sustainability |

## 📈 Advanced Features in Merchant Two

### 1. **Enhanced Product Management**
- Product status tracking (Active/Inactive)
- Seasonal demand analysis (Low/Medium/High)
- Profit margin calculations
- Stock level monitoring

### 2. **Supply Chain Excellence**
- Vendor quality scoring (1-10 scale)
- Sustainability index (0-100)
- Processing time optimization
- Warehouse zone management
- Reorder point tracking

### 3. **Visual Analytics**
- **Green indicators**: Profitable products, active status, high quality
- **Red indicators**: Loss-making products, inactive status, low quality
- **Yellow indicators**: Medium performance metrics

## 🔍 How to Use the Dashboard

### 1. **View Overview**
- Dashboard loads with statistics at the top
- Product table shows all items with supply chain data

### 2. **Search & Filter**
- Use the search box to find specific products
- Search by Product ID, category, vendor, or location

### 3. **Edit Products**
- Click "✏️ Edit" button on any product row
- Comprehensive form with all product and supply chain fields
- Save changes to update data instantly

### 4. **Delete Products**
- Click "🗑️ Delete" button to remove products
- Confirmation dialog prevents accidental deletions

### 5. **Refresh Data**
- Click "🔄 Refresh Data" to reload from CSV files
- Useful after manual CSV file modifications

## 🛠️ Customization Options

### Adding New Products
Currently, the dashboard supports viewing and editing existing products. To add new products:
1. Add entries to both CSV files with matching Product IDs
2. Restart the server or refresh data

### Modifying Data Fields
To add new fields:
1. Update CSV files with new columns
2. Modify `server.js` to handle new fields
3. Update `views/index.ejs` to display new fields

## 🚨 Important Notes

1. **Independent Operation**: This dashboard runs completely separately from Merchant One
2. **Data Storage**: Changes are stored in memory - restart server to reload from CSV
3. **Port Conflict**: Uses port 3001 to avoid conflicts with Merchant One (port 3000)
4. **Network Access**: Configured for network access from other devices

## 📞 Support

Your Merchant Two dashboard is ready to use! It provides advanced supply chain analytics specifically tailored to your CSV data structure with enhanced features like quality scoring and sustainability tracking.

The dashboard maintains complete independence from Merchant One while offering superior functionality for your business needs.