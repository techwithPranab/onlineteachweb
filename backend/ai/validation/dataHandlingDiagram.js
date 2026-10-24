const SUPPORTED_PICTOGRAPH_SYMBOLS = new Set(['apple', 'cake', 'chair', 'car', 'book', 'person', 'star', 'tree', 'circle', 'square']);

function validateDataHandlingDiagram(diagram) {
  if (!diagram || typeof diagram !== 'object') return [];
  const type = String(diagram.type || '').trim().toLowerCase();
  const params = diagram.params || {};
  const errors = [];
  if (type === 'pictograph') {
    if (!Array.isArray(params.data) || params.data.length < 2 || params.data.length > 10) errors.push('Pictograph data must contain 2 to 10 categories');
    else params.data.forEach((item, index) => {
      if (!String(item?.label || '').trim()) errors.push(`Pictograph category ${index + 1} needs a label`);
      if (!Number.isInteger(item?.count) || item.count < 0 || item.count > 12) errors.push(`Pictograph category ${index + 1} count must be a whole number from 0 to 12`);
    });
    if (!SUPPORTED_PICTOGRAPH_SYMBOLS.has(params.symbol)) errors.push('Pictograph symbol is not supported');
    if (!Number.isFinite(params.valuePerSymbol) || params.valuePerSymbol <= 0) errors.push('Pictograph valuePerSymbol must be a positive number');
    if (!String(params.unit || '').trim()) errors.push('Pictograph unit is required');
  }
  if (type === 'bargraph') {
    if (!Array.isArray(params.data) || params.data.length < 2 || params.data.length > 12) errors.push('Bar graph data must contain 2 to 12 categories');
    else params.data.forEach((item, index) => {
      if (!String(item?.label || '').trim()) errors.push(`Bar graph category ${index + 1} needs a label`);
      if (!Number.isFinite(item?.value) || item.value < 0) errors.push(`Bar graph category ${index + 1} value must be a non-negative number`);
    });
    if (params.orientation && !['vertical', 'horizontal'].includes(params.orientation)) errors.push('Bar graph orientation must be vertical or horizontal');
    if (params.tickStep !== undefined && (!Number.isFinite(params.tickStep) || params.tickStep <= 0)) errors.push('Bar graph tickStep must be a positive number');
    if (Number.isFinite(params.tickStep) && params.data?.some(item => Number.isFinite(item.value) && Math.abs(item.value / params.tickStep - Math.round(item.value / params.tickStep)) > 1e-9)) errors.push('Every bar value must align exactly with the graph tickStep');
  }
  return errors;
}

module.exports = { validateDataHandlingDiagram };
