import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Divider
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab'; 
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Functions as FunctionsIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
  ImportExport as ImportExportIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import './App.css';

const _cellValueList = [
  'cell value 1', 'cell value 2', 'cell value 3', 'cell value 4',
  '[15401]', '[1000]', '[18400]', '[15090]', '[99999]', 
  'A1', 'B1', 'C1', 'D1', 'OT1.1', 'STRUC_HRS'
];
const _OperatorList = ['+', '-', '*', '/'];
const _ConditionList = ['=', '<', '>', '<>'];
const _FunctionList = ['cellValue', 'number', 'textbox', 'operator', 'if', 'lookup'];

// Global dynamic cell values list that persists across component renders
let dynamicCellValues = [];

// Helper function to get all available cell values
const getAllCellValues = () => [..._cellValueList, ...dynamicCellValues];

// Helper function to clear dynamic values (useful for testing)
const clearDynamicCellValues = () => {
  dynamicCellValues = [];
};

// Enhanced Autocomplete Component for CellValue with dynamic list management
const EnhancedCellValueAutocomplete = ({ value, onChange, label = "Cell Value", placeholder = "Select or type cell reference", showChips = true }) => {
  const [, forceUpdate] = useState({});
  const [inputValue, setInputValue] = useState(value || '');
  
  // Combine original list with dynamic values
  const allCellValues = [..._cellValueList, ...dynamicCellValues];
  
  const addNewCellValue = (newValue) => {
    if (newValue && !allCellValues.includes(newValue)) {
      dynamicCellValues.push(newValue);
      forceUpdate({}); // Force re-render to show the new value
    }
  };
  
  // Update inputValue when value prop changes
  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);
  
  return (
    <Autocomplete
      value={value}
      inputValue={inputValue}
      onChange={(event, newValue) => {
        const cleanValue = newValue ? newValue.replace(' (new)', '') : '';
        if (cleanValue && !allCellValues.includes(cleanValue)) {
          addNewCellValue(cleanValue);
        }
        onChange(cleanValue);
        setInputValue(cleanValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
        // Only update the actual value if it's a selection, not just typing
        if (event && event.type === 'change' && allCellValues.includes(newInputValue)) {
          onChange(newInputValue);
        } else if (event && event.type !== 'change') {
          // Update value when user types and it's not just a filter
          onChange(newInputValue);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && inputValue && !allCellValues.includes(inputValue)) {
          event.preventDefault();
          const cleanValue = inputValue.replace(' (new)', '');
          addNewCellValue(cleanValue);
          onChange(cleanValue);
        }
      }}
      options={allCellValues}
      freeSolo
      selectOnFocus
      clearOnBlur={false}
      handleHomeEndKeys
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          fullWidth
          variant="outlined"
        />
      )}
      renderOption={showChips ? (option) => (
        <div className="cell-value-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
          {option.includes(' (new)') && (
            <Chip size="small" label="NEW" color="success" variant="outlined" />
          )}
          {option.startsWith('[') && option.endsWith(']') && !option.includes(' (new)') && (
            <Chip size="small" label="[ ]" color="primary" variant="outlined" />
          )}
          {/^[A-Z]+[0-9]+$/i.test(option) && !option.includes(' (new)') && (
            <Chip size="small" label="Excel" color="secondary" variant="outlined" />
          )}
          {!/^[A-Z]+[0-9]+$/i.test(option) && !option.startsWith('[') && 
           !['cell value 1', 'cell value 2', 'cell value 3', 'cell value 4'].includes(option) && 
           !option.includes(' (new)') && !dynamicCellValues.includes(option) && (
            <Chip size="small" label="Custom" color="default" variant="outlined" />
          )}
          {dynamicCellValues.includes(option) && !option.includes(' (new)') && (
            <Chip size="small" label="Added" color="info" variant="outlined" />
          )}
          <Typography variant="body2" style={{ flex: 1 }}>
            {option.replace(' (new)', '')}
          </Typography>
        </div>
      ) : undefined}
      filterOptions={(options, { inputValue: filterInputValue }) => {
        // Show matching options based on the current input
        const filtered = options.filter(option =>
          option.toLowerCase().includes(filterInputValue.toLowerCase())
        );
        
        // If input doesn't match any existing option and has content, suggest it as new
        if (filterInputValue !== '' && !options.includes(filterInputValue) && filterInputValue.trim()) {
          filtered.push(`${filterInputValue} (new)`);
        }
        
        return filtered;
      }}
      getOptionLabel={(option) => {
        return option.replace(' (new)', '');
      }}
    />
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: theme.spacing(2),
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: theme.spacing(3),
    margin: theme.spacing(1, 0),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
    paddingBottom: theme.spacing(2),
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
  formulaSection: {
    marginBottom: theme.spacing(2),
  },
  nodeContainer: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    border: '2px solid #e3f2fd',
    borderRadius: '12px',
    backgroundColor: '#fafafa',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: '#2196f3',
      boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
      backgroundColor: '#fff',
      transform: 'translateY(-2px)',
    },
  },
  compactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: '#2196f3',
      boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)',
    },
  },
  typeSelector: {
    minWidth: 100,
    maxWidth: 100,
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
    },
    '& .MuiSelect-root': {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
  },
  inputField: {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2196f3',
      },
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
  },
  resetButton: {
    minWidth: 40,
    height: 40,
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#e3f2fd',
      borderColor: '#2196f3',
      color: '#2196f3',
    },
  },
  operatorChip: {
    margin: theme.spacing(0.5),
  },
  previewSection: {
    marginTop: theme.spacing(2),
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    padding: theme.spacing(2),
    borderRadius: '8px',
    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
    fontSize: '13px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    maxHeight: 300,
    overflow: 'auto',
    border: '1px solid #e0e0e0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#1976d2',
  },
  collapsibleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: theme.spacing(1.5, 2),
    backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: 'linear-gradient(135deg, #bbdefb 0%, #e1bee7 100%)',
    },
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    lineHeight: 1.4,
  },
  conditionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: theme.spacing(2),
    alignItems: 'end',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  previewCard: {
    marginTop: theme.spacing(2),
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    border: '1px solid #e0e7ff',
    '&:hover': {
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      transform: 'translateY(-2px)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  previewHeader: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0',
    '& .MuiCardHeader-title': {
      fontSize: '1.1rem',
      fontWeight: 600,
    },
  },
  previewContent: {
    backgroundColor: 'white',
    borderRadius: '0 0 12px 12px',
    '& pre': {
      margin: 0,
      fontSize: '0.85rem',
      lineHeight: 1.5,
    },
  },
}));

const Collapsible = ({ label, children }) => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="body2" component="div">
          {label}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box width="100%">
          {children}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

// Component for IF condition operands with type selection - Professional Design
const ConditionOperand = ({ node, onChange, label }) => {
  const classes = useStyles();
  
  const changeType = (e) => {
    const type = e.target.value;
    switch (type) {
      case 'cellValue':
        onChange({ type: 'cellValue', value: _cellValueList[0] });
        break;
      case 'number':
        onChange({ type: 'number', value: 0 });
        break;
      case 'textbox':
        onChange({ type: 'textbox', value: '' });
        break;
      default:
        break;
    }
  };

  const resetValue = () => {
    switch (node.type) {
      case 'cellValue':
        onChange({ type: 'cellValue', value: _cellValueList[0] });
        break;
      case 'number':
        onChange({ type: 'number', value: 0 });
        break;
      case 'textbox':
        onChange({ type: 'textbox', value: '' });
        break;
    }
  };

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={1.5} 
      width="100%"
      sx={{
        padding: 1.5,
        borderRadius: '8px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        '&:hover': {
          borderColor: '#2196f3',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.1)',
        },
      }}
    >
      {/* Type Selector */}
      <FormControl size="small" variant="outlined" sx={{ minWidth: 80, maxWidth: 80 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={node.type}
          onChange={changeType}
          label="Type"
        >
          <MenuItem value="cellValue">
            <Box display="flex" alignItems="center" gap={0.5}>
              📊 <span>Cell</span>
            </Box>
          </MenuItem>
          <MenuItem value="number">
            <Box display="flex" alignItems="center" gap={0.5}>
              🔢 <span>Num</span>
            </Box>
          </MenuItem>
          <MenuItem value="textbox">
            <Box display="flex" alignItems="center" gap={0.5}>
              📝 <span>Text</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
      
      {/* Value Input - Flexible width */}
      <Box flex={1}>
        {node.type === 'cellValue' && (
          <EnhancedCellValueAutocomplete
            value={node.value}
            onChange={(newValue) => onChange({ ...node, value: newValue })}
            label="Cell Ref"
            placeholder="e.g., A1, [99999]"
            showChips={false}
          />
        )}
        
        {node.type === 'number' && (
          <TextField
            fullWidth
            size="small"
            label="Number"
            type="number"
            variant="outlined"
            value={node.value}
            onChange={(e) => onChange({ ...node, value: Number(e.target.value) })}
            placeholder="0"
            inputProps={{ step: 'any' }}
          />
        )}
        
        {node.type === 'textbox' && (
          <TextField
            fullWidth
            size="small"
            label="Text"
            type="text"
            variant="outlined"
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            placeholder="Enter text"
          />
        )}
      </Box>
      
      {/* Reset Button */}
      <IconButton
        size="small"
        onClick={resetValue}
        title="Reset value"
        sx={{
          minWidth: 36,
          height: 36,
          borderRadius: '6px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          '&:hover': {
            backgroundColor: '#e3f2fd',
            borderColor: '#2196f3',
            color: '#2196f3',
          },
        }}
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

const FormulaNode = ({ node, onChange }) => {
  const classes = useStyles();
  
  // Determine type key for dropdown (function:lookup -> lookup)
  const selectedType =
    node.type === 'function' && node.name === 'lookup' ? 'lookup' : node.type;

  const changeType = (e) => {
    const type = e.target.value;
    switch (type) {
      case 'cellValue':
        onChange({ type: 'cellValue', value: _cellValueList[0] });
        break;
      case 'number':
        onChange({ type: 'number', value: 0 });
        break;
      case 'textbox':
        onChange({ type: 'textbox', value: '' });
        break;
      case 'operator':
        onChange({
          type: 'operator',
          operators: ['+'], // Array of operators between arguments
          args: [{ type: 'number', value: 0 }, { type: 'number', value: 0 }],
        });
        break;
      case 'if':
        onChange({
          type: 'if',
          condition: {
            operator: '=',
            left: { type: 'cellValue', value: _cellValueList[0] },
            right: { type: 'number', value: 0 },
          },
          trueValue: { type: 'number', value: 0 },
          falseValue: { type: 'number', value: 0 },
        });
        break;
      case 'lookup':
        onChange({
          type: 'function',
          name: 'lookup',
          args: [
            { type: 'cellValue', value: _cellValueList[0] },
            { type: 'cellValue', value: 'STRUC_HRS' },
            { type: 'cellValue', value: _cellValueList[1] },
          ],
        });
        break;
      default:
        break;
    }
  };

  const renderCompactTypeControl = (node, onChange, selectedType) => {
    const resetNode = () => {
      switch (selectedType) {
        case 'cellValue':
          onChange({ type: 'cellValue', value: _cellValueList[0] });
          break;
        case 'number':
          onChange({ type: 'number', value: 0 });
          break;
        case 'textbox':
          onChange({ type: 'textbox', value: '' });
          break;
        default:
          changeType({ target: { value: selectedType } });
          break;
      }
    };

    return (
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <FormControl size="small" style={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            onChange={changeType}
            onClick={(e) => e.stopPropagation()}
          >
            {_FunctionList.map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={(e) => {
            e.stopPropagation();
            resetNode();
          }}
        >
          Reset
        </Button>
      </Box>
    );
  };

  const renderTypeControl = () => renderCompactTypeControl(node, onChange, selectedType);

  switch (node.type) {
    case 'cellValue':
      return (
        <Paper className={classes.nodeContainer} elevation={0}>
          <Box className={classes.compactRow}>
            {/* Type Selector */}
            <FormControl className={classes.typeSelector} size="small" variant="outlined">
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                onChange={changeType}
                onClick={(e) => e.stopPropagation()}
                label="Type"
              >
                {_FunctionList.map((f) => (
                  <MenuItem key={f} value={f}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {f === 'cellValue' && '📊'}
                      {f === 'number' && '🔢'}
                      {f === 'textbox' && '📝'}
                      {f === 'operator' && '⚡'}
                      {f === 'if' && '🔀'}
                      {f === 'lookup' && '🔍'}
                      <span style={{ marginLeft: 4 }}>
                        {f === 'cellValue' ? 'Cell' : f === 'textbox' ? 'Text' : f === 'number' ? 'Number' : f}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Cell Value Input - Flexible width */}
            <Box className={classes.inputField}>
              <EnhancedCellValueAutocomplete
                value={node.value}
                onChange={(newValue) => onChange({ ...node, value: newValue })}
                label="Cell Reference"
                placeholder="e.g., A1, [99999], OT1.1"
                showChips={true}
              />
            </Box>
            
            {/* Reset Button */}
            <IconButton
              className={classes.resetButton}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ type: 'cellValue', value: _cellValueList[0] });
              }}
              title="Reset to default cell value"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Typography className={classes.helpText}>
            💡 <strong>Smart Reference:</strong> Type to filter existing values or create new ones. 
            Supports Excel refs (A1), bracket refs ([99999]), and custom identifiers.
          </Typography>
        </Paper>
      );

    case 'number':
      return (
        <Paper className={classes.nodeContainer} elevation={0}>
          <Box className={classes.compactRow}>
            {/* Type Selector */}
            <FormControl className={classes.typeSelector} size="small" variant="outlined">
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                onChange={changeType}
                onClick={(e) => e.stopPropagation()}
                label="Type"
              >
                {_FunctionList.map((f) => (
                  <MenuItem key={f} value={f}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {f === 'cellValue' && '📊'}
                      {f === 'number' && '🔢'}
                      {f === 'textbox' && '📝'}
                      {f === 'operator' && '⚡'}
                      {f === 'if' && '🔀'}
                      {f === 'lookup' && '🔍'}
                      <span style={{ marginLeft: 4 }}>
                        {f === 'cellValue' ? 'Cell' : f === 'textbox' ? 'Text' : f === 'number' ? 'Number' : f}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Number Input - Flexible width */}
            <Box className={classes.inputField}>
              <TextField
                fullWidth
                size="small"
                label="Number Value"
                type="number"
                variant="outlined"
                value={node.value}
                onChange={(e) => onChange({ ...node, value: Number(e.target.value) })}
                placeholder="Enter a number"
                inputProps={{ step: 'any' }}
              />
            </Box>
            
            {/* Reset Button */}
            <IconButton
              className={classes.resetButton}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ type: 'number', value: 0 });
              }}
              title="Reset to 0"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      );

    case 'textbox':
      return (
        <Paper className={classes.nodeContainer} elevation={0}>
          <Box className={classes.compactRow}>
            {/* Type Selector */}
            <FormControl className={classes.typeSelector} size="small" variant="outlined">
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                onChange={changeType}
                onClick={(e) => e.stopPropagation()}
                label="Type"
              >
                {_FunctionList.map((f) => (
                  <MenuItem key={f} value={f}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {f === 'cellValue' && '📊'}
                      {f === 'number' && '🔢'}
                      {f === 'textbox' && '📝'}
                      {f === 'operator' && '⚡'}
                      {f === 'if' && '🔀'}
                      {f === 'lookup' && '🔍'}
                      <span style={{ marginLeft: 4 }}>
                        {f === 'cellValue' ? 'Cell' : f === 'textbox' ? 'Text' : f === 'number' ? 'Number' : f}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Text Input - Flexible width */}
            <Box className={classes.inputField}>
              <TextField
                fullWidth
                size="small"
                label="Text Value"
                type="text"
                variant="outlined"
                value={node.value}
                onChange={(e) => onChange({ ...node, value: e.target.value })}
                placeholder="Enter text value"
              />
            </Box>
            
            {/* Reset Button */}
            <IconButton
              className={classes.resetButton}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ type: 'textbox', value: '' });
              }}
              title="Clear text"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      );

    case 'operator':
      return (
        <Collapsible
          label={
            <Box display="flex" alignItems="center" onClick={(e) => e.stopPropagation()} width="100%">
              <Box display="flex" alignItems="center" gap={1}>
                <FormControl size="small" style={{ minWidth: 100 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={changeType}
                  >
                    {_FunctionList.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f === 'cellValue' ? 'Cell' : f === 'textbox' ? 'Text' : f === 'number' ? 'Num' : f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FunctionsIcon color="primary" />
                <Typography variant="body2" color="primary" style={{ fontWeight: 'bold' }}>
                  Operator: {node.operators ? node.operators.join(' ') : node.operator || '+'}
                </Typography>
              </Box>
              <Box ml="auto">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({
                      type: 'operator',
                      operators: ['+'],
                      args: [{ type: 'number', value: 0 }, { type: 'number', value: 0 }],
                    });
                  }}
                  title="Reset operator"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          }
        >
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">
                📋 Arguments & Operators
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  const newArgs = [...(node.args || []), { type: 'number', value: 0 }];
                  const newOperators = [...(node.operators || [node.operator] || ['+']), '+'];
                  onChange({
                    ...node,
                    args: newArgs,
                    operators: newOperators,
                  });
                }}
              >
                Add Argument
              </Button>
            </Box>
            
            {(node.args || []).map((arg, i) => (
              <Box key={i} mb={2}>
                {/* Argument */}
                <Paper className={classes.nodeContainer}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" style={{ fontWeight: 'bold', color: '#6c757d' }}>
                      Argument {i + 1}
                    </Typography>
                    {(node.args || []).length > 2 && (
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => {
                          const newArgs = node.args.filter((_, idx) => idx !== i);
                          const newOperators = (node.operators || []).filter((_, idx) => idx !== i || idx === 0);
                          onChange({ 
                            ...node, 
                            args: newArgs,
                            operators: newOperators.length > 0 ? newOperators : ['+']
                          });
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <FormulaNode
                    node={arg}
                    onChange={(val) => {
                      const newArgs = [...node.args];
                      newArgs[i] = val;
                      onChange({ ...node, args: newArgs });
                    }}
                  />
                </Paper>
                
                {/* Operator after this argument (except for the last argument) */}
                {i < (node.args || []).length - 1 && (
                  <Box display="flex" justifyContent="center" my={1}>
                    <FormControl size="small" style={{ minWidth: 150 }}>
                      <InputLabel>Operator</InputLabel>
                      <Select
                        value={(node.operators || [node.operator] || ['+'])[i] || '+'}
                        onChange={(e) => {
                          const newOperators = [...(node.operators || [node.operator] || ['+'])];
                          newOperators[i] = e.target.value;
                          onChange({ 
                            ...node, 
                            operators: newOperators,
                            operator: undefined // Remove old single operator property
                          });
                        }}
                      >
                        {_OperatorList.map((op) => (
                          <MenuItem key={op} value={op}>
                            {op} ({op === '+' ? 'Add' : op === '-' ? 'Subtract' : op === '*' ? 'Multiply' : 'Divide'})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Collapsible>
      );

    case 'if':
      return (
        <Collapsible
          label={
            <Box display="flex" alignItems="center" onClick={(e) => e.stopPropagation()} width="100%">
              <Box display="flex" alignItems="center" gap={1}>
                <FormControl size="small" style={{ minWidth: 100 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={changeType}
                  >
                    {_FunctionList.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f === 'cellValue' ? 'Cell' : f === 'textbox' ? 'Text' : f === 'number' ? 'Num' : f}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" style={{ color: '#0066cc', fontWeight: 'bold' }}>
                  🔀 IF Condition
                </Typography>
              </Box>
              <Box ml="auto">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({
                      type: 'if',
                      condition: {
                        operator: '=',
                        left: { type: 'cellValue', value: _cellValueList[0] },
                        right: { type: 'number', value: 0 },
                      },
                      trueValue: { type: 'number', value: 0 },
                      falseValue: { type: 'number', value: 0 },
                    });
                  }}
                  title="Reset IF condition"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          }
        >
          <Box>
            <Typography variant="h6" className={classes.sectionHeader}>
              🔍 Condition Setup
            </Typography>
            <Box className={classes.conditionGrid}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
                  Left Side
                </Typography>
                <ConditionOperand
                  node={node.condition.left}
                  onChange={(val) =>
                    onChange({
                      ...node,
                      condition: { ...node.condition, left: val },
                    })
                  }
                />
              </Box>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
                  Operator
                </Typography>
                <FormControl size="small" variant="outlined" sx={{ minWidth: 80 }}>
                  <InputLabel>Op</InputLabel>
                  <Select
                    value={node.condition.operator}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        condition: { ...node.condition, operator: e.target.value },
                      })
                    }
                    label="Op"
                  >
                    {_ConditionList.map((c) => (
                      <MenuItem key={c} value={c}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{c}</span>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>
                            {c === '=' ? 'equals' : c === '<' ? 'less' : c === '>' ? 'greater' : 'not equal'}
                          </span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
                  Right Side
                </Typography>
                <ConditionOperand
                  node={node.condition.right}
                  onChange={(val) =>
                    onChange({
                      ...node,
                      condition: { ...node.condition, right: val },
                    })
                  }
                />
              </Box>
            </Box>
          </Box>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ color: '#28a745', margin: 0, fontSize: '14px' }}>✅ True Value:</h4>
              <button
                className="btn btn-success btn-small"
                onClick={() =>
                  onChange({
                    ...node,
                    trueValue: { type: 'number', value: 0 },
                  })
                }
              >
                🔄 Reset to Simple
              </button>
            </div>
            <FormulaNode
              node={node.trueValue}
              onChange={(val) => onChange({ ...node, trueValue: val })}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ color: '#dc3545', margin: 0, fontSize: '14px' }}>❌ False Value:</h4>
              <button
                className="btn btn-danger btn-small"
                onClick={() =>
                  onChange({
                    ...node,
                    falseValue: { type: 'number', value: 0 },
                  })
                }
              >
                🔄 Reset to Simple
              </button>
            </div>
            <FormulaNode
              node={node.falseValue}
              onChange={(val) => onChange({ ...node, falseValue: val })}
            />
          </div>
        </Collapsible>
      );

    case 'function':
      if (node.name === 'lookup') {
        return (
          <Collapsible
            label={
              <Box display="flex" alignItems="center" onClick={(e) => e.stopPropagation()} width="100%">
                <Box display="flex" alignItems="center" gap={1}>
                  <FormControl size="small" style={{ minWidth: 100 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={changeType}
                    >
                      {_FunctionList.map((f) => (
                        <MenuItem key={f} value={f}>
                          {f === 'cellValue' ? 'Cell' : f === 'textbox' ? 'Text' : f === 'number' ? 'Num' : f}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" style={{ color: '#0066cc', fontWeight: 'bold' }}>
                    🔍 Function: LOOKUP
                  </Typography>
                </Box>
                <Box ml="auto">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({
                        type: 'function',
                        name: 'lookup',
                        args: [
                          { type: 'cellValue', value: _cellValueList[0] },
                          { type: 'cellValue', value: 'STRUC_HRS' },
                          { type: 'cellValue', value: _cellValueList[1] },
                        ],
                      });
                    }}
                    title="Reset LOOKUP function"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            }
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: '#0066cc', margin: 0, fontSize: '14px' }}>📋 Function Arguments:</h4>
              <button
                className="btn btn-success btn-small"
                onClick={() =>
                  onChange({
                    ...node,
                    args: [...node.args, { type: 'number', value: 0 }],
                  })
                }
              >
                ➕ Add Argument
              </button>
            </div>
            {node.args.map((arg, i) => (
              <div key={i} className="node-container" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#6c757d', fontSize: '12px' }}>
                    Argument {i + 1} {i === 0 ? '(Lookup Value)' : i === 1 ? '(Lookup Array)' : i === 2 ? '(Result Array)' : ''}
                  </span>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => {
                      const newArgs = node.args.filter((_, idx) => idx !== i);
                      onChange({ ...node, args: newArgs });
                    }}
                  >
                    🗑️ Remove
                  </button>
                </div>
                <FormulaNode
                  node={arg}
                  onChange={(val) => {
                    const newArgs = [...node.args];
                    newArgs[i] = val;
                    onChange({ ...node, args: newArgs });
                  }}
                />
              </div>
            ))}
          </Collapsible>
        );
      }
      break;

    default:
      return <div>Unknown type</div>;
  }
};

const generateExcelFormula = (node) => {
  if (!node) return '';
  switch (node.type) {
    case 'cellValue':
      return node.value;
    case 'number':
      return node.value.toString();
    case 'textbox':
      return `"${node.value}"`;
    case 'operator':
      // Handle new operators array format or legacy single operator
      if (node.args && node.args.length > 0) {
        if (node.operators && node.operators.length > 0) {
          // New format: individual operators between arguments
          let result = generateExcelFormula(node.args[0]);
          for (let i = 1; i < node.args.length; i++) {
            const operator = node.operators[i - 1] || '+';
            result += operator + generateExcelFormula(node.args[i]);
          }
          return `(${result})`;
        } else if (node.operator) {
          // Legacy format: same operator for all
          return `(${node.args.map(generateExcelFormula).join(node.operator)})`;
        }
      }
      return '';
    case 'if':
      return `IF(${generateExcelFormula(node.condition.left)}${node.condition.operator}${generateExcelFormula(
        node.condition.right
      )},${generateExcelFormula(node.trueValue)},${generateExcelFormula(node.falseValue)})`;
    case 'function':
      if (node.name === 'lookup') {
        return `LOOKUP(${node.args.map(generateExcelFormula).join(',')})`;
      }
      return '';
    default:
      return '';
  }
};

// Excel Formula Parser
const parseExcelFormula = (formula) => {
  // Remove leading = if present
  formula = formula.trim().replace(/^=/, '');
  
  console.log('Parsing formula:', formula);
  
  try {
    const result = parseExpression(formula);
    console.log('Parsed result:', result);
    return result;
  } catch (error) {
    console.error('Error parsing formula:', error);
    // Instead of returning textbox, try to parse as operator expression
    if (containsOperator(formula)) {
      console.log('Trying as operator expression...');
      try {
        return parseOperatorExpression(formula);
      } catch (opError) {
        console.error('Operator parsing also failed:', opError);
      }
    }
    return { type: 'textbox', value: formula };
  }
};

const parseExpression = (expr) => {
  expr = expr.trim();
  console.log('parseExpression called with:', expr);
  
  // Handle IF function (case insensitive) - check before parentheses
  if (/^if\s*\(/i.test(expr)) {
    console.log('Detected IF function');
    return parseIfFunction(expr);
  }
  
  // Handle LOOKUP function
  if (expr.toUpperCase().startsWith('LOOKUP(')) {
    console.log('Detected LOOKUP function');
    return parseLookupFunction(expr);
  }
  
  // Handle quoted strings
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    console.log('Detected quoted string');
    return { type: 'textbox', value: expr.slice(1, -1) };
  }
  
  // Handle square bracket references like [15401] or [99999]
  if (expr.startsWith('[') && expr.endsWith(']')) {
    console.log('Detected bracket reference');
    // Any bracket reference is treated as cellValue, regardless of _cellValueList
    return { type: 'cellValue', value: expr }; // Keep the brackets for display
  }
  
  // Handle numbers (including decimals)
  if (!isNaN(expr) && expr !== '' && !isNaN(parseFloat(expr))) {
    console.log('Detected number');
    return { type: 'number', value: Number(expr) };
  }
  
  // Check if it's a known cell value
  if (_cellValueList.includes(expr)) {
    console.log('Detected known cell value');
    return { type: 'cellValue', value: expr };
  }
  
  // Handle standard Excel cell references (A1, B2, etc.)
  if (/^[A-Z]+[0-9]+$/i.test(expr)) {
    console.log('Detected Excel cell reference');
    return { type: 'cellValue', value: expr };
  }
  
  // Handle any unknown identifier as cellValue (like OT1.1, STRUC_HRS, etc.)
  if (/^[A-Za-z0-9_.]+$/.test(expr)) {
    console.log('Detected identifier as cell value');
    return { type: 'cellValue', value: expr };
  }
  
  // Handle operator expressions (check this before parentheses for complex expressions)
  if (containsOperator(expr)) {
    console.log('Detected operator expression');
    return parseOperatorExpression(expr);
  }
  
  // Handle parentheses for simple grouping (only if no operators detected)
  if (expr.startsWith('(') && expr.endsWith(')')) {
    console.log('Detected parentheses grouping');
    const inner = expr.slice(1, -1);
    return parseExpression(inner);
  }
  
  // Default to cell value
  console.log('Defaulting to cell value');
  return { type: 'cellValue', value: expr };
};

const containsOperator = (expr) => {
  const operators = ['+', '-', '*', '/'];
  let parenDepth = 0;
  let bracketDepth = 0;
  let inQuotes = false;
  
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth--;
      else if (parenDepth === 0 && bracketDepth === 0 && operators.includes(char)) {
        return true;
      }
    }
  }
  
  return false;
};

const parseOperatorExpression = (expr) => {
  const operators = ['+', '-', '*', '/'];
  const parts = [];
  const operatorsList = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let inQuotes = false;
  
  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth--;
    }
    
    if (!inQuotes && parenDepth === 0 && bracketDepth === 0 && operators.includes(char)) {
      if (current.trim()) {
        parts.push(current.trim());
        operatorsList.push(char);
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  if (parts.length <= 1) {
    return parseExpression(parts[0] || expr);
  }
  
  return {
    type: 'operator',
    operators: operatorsList,
    args: parts.map(parseExpression)
  };
};

const parseIfFunction = (expr) => {
  // Extract content between IF( and ) - case insensitive
  const ifMatch = expr.match(/^if\s*\(/i);
  if (!ifMatch) {
    throw new Error('IF function not found');
  }
  
  const content = extractFunctionContent(expr, ifMatch[0].slice(0, -1)); // Remove the '(' 
  const args = splitFunctionArgs(content);
  
  if (args.length < 3) {
    throw new Error('IF function requires 3 arguments');
  }
  
  const conditionArg = args[0];
  const condition = parseCondition(conditionArg);
  
  return {
    type: 'if',
    condition: condition,
    trueValue: parseExpression(args[1]),
    falseValue: parseExpression(args[2])
  };
};

const parseCondition = (conditionStr) => {
  const conditionOps = ['<>', '>=', '<=', '==', '>', '<', '='];
  
  for (const op of conditionOps) {
    let index = -1;
    let parenDepth = 0;
    let bracketDepth = 0;
    let inQuotes = false;
    
    // Find operator not inside parentheses, brackets, or quotes
    for (let i = 0; i < conditionStr.length - op.length + 1; i++) {
      const char = conditionStr[i];
      
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
      }
      
      if (!inQuotes && parenDepth === 0 && bracketDepth === 0) {
        if (conditionStr.substring(i, i + op.length) === op) {
          index = i;
          break;
        }
      }
    }
    
    if (index !== -1) {
      const left = conditionStr.substring(0, index).trim();
      const right = conditionStr.substring(index + op.length).trim();
      
      // Map '==' to '=' for our UI, keep other operators as-is
      let normalizedOp = op;
      if (op === '==') {
        normalizedOp = '=';
      }
      
      return {
        operator: normalizedOp,
        left: parseExpression(left),
        right: parseExpression(right)
      };
    }
  }
  
  // Default condition if no operator found
  return {
    operator: '=',
    left: parseExpression(conditionStr),
    right: { type: 'number', value: 0 }
  };
};

const parseLookupFunction = (expr) => {
  const content = extractFunctionContent(expr, 'LOOKUP');
  const args = splitFunctionArgs(content);
  
  return {
    type: 'function',
    name: 'lookup',
    args: args.map(parseExpression)
  };
};

const extractFunctionContent = (expr, functionName) => {
  const start = expr.toLowerCase().indexOf(functionName.toLowerCase() + '(');
  if (start === -1) throw new Error(`Function ${functionName} not found`);
  
  let parenCount = 0;
  let i = start + functionName.length;
  
  for (; i < expr.length; i++) {
    if (expr[i] === '(') parenCount++;
    else if (expr[i] === ')') {
      parenCount--;
      if (parenCount === 0) break;
    }
  }
  
  return expr.substring(start + functionName.length + 1, i);
};

const splitFunctionArgs = (content) => {
  const args = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === '[') bracketDepth++;
      else if (char === ']') bracketDepth--;
      else if (char === ',' && parenDepth === 0 && bracketDepth === 0) {
        args.push(current.trim());
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
};

const FormulaBuilder = () => {
  const classes = useStyles();
  
  const [formulas, setFormulas] = useState([
    {
      type: 'operator',
      operators: ['+'],
      args: [
        { type: 'number', value: 0 },
        { type: 'number', value: 0 },
      ],
    },
  ]);
  
  const [importFormula, setImportFormula] = useState('');
  const [parseError, setParseError] = useState('');

  const updateFormulaAtIndex = (idx, newNode) => {
    const newFormulas = [...formulas];
    newFormulas[idx] = newNode;
    setFormulas(newFormulas);
  };

  const addFormula = () => {
    setFormulas([
      ...formulas,
      {
        type: 'operator',
        operators: ['+'],
        args: [{ type: 'number', value: 0 }, { type: 'number', value: 0 }],
      },
    ]);
  };

  const removeFormula = (index) => {
    const newFormulas = formulas.filter((_, i) => i !== index);
    setFormulas(newFormulas);
  };

  const handleImportFormula = () => {
    if (!importFormula.trim()) return;
    
    console.log('Importing formula:', importFormula);
    
    try {
      const parsedFormula = parseExcelFormula(importFormula);
      console.log('Successfully parsed:', parsedFormula);
      setFormulas([...formulas, parsedFormula]);
      setImportFormula('');
      setParseError('');
    } catch (error) {
      console.error('Parse error:', error);
      setParseError('Error parsing formula: ' + error.message);
    }
  };

  const handleParseAndReplace = () => {
    if (!importFormula.trim()) return;
    
    console.log('Replacing with formula:', importFormula);
    
    try {
      const parsedFormula = parseExcelFormula(importFormula);
      console.log('Successfully parsed for replacement:', parsedFormula);
      setFormulas([parsedFormula]);
      setImportFormula('');
      setParseError('');
    } catch (error) {
      console.error('Parse error:', error);
      setParseError('Error parsing formula: ' + error.message);
    }
  };

  return (
    <Box className={classes.root}>
      <Paper className={classes.container} elevation={8}>
        <Box className={classes.header}>
          <Typography variant="h3" component="h1" sx={{ 
            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            mb: 2
          }}>
            🧮 Excel Formula Builder
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#666', 
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: 600,
            mx: 'auto'
          }}>
            Build complex Excel formulas visually using our intuitive interface. 
            Create nested formulas, add conditions, and see real-time previews of your work.
          </Typography>
        </Box>

        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ 
              color: '#1976d2', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              📝 Formula Workspace
            </Typography>
            <Button 
              onClick={addFormula} 
              variant="contained" 
              size="large"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2, #039be5)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)',
                },
              }}
            >
              Add New Formula
            </Button>
          </Box>

          {/* Import/Decode Section */}
          <Card sx={{ 
            mb: 3, 
            borderRadius: '16px',
            border: '2px solid #e3f2fd',
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
            overflow: 'hidden'
          }}>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ 
                    background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
                    borderRadius: '8px',
                    p: 1,
                    display: 'flex'
                  }}>
                    🔄
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Import & Decode Excel Formula
                  </Typography>
                </Box>
              }
              sx={{ 
                background: 'linear-gradient(135deg, #bbdefb 0%, #e1bee7 100%)',
                '& .MuiCardHeader-title': { color: '#1976d2' }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField
                  value={importFormula}
                  onChange={(e) => {
                    setImportFormula(e.target.value);
                    setParseError('');
                  }}
                  placeholder="Paste your Excel formula here (e.g., =IF(A1>5,B1+C1,D1*2))"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  sx={{
                    flex: 1,
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'white',
                    }
                  }}
                />
                <Button 
                  onClick={handleImportFormula} 
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={!importFormula.trim()}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  Add Formula
                </Button>
                <Button 
                  onClick={handleParseAndReplace} 
                  variant="contained"
                  startIcon={<ImportExportIcon />}
                  disabled={!importFormula.trim()}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    background: 'linear-gradient(45deg, #ff9800, #ffb74d)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #f57c00, #ffa726)',
                    }
                  }}
                >
                  Replace All
                </Button>
              </Box>
              <Typography variant="caption" style={{ color: '#666', lineHeight: '1.4' }}>
                <strong>💡 Examples:</strong><br/>
                • <code>=A1+B1*2</code> - Simple math operations<br/>
                • <code>=IF(A1{'>'}10,"High","Low")</code> - Conditional logic<br/>
                • <code>=LOOKUP(A1,B:B,C:C)</code> - Lookup functions<br/>
                • <code>=[99999]*2.5+[12345]</code> - Bracket cell references<br/>
                • <code>=(A1+B1)*(C1-D1)</code> - Complex nested operations<br/>
                <strong>🔧 Auto-detection:</strong> Any [number] is treated as a cell reference
              </Typography>
              {parseError && (
                <Box mt={1} p={1} bgcolor="#ffebee" borderRadius={1} border="1px solid #f44336">
                  <Typography variant="caption" style={{ color: '#f44336' }}>
                    <strong>⚠️ Parse Error:</strong> {parseError}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {formulas.map((f, i) => (
            <Box key={i} className={classes.formulaSection}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 2,
                padding: 2,
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="h6" sx={{ color: '#0066cc', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Formula {i + 1}
                </Typography>
                {formulas.length > 1 && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => removeFormula(i)} 
                    startIcon={<DeleteIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#ffebee',
                        borderColor: '#f44336',
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              <FormulaNode node={f} onChange={(val) => updateFormulaAtIndex(i, val)} />
            </Box>
          ))}
        </Box>

        <Card className={classes.previewCard} elevation={2}>
          <CardHeader title="📊 JSON Preview" className={classes.previewHeader} />
          <CardContent className={classes.previewContent}>
            <Box component="pre" sx={{ 
              fontFamily: 'Courier New, monospace',
              fontSize: '0.9rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(formulas, null, 2)}
            </Box>
          </CardContent>
        </Card>

        <Card className={classes.previewCard} elevation={2}>
          <CardHeader title="📋 Excel Formula Output" className={classes.previewHeader} />
          <CardContent className={classes.previewContent}>
            <Box component="code" sx={{ 
              fontFamily: 'Courier New, monospace',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#2e7d32'
            }}>
              = {formulas.map(generateExcelFormula).join(' + ')}
            </Box>
            <Box mt={2} p={2} sx={{ 
              background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
              borderRadius: 2,
              border: '1px solid #bbdefb'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                <strong>💡 Tip:</strong> Copy the formula above and paste it directly into Excel!
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
};

export default FormulaBuilder;
