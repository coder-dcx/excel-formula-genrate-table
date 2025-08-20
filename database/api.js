// Excel Formula Builder - Database API Implementation
// Node.js/Express with MySQL examples

const mysql = require('mysql2/promise');
const express = require('express');
const app = express();

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'excel_formula_builder',
  connectionLimit: 10
};

const pool = mysql.createPool(dbConfig);

// ============================================================================
// FORMULA STORAGE OPERATIONS
// ============================================================================

/**
 * Save a new formula to database
 * @param {Object} formulaData - The formula structure from React app
 * @param {number} userId - ID of the user creating the formula
 */
async function saveFormula(formulaData, userId) {
  const connection = await pool.getConnection();
  
  try {
    // Generate Excel formula string
    const excelFormula = generateExcelFormula(formulaData.structure);
    
    // Calculate complexity and metadata
    const complexity = calculateComplexity(formulaData.structure);
    const cellReferences = extractCellReferences(formulaData.structure);
    const hasConditions = checkForConditions(formulaData.structure);
    const hasLookups = checkForLookups(formulaData.structure);
    
    const [result] = await connection.execute(`
      INSERT INTO hybrid_formulas (
        name, description, formula_structure, excel_formula,
        root_type, complexity_score, has_conditions, has_lookups,
        cell_references, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      formulaData.name,
      formulaData.description,
      JSON.stringify(formulaData.structure),
      excelFormula,
      formulaData.structure.type,
      complexity,
      hasConditions,
      hasLookups,
      JSON.stringify(cellReferences),
      userId
    ]);
    
    return {
      success: true,
      formulaId: result.insertId,
      excelFormula: excelFormula
    };
    
  } catch (error) {
    console.error('Error saving formula:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Load formula by ID
 * @param {number} formulaId 
 * @param {number} userId 
 */
async function loadFormula(formulaId, userId) {
  const connection = await pool.getConnection();
  
  try {
    const [rows] = await connection.execute(`
      SELECT 
        f.*,
        u.username as created_by_username
      FROM hybrid_formulas f
      LEFT JOIN users u ON f.created_by = u.id
      LEFT JOIN formula_permissions p ON f.id = p.formula_id AND p.user_id = ?
      WHERE f.id = ? 
        AND (f.created_by = ? OR p.permission_type IS NOT NULL OR f.is_active = 1)
    `, [userId, formulaId, userId]);
    
    if (rows.length === 0) {
      return { success: false, error: 'Formula not found or access denied' };
    }
    
    const formula = rows[0];
    
    // Log usage
    await logFormulaUsage(formulaId, userId, 'view');
    
    return {
      success: true,
      formula: {
        id: formula.id,
        name: formula.name,
        description: formula.description,
        structure: JSON.parse(formula.formula_structure),
        excelFormula: formula.excel_formula,
        complexity: formula.complexity_score,
        cellReferences: JSON.parse(formula.cell_references || '[]'),
        createdBy: formula.created_by_username,
        createdAt: formula.created_at
      }
    };
    
  } finally {
    connection.release();
  }
}

/**
 * Search formulas
 * @param {Object} filters 
 * @param {number} userId 
 */
async function searchFormulas(filters, userId) {
  const connection = await pool.getConnection();
  
  try {
    let whereClause = 'WHERE (f.created_by = ? OR p.permission_type IS NOT NULL)';
    let params = [userId];
    
    if (filters.name) {
      whereClause += ' AND f.name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    
    if (filters.rootType) {
      whereClause += ' AND f.root_type = ?';
      params.push(filters.rootType);
    }
    
    if (filters.hasConditions !== undefined) {
      whereClause += ' AND f.has_conditions = ?';
      params.push(filters.hasConditions);
    }
    
    if (filters.cellReference) {
      whereClause += ' AND JSON_CONTAINS(f.cell_references, ?)';
      params.push(JSON.stringify(filters.cellReference));
    }
    
    const [rows] = await connection.execute(`
      SELECT 
        f.id,
        f.name,
        f.description,
        f.excel_formula,
        f.root_type,
        f.complexity_score,
        f.has_conditions,
        f.has_lookups,
        f.created_at,
        u.username as created_by_username
      FROM hybrid_formulas f
      LEFT JOIN users u ON f.created_by = u.id
      LEFT JOIN formula_permissions p ON f.id = p.formula_id AND p.user_id = ?
      ${whereClause}
      AND f.is_active = 1
      ORDER BY f.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, filters.limit || 20, filters.offset || 0]);
    
    return {
      success: true,
      formulas: rows,
      total: rows.length
    };
    
  } finally {
    connection.release();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateExcelFormula(node) {
  if (!node) return '';
  
  switch (node.type) {
    case 'cellValue':
      return node.value;
    case 'number':
      return node.value.toString();
    case 'textbox':
      return `"${node.value}"`;
    case 'operator':
      if (node.args && node.args.length > 0) {
        if (node.operators && node.operators.length > 0) {
          let result = generateExcelFormula(node.args[0]);
          for (let i = 1; i < node.args.length; i++) {
            const operator = node.operators[i - 1] || '+';
            result += operator + generateExcelFormula(node.args[i]);
          }
          return `(${result})`;
        }
      }
      return '';
    case 'if':
      return `IF(${generateExcelFormula(node.condition.left)}${node.condition.operator}${generateExcelFormula(node.condition.right)},${generateExcelFormula(node.trueValue)},${generateExcelFormula(node.falseValue)})`;
    case 'function':
      if (node.name === 'lookup') {
        return `LOOKUP(${node.args.map(generateExcelFormula).join(',')})`;
      }
      return '';
    default:
      return '';
  }
}

function calculateComplexity(node) {
  if (!node) return 0;
  
  let complexity = 1;
  
  if (node.args) {
    complexity += node.args.reduce((sum, arg) => sum + calculateComplexity(arg), 0);
  }
  
  if (node.condition) {
    complexity += calculateComplexity(node.condition.left) + calculateComplexity(node.condition.right);
  }
  
  if (node.trueValue) complexity += calculateComplexity(node.trueValue);
  if (node.falseValue) complexity += calculateComplexity(node.falseValue);
  
  return complexity;
}

function extractCellReferences(node) {
  const references = new Set();
  
  function traverse(n) {
    if (!n) return;
    
    if (n.type === 'cellValue' && n.value) {
      references.add(n.value);
    }
    
    if (n.args) {
      n.args.forEach(traverse);
    }
    
    if (n.condition) {
      traverse(n.condition.left);
      traverse(n.condition.right);
    }
    
    if (n.trueValue) traverse(n.trueValue);
    if (n.falseValue) traverse(n.falseValue);
  }
  
  traverse(node);
  return Array.from(references);
}

function checkForConditions(node) {
  if (!node) return false;
  
  if (node.type === 'if') return true;
  
  if (node.args) {
    return node.args.some(checkForConditions);
  }
  
  if (node.trueValue && checkForConditions(node.trueValue)) return true;
  if (node.falseValue && checkForConditions(node.falseValue)) return true;
  
  return false;
}

function checkForLookups(node) {
  if (!node) return false;
  
  if (node.type === 'function' && node.name === 'lookup') return true;
  
  if (node.args) {
    return node.args.some(checkForLookups);
  }
  
  if (node.trueValue && checkForLookups(node.trueValue)) return true;
  if (node.falseValue && checkForLookups(node.falseValue)) return true;
  
  return false;
}

async function logFormulaUsage(formulaId, userId, actionType, ipAddress = null, userAgent = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.execute(`
      INSERT INTO formula_usage_logs (formula_id, user_id, action_type, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `, [formulaId, userId, actionType, ipAddress, userAgent]);
  } catch (error) {
    console.error('Error logging usage:', error);
  } finally {
    connection.release();
  }
}

// ============================================================================
// EXPRESS API ROUTES
// ============================================================================

app.use(express.json());

// Save formula
app.post('/api/formulas', async (req, res) => {
  try {
    const { formulas, name, description } = req.body;
    const userId = req.user.id; // Assume authentication middleware
    
    const result = await saveFormula({
      name,
      description,
      structure: formulas[0] // Assuming single formula for now
    }, userId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load formula
app.get('/api/formulas/:id', async (req, res) => {
  try {
    const formulaId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const result = await loadFormula(formulaId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search formulas
app.get('/api/formulas', async (req, res) => {
  try {
    const filters = {
      name: req.query.name,
      rootType: req.query.rootType,
      hasConditions: req.query.hasConditions === 'true',
      cellReference: req.query.cellReference,
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0
    };
    
    const userId = req.user.id;
    const result = await searchFormulas(filters, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update formula
app.put('/api/formulas/:id', async (req, res) => {
  try {
    const formulaId = parseInt(req.params.id);
    const userId = req.user.id;
    const { formulas, name, description } = req.body;
    
    // Check permissions first
    const existing = await loadFormula(formulaId, userId);
    if (!existing.success) {
      return res.status(404).json(existing);
    }
    
    // Update formula
    const connection = await pool.getConnection();
    
    try {
      const excelFormula = generateExcelFormula(formulas[0]);
      const complexity = calculateComplexity(formulas[0]);
      const cellReferences = extractCellReferences(formulas[0]);
      
      await connection.execute(`
        UPDATE hybrid_formulas 
        SET name = ?, description = ?, formula_structure = ?, excel_formula = ?,
            complexity_score = ?, cell_references = ?, version = version + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name,
        description,
        JSON.stringify(formulas[0]),
        excelFormula,
        complexity,
        JSON.stringify(cellReferences),
        formulaId
      ]);
      
      await logFormulaUsage(formulaId, userId, 'edit');
      
      res.json({ success: true, formulaId });
    } finally {
      connection.release();
    }
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = {
  saveFormula,
  loadFormula,
  searchFormulas,
  generateExcelFormula,
  calculateComplexity,
  extractCellReferences
};