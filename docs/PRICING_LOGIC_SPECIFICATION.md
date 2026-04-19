# KaviCakes Pricing Logic Specification

## 1. Overview
This document defines the computational logic used to determine product pricing across different order types: **Standard Cakes**, **Custom Orders**, and **Bulk/Corporate Orders**. The system employs a combination of additive premiums and geometric multipliers to ensure pricing consistency and scalability.

---

## 2. Admin Configuration & Data Entry
The pricing engine is directly controlled by the Administrator through the Admin Panel. Each input field in the management forms maps to a specific variable in the calculation logic:

| Admin Panel Field | System Variable | Computational Role |
| :--- | :--- | :--- |
| **Category "Base Price"** | `catBase` | Set in Category Management. The monetary foundation for the design type. |
| **Size "Price" Field** | `sizeMultiplier` | Set in Master Data > Sizes. Acts as a multiplier (e.g., 1.5 = 150% of base). |
| **Flavor "Price" Field** | `flavorPremium` | Set in Master Data > Flavors. A flat surcharge added for ingredients. |

---

## 3. Custom Order Pricing Logic
Used in the "Custom Cake" configurator, where a user builds a cake from scratch.

### Formula
$$Total = (Base \times Multiplier) + Premium$$

### Components
1. **Category Base Price (`catBase`)**: 
   - Defined per `CakeCategory`.
   - Represents the complexity of the artistic design (e.g., *Kids Cakes* vs. *Wedding Cakes*).
2. **Size Multiplier (`sizeMultiplier`)**:
   - Defined in the `CakeSize` table.
   - Values are stored as decimals. 
   - *Example:* A 1kg size might have a multiplier of `1.0`, while a 2.5kg size has `2.2`.
3. **Flavor Premium (`flavorPremium`)**:
   - Defined in the `CakeFlavor` table.
   - Represents the cost variance of ingredients (e.g., *Chocolate* vs. *Vanilla*).
   - Treated as a flat additive cost.

### Logic Flow
- **Frontend:** Calculated in `CustomOrderPage.jsx` for real-time price preview.
- **Backend:** Re-calculated and verified in `orderController.js` before transaction commit to prevent price tampering.

---

## 3. Bulk Order Pricing Logic
Used for high-volume orders (Wholesale/Corporate).

### Formula
$$Total = \text{Quantity} \times (\text{Unit Base} + \text{Extras})$$
$$Final = Total \times (1 - \text{Discount})$$

### Thresholds & Discounts
- **Minimum Order Quantity:** 50 units (Enforced in `orderController.js`).
- **Bulk Threshold:** 100 units.
- **Discount Rate:** 10% (Applied automatically when $\text{Quantity} > 100$).

### Special Packaging Logic
If the admin-configured packaging price is set to `0`, the system applies a default **Rs. 25.00** surcharge per unit to cover basic supply costs for bulk handling.

---

## 4. Database Schema Reference

### `cakecategory` Table
| Field | Type | Description |
| :--- | :--- | :--- |
| `basePrice` | Decimal | The starting price for any cake in this category. |

### `bulkpricing` Table (Advanced Volume Matrix)
| Field | Type | Description |
| :--- | :--- | :--- |
| `bulkThreshold` | Int | The quantity at which wholesale pricing activates (Def: 100). |
| `minOrderQty` | Int | The minimum allowed units for a bulk request (Def: 50). |
| `bulkPrice` | Decimal | The discounted unit price for high-volume orders. |

### `cakevariant` Table (Standard Catalog)
Standard cakes (pre-made designs) bypass the category formula and use a static `price` defined for a specific SKU (Combo of Size + Shape + Flavor).

---

## 5. Security & Verification
The system employs **Double-Entry Price Verification**:
1. **Frontend:** Displays a "Estimated Price" to the user based on state selection.
2. **Backend:** Upon order submission, the `createOrder` controller fetches fresh data from the DB for all components (Category ID, Size ID, etc.) and performs a clean-room calculation. 
3. **Action:** The total sent from the client is matched against the server-side total. Any discrepancy results in a rollback to ensure financial integrity.
