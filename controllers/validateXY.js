module.exports = function validateXY(xy) {
  if (!xy) return false;

  // Validate the 'label' field
  if (typeof xy.label !== 'string' || xy.label.trim() === '') return false;

  // Validate the 'x' and 'y' fields
  if (typeof xy.data.x !== 'object' || typeof xy.data.y !== 'number') return false;

  return true;
};
