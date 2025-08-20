# Excel Formula Builder - Database Storage Design

## Overview

This document outlines comprehensive approaches for storing Excel formula structures in a database. The formula builder creates complex nested JSON structures that need to be efficiently stored, queried, and retrieved.

## Current Formula Structure

Your React app generates formula structures like this:

```json
{
  "type": "if",
  "condition": {
    "operator": "=",
    "left": {"type": "cellValue", "value": "A1"},
    "right": {"type": "number", "value": 10}
  },
  "trueValue": {
    "type": "operator", 
    "operators": ["+"],
    "args": [
      {"type": "cellValue", "value": "B1"},
      {"type": "number", "value": 5}
    ]
  },
  "falseValue": {"type": "number", "value": 0}
}
```

## Database Design Approaches

### 1. JSON-Based Storage (Recommended)

**Advantages:**
- ✅ Preserves exact structure
- ✅ Easy to implement
- ✅ Fast development
- ✅ No data loss
- ✅ Modern databases support JSON indexing

**Implementation:**
```sql
CREATE TABLE formula_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    formula_json JSON NOT NULL,
    excel_formula TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Normalized Relational Structure

**Advantages:**
- ✅ Better for complex queries
- ✅ Referential integrity
- ✅ Easier analytics/reporting
- ✅ Database-level constraints

**Disadvantages:**
- ❌ Complex to implement
- ❌ Many JOIN operations
- ❌ Harder to maintain

### 3. Hybrid Approach (Best of Both Worlds)

**Recommended Implementation:**
```sql
CREATE TABLE hybrid_formulas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    formula_structure JSON NOT NULL,        -- Complete structure
    excel_formula TEXT NOT NULL,            -- Generated formula
    root_type ENUM(...) NOT NULL,          -- Quick filter
    complexity_score INT DEFAULT 1,        -- Performance hint
    cell_references JSON,                  -- Dependencies
    has_conditions BOOLEAN DEFAULT FALSE,  -- Quick checks
    has_lookups BOOLEAN DEFAULT FALSE
);
```

## Key Design Decisions

### Storage Format Choice
- **JSON storage** for complete formula structure
- **Extracted metadata** for common queries
- **Generated Excel formula** for immediate use

### Indexing Strategy
```sql
-- Performance indexes
INDEX idx_name (name)
INDEX idx_root_type (root_type)
INDEX idx_complexity (complexity_score)

-- JSON indexes (MySQL 8.0+)
INDEX idx_cell_refs ((CAST(cell_references AS CHAR(255) ARRAY)))
```

### Metadata Extraction
Automatically extract and store:
- **Root type** (if, operator, lookup, etc.)
- **Complexity score** (number of nodes)
- **Cell references used** (for dependency tracking)
- **Feature flags** (has conditions, lookups, etc.)

## Implementation Examples

### Saving a Formula
```javascript
const formulaData = {
  name: "Sales Commission",
  description: "Calculate commission based on sales",
  structure: { /* your formula object */ },
  excelFormula: "IF(A1>10000,A1*0.1,A1*0.05)",
  rootType: "if",
  complexity: 5,
  cellReferences: ["A1"],
  hasConditions: true
};

await FormulaService.saveFormula(formulaData);
```

### Querying Formulas
```javascript
// Find all IF formulas
const ifFormulas = await FormulaService.searchFormulas({
  rootType: 'if'
});

// Find formulas using specific cell
const a1Formulas = await FormulaService.searchFormulas({
  cellReference: 'A1'
});

// Find complex formulas
const complexFormulas = await FormulaService.searchFormulas({
  complexityMin: 10
});
```

## Database Schema Components

### Core Tables

1. **hybrid_formulas** - Main formula storage
2. **users** - User management
3. **formula_permissions** - Sharing and access control
4. **formula_usage_logs** - Usage tracking and analytics

### Supporting Features

#### Version Control
```sql
ALTER TABLE hybrid_formulas ADD COLUMN version INT DEFAULT 1;
```

#### Soft Delete
```sql
ALTER TABLE hybrid_formulas ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

#### Audit Trail
```sql
CREATE TABLE formula_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    formula_id BIGINT,
    action ENUM('create', 'update', 'delete'),
    old_value JSON,
    new_value JSON,
    changed_by BIGINT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Performance Considerations

### Query Optimization
- Use extracted metadata fields for filtering
- Limit JSON queries for detailed operations only
- Implement proper pagination

### Caching Strategy
```javascript
// Cache frequently used formulas
const cache = new Map();

async function getCachedFormula(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const formula = await loadFormula(id);
  cache.set(id, formula);
  return formula;
}
```

### Indexing Best Practices
- Index frequently queried fields
- Use composite indexes for complex queries
- Monitor query performance with EXPLAIN

## Security Considerations

### Access Control
```sql
-- Row-level security example
CREATE VIEW user_formulas AS
SELECT f.* FROM hybrid_formulas f
WHERE f.created_by = CURRENT_USER_ID()
   OR EXISTS (
     SELECT 1 FROM formula_permissions p 
     WHERE p.formula_id = f.id 
       AND p.user_id = CURRENT_USER_ID()
   );
```

### Data Validation
- Validate JSON structure on insert/update
- Sanitize formula names and descriptions
- Implement input size limits

## Migration Strategy

### From File Storage
```javascript
// Migration script example
async function migrateFromFiles() {
  const files = await fs.readdir('./formulas');
  
  for (const file of files) {
    const data = await fs.readFile(`./formulas/${file}`);
    const formula = JSON.parse(data);
    
    await saveFormula({
      name: path.basename(file, '.json'),
      structure: formula,
      migratedFrom: file
    });
  }
}
```

### Database Updates
```sql
-- Example migration
ALTER TABLE hybrid_formulas 
ADD COLUMN tags JSON,
ADD COLUMN category VARCHAR(100),
ADD INDEX idx_category (category);
```

## Monitoring and Analytics

### Usage Tracking
```sql
-- Most popular formulas
SELECT f.name, COUNT(l.id) as usage_count
FROM hybrid_formulas f
LEFT JOIN formula_usage_logs l ON f.id = l.formula_id
WHERE l.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY f.id
ORDER BY usage_count DESC;
```

### Performance Metrics
```sql
-- Complexity distribution
SELECT 
  CASE 
    WHEN complexity_score <= 5 THEN 'Simple'
    WHEN complexity_score <= 15 THEN 'Medium'
    ELSE 'Complex'
  END as complexity_level,
  COUNT(*) as count
FROM hybrid_formulas
GROUP BY complexity_level;
```

## Backup and Recovery

### Regular Backups
```bash
# Daily backup
mysqldump --single-transaction formula_db > backup_$(date +%Y%m%d).sql

# Backup with compression
mysqldump --single-transaction formula_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Point-in-Time Recovery
```sql
-- Binary log settings for recovery
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL binlog_row_image = 'FULL';
```

## Best Practices Summary

1. **Use hybrid approach** - JSON for structure, metadata for queries
2. **Extract searchable fields** - root type, complexity, cell references
3. **Implement proper indexing** - for performance and JSON queries
4. **Add audit trails** - for version control and compliance
5. **Consider caching** - for frequently accessed formulas
6. **Plan for scaling** - partition by date or user if needed
7. **Monitor performance** - use query analysis tools
8. **Implement backups** - regular automated backups
9. **Version control** - track formula changes over time
10. **Security first** - proper access controls and validation

This design provides a robust, scalable foundation for storing your Excel formula structures while maintaining performance and flexibility for future enhancements.