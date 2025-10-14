# Database Schema: merchant_two_supply_chain
**Merchant:** Merchant_two
**Exported:** 2025-10-13T10:33:23.564Z
**Connection:** vatsaly@localhost:5432

---

## Table: `products`

**Rows:** 59 | **Columns:** 11
**CSV File:** `products.csv`

### Schema:

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| product_id | character varying | No | - |
| category | character varying | No | - |
| unit_price | numeric | No | 0 |
| units_sold | integer | No | 0 |
| sales_revenue | numeric | No | 0 |
| profit_margin | numeric | No | 0 |
| stock_level | integer | No | 0 |
| product_status | character varying | No | 'Active'::character varying |
| seasonal_demand | character varying | No | 'Medium'::character varying |
| created_at | timestamp without time zone | Yes | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | Yes | CURRENT_TIMESTAMP |

---

## Table: `supply_chain`

**Rows:** 59 | **Columns:** 16
**CSV File:** `supply_chain.csv`

### Schema:

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| id | integer | No | nextval('supply_chain_id_seq'::regclass) |
| product_id | character varying | Yes | - |
| vendor_name | character varying | No | - |
| facility_location | character varying | Yes | - |
| processing_days | integer | Yes | 0 |
| output_quantity | integer | Yes | 0 |
| production_expenses | numeric | Yes | 0 |
| logistics_provider | character varying | Yes | - |
| shipping_method | character varying | Yes | - |
| freight_charges | numeric | Yes | 0 |
| quality_score | numeric | Yes | 0 |
| reorder_point | integer | Yes | 0 |
| warehouse_zone | character varying | Yes | - |
| sustainability_index | integer | Yes | 0 |
| created_at | timestamp without time zone | Yes | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | Yes | CURRENT_TIMESTAMP |

---
