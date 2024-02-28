const mongoose = require('mongoose');
const { model } = mongoose;
const { searchSessionSchema, searchResultSchema, searchTermSchema } = require('./CommonSchemas');

// Search-related schemas and models
const SearchSession = model('SearchSession', searchSessionSchema);
const SearchResult = model('SearchResult', searchResultSchema);
const SearchTerm = model('SearchTerm', searchTermSchema);

module.exports = {
  SearchSession,
  SearchResult,
  SearchTerm,
};
