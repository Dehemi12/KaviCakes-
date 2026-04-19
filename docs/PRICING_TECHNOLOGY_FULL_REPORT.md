# KaviCakes System Implementation: Pricing Technology & Business Logic

## 1. Executive Summary
The KaviCakes pricing engine is a sophisticated, multi-tier computational framework designed to manage the financial intricacies of artisan bakery operations. This document provides an exhaustive technical analysis of how the system calculates totals for **Standard**, **Custom**, and **Bulk Orders**, with a focus on administrative control and architectural security.

The core philosophy of the system is the **"Decoupled Value Model,"** where artistic value (Category), physical volume (Size), and material premium (Flavor) are managed as independent variables that converge during the checkout lifecycle.

---

## 2. Dynamic Custom Order Pricing Architecture
Custom individual orders represent the highest level of variability in the system. To ensure that every possible customer selection is priced accurately without manual intervention, KaviCakes uses the **Geometric Multiplier Model**.

### 2.1 The Core Algorithmic Formula
The mathematical foundation of the custom pricing engine is expressed as:
$$Total = (Category\ Base\ Price \times Size\ Multiplier) + Flavor\ Premium$$

This formula ensures that the artistic complexity of the category (e.g., a "Kids" theme) is scaled by the physical size of the cake, while individual ingredient premiums (e.g., "Premium Chocolate") are added as flat surcharges.

### 2.2 Component Analysis & Data Relationships
*   **Category Base Price (`catBase`)**: Stored in the `cakecategory` table. This is the entry-level price for a specific design style.
*   **Size Multiplier (`sizeMultiplier`)**: Stored in the `cakesize.price` field. Unlike the category price, this is a floating-point number representing a factor of the base.
*   **Flavor Premium (`flavorPremium`)**: Stored in the `cakeflavor.price` field. This represents the additional cost of premium materials.

---

## 3. Bulk & Corporate Order Pricing Technology
Bulk orders follow a different logic path focused on **Production Scaling Efficiency**. The technology here transitions from "Artistic Premium" to "Volume Economy."

### 3.1 Defining the Bulk Order Threshold
The **Bulk Order Threshold** is the quantitative trigger point that converts a retail transaction into a wholesale transaction. 
*   **Threshold Value**: 100 Units.
*   **Logic**: Once the quantity field in the bulk order form surpasses 100, the system applies a **10% Corporate Discount** across the entire subtotal.

### 3.2 Database Deep-Dive: The `bulkpricing` Table
The configuration for bulk orders is centralized in a dedicated schema designed for high-volume management.

| Field Name | Type | Technical Purpose |
| :--- | :--- | :--- |
| `categoryLabel` | String | Acts as the unique SKU identifier for bulk categories (e.g., "Mini-Cupcake"). |
| `basePrice` | Decimal | The standard unit price for orders between 50 and 99 units. |
| `bulkPrice` | Decimal | The discounted unit price applied when the threshold is hit. |
| `bulkThreshold` | Integer | The exact count where the `bulkPrice` logic overrides the `basePrice`. |
| `minOrderQty` | Integer | The "Safety Gate" — the absolute minimum quantity (usually 50) required to place a bulk request. |

### 3.3 Dynamic Packaging Logic
Bulk orders introduce a unique technical challenge: **Packaging Surcharges**. In the KaviCakes system, if the administrator sets a packaging option price to `0`, the logic automatically injects a **Rs. 25.00** flat fee. This prevents loss-leader scenarios where small packaging costs aggregate into large losses on high-quantity orders.

---

## 4. Administrative Data Entry Management
To maintain the pricing engine, administrators interact with three primary management forms in the Admin Panel. Below is the technical guide for data entry:

### 4.1 Creating a New Category
When adding a new Category (e.g., "Engagement Cakes"), the Admin must enter:
1.  **Category Name**: The display label on the customer site.
2.  **Base Price**: This should be the price of the **smallest possible version** (e.g., 500g) of a cake in this category. For KaviCakes, this acts as the $1.0\times$ multiplier base.

### 4.2 Managing Sizes & Multipliers
The size form is deceptive; the "Price" field here is not a currency amount but a **Scale Multiplier**.
*   **1kg Size**: Entry should be `1.0` (Standard).
*   **2kg Size**: Entry should be `1.75` or `2.0` (Scaling the base price by 2x).
*   **500g Size**: Entry should be `0.6` (Reducing the base price).

### 4.3 Flavor Premiums
The "Price" field for Flavour is an **Absolute Surcharge**.
*   **Standard Vanilla**: Entry `0` (Included in base price).
*   **Belgian Chocolate**: Entry `500` (Adds 500 rupees flat to the final quote).

---

## 5. Security Architecture: Backend Integrity
A critical feature of the KaviCakes implementation is **Non-Trust Client Interaction**. Since frontend calculations can be manipulated by malicious users via the browser console, the backend implements the following security lifecycle:

1.  **Request Capture**: The user submits the order with a "Total" calculated by React.
2.  **OrderController Interception**: The backend `orderController.js` captures the `categoryId`, `sizeId`, and `flavorId`.
3.  **Clean-Room Calculation**: The system performs an internal database lookup to fetch the **Authoritative Price**.
4.  **Verification**: The backend re-calculates the price using the internal `CalculateTotal` function.
5.  **Commit**: If the re-calculated total matches the user's total, the order is saved to the MySQL database. If not, the transaction is rejected.

---

## 6. Full Algorithm Pseudo-code
For inclusion in the technical documentation of the system, the following pseudo-code represents the logic of the `pricingService`:

```
FUNCTION CalculateKaviCakesPrice(item)
    // 1. Initialize Variables
    VAR basePrice = FETCH basePrice FROM DB.Category WHERE id = item.categoryId
    VAR multiplier = FETCH value FROM DB.Size WHERE id = item.sizeId
    VAR premium = FETCH value FROM DB.Flavor WHERE id = item.flavorId
    VAR qty = item.quantity
    
    // 2. Logic Selection
    IF item.orderType == "CUSTOM" THEN
        // Geometric Scaled Model
        VAR unitPrice = (basePrice * multiplier) + premium
        RETURN unitPrice * qty
        
    ELSE IF item.orderType == "BULK" THEN
        // Volume Threshold Model
        VAR bulkConfig = FETCH FROM DB.BulkPricing WHERE label = item.category
        VAR unitRate = (qty >= bulkConfig.threshold) ? bulkConfig.bulkPrice : bulkConfig.basePrice
        VAR subtotal = qty * unitRate
        
        // Final Volume Discount Trigger
        IF qty > 100 THEN
            RETURN subtotal * 0.90
        ELSE
            RETURN subtotal
        END IF
    END IF
END FUNCTION
```

---

## 7. Conclusion
The implementation of this pricing bridge between the Admin Panel and the Customer Interface ensures that KaviCakes can maintain dynamic profit margins while providing users with instant, accurate quotes. By leveraging the **Geometric Multiplier Model** for custom cakes and the **Volume Threshold Model** for bulk orders, the system remains scalable for future product expansions.
