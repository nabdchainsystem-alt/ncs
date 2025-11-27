# Master Data Dictionary
To power all 210 reports, you need to create these **Core Tables** with the listed columns.

## 🗄️ FINANCE AP INVOICES
**Required Columns:**
> `Amount`, `Date`, `Department`, `ID`, `Supplier`
**Used For:**
> Aging/DateDiff, Count, Group By, Sum

## 🗄️ PROCUREMENT CONTRACTS
**Required Columns:**
> `ID`, `Supplier`
**Used For:**
> Count, Group By

## 🗄️ PROCUREMENT PURCHASE ORDERS
**Required Columns:**
> `Amount`, `Date`, `ID`, `Supplier`
**Used For:**
> Aging/DateDiff, Count, Group By

## 🗄️ PROCUREMENT REQUISITIONS
**Required Columns:**
> `Amount`, `Date`, `ID`
**Used For:**
> Aging/DateDiff, Count

## 🗄️ PROCUREMENT VENDORS
**Required Columns:**
> `Amount`, `Date`, `ID`, `Supplier`
**Used For:**
> Aging/DateDiff, Count, Group By