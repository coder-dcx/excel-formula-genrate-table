-- Excel Formula Builder Database Schema
-- Multiple approaches for storing formula structures

-- ============================================================================
-- APPROACH 1: JSON-Based Storage (Recommended for complex formulas)
-- ============================================================================

-- Main formula templates table
CREATE TABLE formula_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    formula_json JSON NOT NULL,           -- Store the entire formula structure as JSON
    excel_formula TEXT NOT NULL,          -- Generated Excel formula string
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_name (name),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at)
);

-- Example JSON structure stored in formula_json:
/*
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
*/

-- ============================================================================
-- APPROACH 2: Normalized Relational Structure (Better for queries/reports)
-- ============================================================================

-- Main formula definitions
CREATE TABLE formulas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    root_node_id BIGINT,                  -- Points to root formula_nodes
    excel_formula TEXT,                   -- Generated Excel formula
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_name (name),
    INDEX idx_root_node (root_node_id)
);

-- Individual formula nodes (recursive structure)
CREATE TABLE formula_nodes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    formula_id BIGINT NOT NULL,
    parent_node_id BIGINT NULL,           -- NULL for root nodes
    node_type ENUM('cellValue', 'number', 'textbox', 'operator', 'if', 'lookup') NOT NULL,
    position_order INT DEFAULT 0,         -- Order within parent (for args)
    
    -- Basic value fields
    text_value TEXT NULL,                 -- For cellValue, textbox
    number_value DECIMAL(20,6) NULL,      -- For number type
    
    -- Operator specific fields
    operator_symbol VARCHAR(10) NULL,     -- +, -, *, /
    
    -- Condition specific fields (for IF)
    condition_operator ENUM('=', '<', '>', '<>', '>=', '<=') NULL,
    
    -- Function specific fields
    function_name VARCHAR(50) NULL,       -- lookup, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_node_id) REFERENCES formula_nodes(id) ON DELETE CASCADE,
    
    INDEX idx_formula (formula_id),
    INDEX idx_parent (parent_node_id),
    INDEX idx_type (node_type)
);

-- Store operator sequences for multi-operator expressions
CREATE TABLE node_operators (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    node_id BIGINT NOT NULL,
    operator_symbol VARCHAR(10) NOT NULL,
    sequence_order INT NOT NULL,
    
    FOREIGN KEY (node_id) REFERENCES formula_nodes(id) ON DELETE CASCADE,
    INDEX idx_node (node_id)
);

-- ============================================================================
-- APPROACH 3: Hybrid Approach (Recommended)
-- ============================================================================

-- Main formula table with both JSON and key fields for optimization
CREATE TABLE hybrid_formulas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- JSON storage for complete structure
    formula_structure JSON NOT NULL,
    
    -- Optimized fields for common queries
    excel_formula TEXT NOT NULL,
    root_type ENUM('cellValue', 'number', 'textbox', 'operator', 'if', 'lookup') NOT NULL,
    complexity_score INT DEFAULT 1,       -- Number of nodes for performance hints
    has_conditions BOOLEAN DEFAULT FALSE, -- Quick check for IF statements
    has_lookups BOOLEAN DEFAULT FALSE,    -- Quick check for LOOKUP functions
    
    -- Cell references used (for dependency tracking)
    cell_references JSON,                 -- Array of cell references used
    
    -- Metadata
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    
    INDEX idx_name (name),
    INDEX idx_root_type (root_type),
    INDEX idx_complexity (complexity_score),
    INDEX idx_created_by (created_by),
    
    -- JSON indexes for MySQL 8.0+
    INDEX idx_cell_refs ((CAST(cell_references AS CHAR(255) ARRAY)))
);

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- FORMULA SHARING & PERMISSIONS
-- ============================================================================

CREATE TABLE formula_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    formula_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    permission_type ENUM('read', 'write', 'admin') NOT NULL,
    granted_by BIGINT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (formula_id) REFERENCES hybrid_formulas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    
    UNIQUE KEY unique_user_formula (formula_id, user_id)
);

-- ============================================================================
-- FORMULA USAGE TRACKING
-- ============================================================================

CREATE TABLE formula_usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    formula_id BIGINT NOT NULL,
    user_id BIGINT,
    action_type ENUM('view', 'copy', 'edit', 'delete', 'execute') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (formula_id) REFERENCES hybrid_formulas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_formula (formula_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action_type),
    INDEX idx_date (created_at)
);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample user
INSERT INTO users (username, email, password_hash, full_name) VALUES
('admin', 'admin@company.com', '$2b$12$hash...', 'System Administrator');

-- Insert sample formula using hybrid approach
INSERT INTO hybrid_formulas (
    name, 
    description, 
    formula_structure, 
    excel_formula,
    root_type,
    complexity_score,
    has_conditions,
    cell_references,
    created_by
) VALUES (
    'Sales Commission Calculator',
    'Calculate commission based on sales amount with conditions',
    JSON_OBJECT(
        'type', 'if',
        'condition', JSON_OBJECT(
            'operator', '>',
            'left', JSON_OBJECT('type', 'cellValue', 'value', 'A1'),
            'right', JSON_OBJECT('type', 'number', 'value', 10000)
        ),
        'trueValue', JSON_OBJECT(
            'type', 'operator',
            'operators', JSON_ARRAY('*'),
            'args', JSON_ARRAY(
                JSON_OBJECT('type', 'cellValue', 'value', 'A1'),
                JSON_OBJECT('type', 'number', 'value', 0.1)
            )
        ),
        'falseValue', JSON_OBJECT(
            'type', 'operator',
            'operators', JSON_ARRAY('*'),
            'args', JSON_ARRAY(
                JSON_OBJECT('type', 'cellValue', 'value', 'A1'),
                JSON_OBJECT('type', 'number', 'value', 0.05)
            )
        )
    ),
    'IF(A1>10000,A1*0.1,A1*0.05)',
    'if',
    5,
    TRUE,
    JSON_ARRAY('A1'),
    1
);