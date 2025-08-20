// React Integration - Formula Save/Load Components
// Add these components to your Excel Formula Builder

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert
} from '@material-ui/core';
import {
  Save as SaveIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon
} from '@material-ui/icons';

// API service for formula operations
class FormulaService {
  static async saveFormula(formulaData) {
    const response = await fetch('/api/formulas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formulaData)
    });
    return response.json();
  }
  
  static async loadFormula(formulaId) {
    const response = await fetch(`/api/formulas/${formulaId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }
  
  static async searchFormulas(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/formulas?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }
  
  static async updateFormula(formulaId, formulaData) {
    const response = await fetch(`/api/formulas/${formulaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formulaData)
    });
    return response.json();
  }
  
  static async deleteFormula(formulaId) {
    const response = await fetch(`/api/formulas/${formulaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.json();
  }
}

// Save Formula Dialog Component
const SaveFormulaDialog = ({ open, onClose, formulas, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Formula name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await FormulaService.saveFormula({
        name: name.trim(),
        description: description.trim(),
        formulas: formulas
      });

      if (result.success) {
        onSave(result);
        onClose();
        setName('');
        setDescription('');
      } else {
        setError(result.error || 'Failed to save formula');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SaveIcon color="primary" />
          Save Formula Template
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Formula Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sales Commission Calculator"
              required
              error={!!error && !name.trim()}
              helperText={error && !name.trim() ? "Name is required" : ""}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this formula does and when to use it..."
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Formula Preview:
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography 
                  variant="body2" 
                  component="pre" 
                  style={{ 
                    fontFamily: 'monospace',
                    backgroundColor: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}
                >
                  {JSON.stringify(formulas, null, 2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={saving || !name.trim()}
          startIcon={saving ? null : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Formula'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Load Formula Dialog Component
const LoadFormulaDialog = ({ open, onClose, onLoad }) => {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (open) {
      loadFormulas();
    }
  }, [open]);

  const loadFormulas = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await FormulaService.searchFormulas({
        name: searchTerm,
        rootType: filterType === 'all' ? undefined : filterType
      });

      if (result.success) {
        setFormulas(result.formulas);
      } else {
        setError(result.error || 'Failed to load formulas');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (formulaId) => {
    try {
      const result = await FormulaService.loadFormula(formulaId);
      
      if (result.success) {
        onLoad(result.formula);
        onClose();
      } else {
        setError(result.error || 'Failed to load formula');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const getTypeChip = (type) => {
    const typeConfig = {
      'if': { label: 'IF Condition', color: 'primary', icon: '🔀' },
      'operator': { label: 'Math Operation', color: 'secondary', icon: '⚡' },
      'lookup': { label: 'LOOKUP', color: 'default', icon: '🔍' },
      'cellValue': { label: 'Cell Reference', color: 'primary', icon: '📊' },
      'number': { label: 'Number', color: 'secondary', icon: '🔢' },
      'textbox': { label: 'Text', color: 'default', icon: '📝' }
    };
    
    const config = typeConfig[type] || { label: type, color: 'default', icon: '?' };
    
    return (
      <Chip 
        size="small" 
        label={`${config.icon} ${config.label}`}
        color={config.color}
        variant="outlined"
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FolderIcon color="primary" />
          Load Formula Template
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} style={{ marginBottom: '16px' }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search formulas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filter by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">All Types</option>
              <option value="if">IF Conditions</option>
              <option value="operator">Math Operations</option>
              <option value="lookup">LOOKUP Functions</option>
              <option value="cellValue">Cell References</option>
            </TextField>
          </Grid>
        </Grid>

        <Button 
          onClick={loadFormulas} 
          disabled={loading}
          variant="outlined"
          style={{ marginBottom: '16px' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>

        {error && (
          <Alert severity="error" style={{ marginBottom: '16px' }}>
            {error}
          </Alert>
        )}

        <List style={{ maxHeight: '400px', overflow: 'auto' }}>
          {formulas.map((formula) => (
            <Card key={formula.id} variant="outlined" style={{ marginBottom: '8px' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {formula.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {formula.description || 'No description'}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                      {getTypeChip(formula.root_type)}
                      {formula.has_conditions && (
                        <Chip size="small" label="🔀 Conditional" color="primary" variant="outlined" />
                      )}
                      {formula.has_lookups && (
                        <Chip size="small" label="🔍 Lookup" color="secondary" variant="outlined" />
                      )}
                      <Chip 
                        size="small" 
                        label={`Complexity: ${formula.complexity_score}`}
                        color={formula.complexity_score > 10 ? 'secondary' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary" style={{ marginTop: '8px', display: 'block' }}>
                      Excel: {formula.excel_formula}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Created by {formula.created_by_username} on {new Date(formula.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleLoad(formula.id)}
                >
                  Load
                </Button>
                <Button 
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    // Show preview dialog or expand details
                  }}
                >
                  Preview
                </Button>
              </CardActions>
            </Card>
          ))}
        </List>

        {formulas.length === 0 && !loading && !error && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="textSecondary">
              No formulas found. Try adjusting your search criteria.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Integration into main FormulaBuilder component
const enhancedFormulaBuilder = (existingFormulaBuilder) => {
  return function EnhancedFormulaBuilder() {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    // ... existing state and logic ...

    const handleSaveSuccess = (result) => {
      setNotification({
        open: true,
        message: `Formula "${result.name}" saved successfully!`,
        severity: 'success'
      });
    };

    const handleLoadFormula = (loadedFormula) => {
      // Set the formulas state with the loaded structure
      setFormulas([loadedFormula.structure]);
      setNotification({
        open: true,
        message: `Formula "${loadedFormula.name}" loaded successfully!`,
        severity: 'success'
      });
    };

    return (
      <Box>
        {/* Add save/load buttons to your existing UI */}
        <Box display="flex" gap={2} mb={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={() => setShowSaveDialog(true)}
            disabled={!formulas || formulas.length === 0}
          >
            Save Formula
          </Button>
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => setShowLoadDialog(true)}
          >
            Load Formula
          </Button>
        </Box>

        {/* Your existing FormulaBuilder component */}
        {existingFormulaBuilder()}

        {/* Save Dialog */}
        <SaveFormulaDialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          formulas={formulas}
          onSave={handleSaveSuccess}
        />

        {/* Load Dialog */}
        <LoadFormulaDialog
          open={showLoadDialog}
          onClose={() => setShowLoadDialog(false)}
          onLoad={handleLoadFormula}
        />

        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          <Alert severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  };
};

export {
  SaveFormulaDialog,
  LoadFormulaDialog,
  FormulaService,
  enhancedFormulaBuilder
};