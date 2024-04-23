const ensureNumber = (value) => Number(value);
const ensureString = (value) => String(value);
const ensureBoolean = (value) => Boolean(value);
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (typeof value === 'object' ? value : {});

const validateVarType = (value, type) => {
  switch (type) {
    case 'number': return ensureNumber(value);
    case 'string': return ensureString(value);
    case 'boolean': return ensureBoolean(value);
    case 'array': return ensureArray(value);
    case 'object': return ensureObject(value);
    default: return value;
  }
};

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export default {
	ensureNumber,
  ensureString,
  ensureBoolean,
  ensureArray,
  ensureObject,
  validateVarType,
  isValidObjectId,
  validateObjectId,
};