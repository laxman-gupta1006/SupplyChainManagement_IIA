# Supply Chain Management Web Application

A simple Express.js web application for managing supply chain data with CRUD operations. This application provides a user-friendly interface to view, update, and delete products and logistics information.

## 📊 Dataset Overview

Your dataset contains:
- **products_sales.csv**: Product information with sales data (100 products)
  - SKU, Product type, Price, Number of products sold, Revenue generated
- **supply_chain_logistics.csv**: Supply chain and logistics data (100 SKUs)
  - SKU, Supplier name, Location, Lead time, Production volumes, Manufacturing costs, Shipping carriers, Transportation modes, Costs

## 🚀 Quick Start

### Prerequisites

1. **Node.js**: Install Node.js (version 14 or higher)
   ```bash
   # Check if Node.js is installed
   node --version
   npm --version
   
   # Install from: https://nodejs.org/
   ```

### Setup and Run

1. **Install dependencies**:
   ```bash
   cd /Users/laxmangupta/IIA_Project/SupplyChainManagement
   npm install
   ```

2. **Start the application**:
   ```bash
   npm start
   ```

3. **Open in browser**:
   Navigate to `http://localhost:3000`

## 🌟 Features

- **View Data**: Browse all products and logistics information in organized tables
- **Update Records**: Edit product prices, sales data, supplier information, and logistics details
- **Delete Records**: Remove products and their associated logistics data
- **Real-time Updates**: Changes are immediately reflected in the interface
- **Responsive Design**: Works well on desktop and mobile devices

## 🏗️ Application Structure

```
SupplyChainManagement/
├── Merchant_one/Dataset/           # Original CSV data files
│   ├── products_sales.csv
│   └── supply_chain_logistics.csv
├── public/                         # Static files (CSS, JS, images)
│   ├── script.js                  # Client-side JavaScript
│   └── style.css                  # Application styles
├── views/                         # EJS templates
│   └── index.ejs                  # Main application page
├── server.js                      # Express server and API routes
├── package.json                   # Node.js dependencies
├── supply_chain_management.db     # SQLite database
└── README.md                      # This file
```

## 🔧 API Endpoints

- `GET /` - Main application page
- `GET /api/products` - Get all products with logistics data
- `PUT /api/products/:sku` - Update a product record
- `DELETE /api/products/:sku` - Delete a product and its logistics data

## � Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection errors**:
   - Ensure the SQLite database file exists
   - Check file permissions

3. **Dependencies not installed**:
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📱 Usage

1. **View Products**: The main page displays all products with their logistics information
2. **Update Product**: Click "Edit" next to any product to modify its details
3. **Delete Product**: Click "Delete" to remove a product and its associated logistics data
4. **Search**: Use the search functionality to find specific products by SKU or type

## � Technical Details

- **Backend**: Node.js with Express.js framework
- **Database**: SQLite for lightweight, file-based storage
- **Frontend**: HTML5, CSS3, and vanilla JavaScript
- **Template Engine**: EJS for server-side rendering
- **API**: RESTful endpoints for CRUD operations

## 📝 Development

To modify the application:

1. **Server logic**: Edit `server.js`
2. **Frontend styling**: Modify `public/style.css`
3. **Client behavior**: Update `public/script.js`
4. **Page layout**: Change `views/index.ejs`

---

**Happy managing! �**