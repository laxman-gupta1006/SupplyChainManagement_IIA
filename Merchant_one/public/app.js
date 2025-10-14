// Supply Chain Management App - Client Side JavaScript

let allData = [];
let filteredData = [];
let currentEditSKU = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadStats();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', function() {
        filterData(this.value);
    });

    // Edit form submission
    const editForm = document.getElementById('editForm');
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });

    // Modal close on click outside
    const modal = document.getElementById('editModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Load all product data
async function loadData() {
    try {
        showLoading(true);
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
    allData = await response.json();
        filteredData = [...allData];
        
        renderTable();
        hideError();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        
        console.log('Stats received:', stats); // Debug log
        
        // Update stat cards
        document.getElementById('totalProducts').textContent = 
            stats.totalProducts?.[0]?.count || '0';
        
        const totalRevenue = parseFloat(stats.totalRevenue?.[0]?.total || 0);
        document.getElementById('totalRevenue').textContent = 
            '$' + totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        
        const avgPrice = parseFloat(stats.avgPrice?.[0]?.avg || 0);
        document.getElementById('avgPrice').textContent = 
            '$' + avgPrice.toFixed(2);
        
        document.getElementById('productTypes').textContent = 
            stats.productTypes?.length || '0';
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Filter data based on search term
function filterData(searchTerm) {
    if (!searchTerm) {
        filteredData = [...allData];
    } else {
        const term = searchTerm.toLowerCase();
        filteredData = allData.filter(item => 
            (item.item_id && item.item_id.toLowerCase().includes(term)) ||
            (item.product_category && item.product_category.toLowerCase().includes(term)) ||
            (item.product_name && item.product_name.toLowerCase().includes(term)) ||
            (item.brand_name && item.brand_name.toLowerCase().includes(term)) ||
            (item.vendor_company && item.vendor_company.toLowerCase().includes(term)) ||
            (item.business_location && item.business_location.toLowerCase().includes(term)) ||
            (item.logistics_partner && item.logistics_partner.toLowerCase().includes(term)) ||
            (item.shipping_method && item.shipping_method.toLowerCase().includes(term))
        );
    }
    renderTable();
}

// Render the data table
function renderTable() {
    const tableBody = document.getElementById('dataTableBody');
    const table = document.getElementById('dataTable');
    
    if (filteredData.length === 0) {
        table.style.display = 'none';
        if (allData.length === 0) {
            showError('No data available');
        } else {
            showError('No results found for your search');
        }
        return;
    }
    
    table.style.display = 'table';
    hideError();
    
    tableBody.innerHTML = filteredData.map(item => {
        const profit = parseFloat(item.profit_margin || item.profit_margin === 0 ? item.profit_margin : (item.profit_margin)) || (item.total_earnings && item.production_cost ? (item.total_earnings - item.production_cost - (parseFloat(item.logistics_fee)||0)) : 0);
        const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
        
        return `
            <tr>
                <td><strong>${item.item_id || 'N/A'}</strong></td>
                <td>${item.product_category || 'N/A'}</td>
                <td>${item.brand_name || 'N/A'}</td>
                <td>${item.product_name || 'N/A'}</td>
                <td>$${parseFloat(item.unit_cost || 0).toFixed(2)}</td>
                <td>${parseInt(item.quantity_sold || 0).toLocaleString()}</td>
                <td>$${parseFloat(item.total_earnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>${item.vendor_company || 'N/A'}</td>
                <td>${item.business_location || 'N/A'}</td>
                <td>${parseInt(item.delivery_time_days || 0)} days</td>
                <td class="${profitClass}">$${parseFloat(profit).toFixed(2)}</td>
                <td>
                    <button class="btn" onclick="editProduct('${item.item_id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteProduct('${item.item_id}')">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Open edit modal for a product
function editProduct(itemId) {
    const product = allData.find(item => item.item_id === itemId);
    if (!product) {
        showError('Product not found');
        return;
    }
    
    currentEditSKU = itemId;
    
    // Populate form fields
    document.getElementById('editSKU').textContent = itemId;
    document.getElementById('editProductCategory').value = product.product_category;
    document.getElementById('editUnitCost').value = product.unit_cost;
    document.getElementById('editQuantitySold').value = product.quantity_sold;
    document.getElementById('editTotalEarnings').value = product.total_earnings;
    document.getElementById('editVendorCompany').value = product.vendor_company;
    document.getElementById('editLocation').value = product.business_location;
    document.getElementById('editDeliveryTimeDays').value = product.delivery_time_days;
    document.getElementById('editOrderQuantity').value = product.order_quantity;
    document.getElementById('editProductionCost').value = product.production_cost;
    document.getElementById('editLogisticsPartner').value = product.logistics_partner;
    document.getElementById('editShippingMethod').value = product.shipping_method;
    document.getElementById('editLogisticsFee').value = product.logistics_fee;
    
    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

// Save product changes
async function saveProduct() {
    if (!currentEditSKU) return;
    
    const formData = {
        product_category: document.getElementById('editProductCategory').value,
        unit_cost: parseFloat(document.getElementById('editUnitCost').value),
        quantity_sold: parseInt(document.getElementById('editQuantitySold').value),
        total_earnings: parseFloat(document.getElementById('editTotalEarnings').value),
        vendor_company: document.getElementById('editVendorCompany').value,
        business_location: document.getElementById('editLocation').value,
        delivery_time_days: parseInt(document.getElementById('editDeliveryTimeDays').value),
        order_quantity: parseInt(document.getElementById('editOrderQuantity').value),
        production_cost: parseFloat(document.getElementById('editProductionCost').value),
        logistics_partner: document.getElementById('editLogisticsPartner').value,
        shipping_method: document.getElementById('editShippingMethod').value,
        logistics_fee: parseFloat(document.getElementById('editLogisticsFee').value)
    };
    
    try {
        const response = await fetch(`/api/products/${currentEditSKU}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Show success message
        showSuccess(`Product ${currentEditSKU} updated successfully!`);
        
        // Close modal
        closeModal();
        
        // Refresh data
        await loadData();
        await loadStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showError('Failed to save product: ' + error.message);
    }
}

// Delete a product
async function deleteProduct(sku) {
    if (!confirm(`Are you sure you want to delete product ${sku}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${sku}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Show success message
        showSuccess(`Product ${sku} deleted successfully!`);
        
        // Refresh data
        await loadData();
        await loadStats();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product: ' + error.message);
    }
}

// Close edit modal
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditSKU = null;
}

// Refresh all data
async function refreshData() {
    await loadData();
    await loadStats();
    showSuccess('Data refreshed successfully!');
}

// Utility functions for UI feedback
function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
}

function showSuccess(message) {
    // Create and show success message
    const existingSuccess = document.querySelector('.success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.table-container');
    container.insertBefore(successDiv, container.firstChild);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export data (bonus feature)
function exportData() {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "SKU,Product Type,Price,Units Sold,Revenue,Supplier,Location,Lead Time,Manufacturing Cost,Logistics Cost,Profit\n" +
        filteredData.map(row => 
            `${row.sku},${row.product_type},${row.price},${row.number_of_products_sold},${row.revenue_generated},${row.supplier_name},${row.location},${row.lead_time},${row.manufacturing_costs},${row.logistics_costs},${row.profit_margin}`
        ).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `supply_chain_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}