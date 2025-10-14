# Database Schema: supply_chain_management
**Merchant:** Merchant_one
**Exported:** 2025-10-13T10:33:23.539Z
**Connection:** laxmangupta@localhost:5432

---

## Table: `product_catalog`

**Rows:** 50 | **Columns:** 11
**CSV File:** `product_catalog.csv`

### Schema:

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| item_id | character varying | No | - |
| product_category | character varying | No | - |
| unit_cost | numeric | No | - |
| quantity_sold | integer | No | - |
| total_earnings | numeric | No | - |
| profit_margin | numeric | Yes | - |
| brand_name | character varying | Yes | - |
| product_name | character varying | Yes | - |
| launch_date | date | Yes | CURRENT_DATE |
| created_timestamp | timestamp without time zone | Yes | CURRENT_TIMESTAMP |
| updated_timestamp | timestamp without time zone | Yes | CURRENT_TIMESTAMP |

---

## Table: `vendor_management`

**Rows:** 50 | **Columns:** 13
**CSV File:** `vendor_management.csv`

### Schema:

| Column Name | Data Type | Nullable | Default |
|-------------|-----------|----------|---------|
| item_id | character varying | No | - |
| vendor_company | character varying | No | - |
| business_location | character varying | No | - |
| delivery_time_days | integer | No | - |
| order_quantity | integer | No | - |
| production_cost | numeric | No | - |
| logistics_partner | character varying | No | - |
| shipping_method | character varying | No | - |
| logistics_fee | numeric | No | - |
| quality_rating | numeric | Yes | 5.0 |
| contract_start_date | date | Yes | CURRENT_DATE |
| payment_terms | character varying | Yes | 'NET30'::character varying |
| created_timestamp | timestamp without time zone | Yes | CURRENT_TIMESTAMP |

---
