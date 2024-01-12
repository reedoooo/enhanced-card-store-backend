// INDEX FOR MODEL LAYOUT
// =============================================================
const User = require('./User');
const UserBasicData = require('./user/UserBasicData');
const UserSecurityData = require('./user/UserSecurityData');
const Card = require('./Card');
const { CardInCart, CardInDeck, CardInCollection, CardInSearch, CardSet, CardVariant } = Card;
const CollectionModels = require('./Collection');
const { Deck, Cart, Collection, SearchHistory } = CollectionModels;
const SearchesHistory = require('./SearchHistory');
const { SearchSession, SearchResult, SearchTerm } = SearchesHistory;
const CommonSchemas = require('./CommonSchemas');
const {
  // cards
  priceEntrySchema,
  cardSetSchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  // collections
  collectionPriceHistorySchema,
  // variants
  cardVariantSchema,
  // search
  searchTermSchema,
  searchResultSchema,
  searchSessionSchema,
} = CommonSchemas;

module.exports = {
  User,
  UserBasicData,
  UserSecurityData,
  Card,
  CardInCart,
  CardInDeck,
  CardInCollection,
  CardInSearch,
  CardSet,
  CardVariant,
  CollectionModels,
  Deck,
  Cart,
  Collection,
  SearchHistory,
  SearchesHistory,
  SearchSession,
  SearchResult,
  SearchTerm,
  CommonSchemas,
  priceEntrySchema,
  cardSetSchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  collectionPriceHistorySchema,
  cardVariantSchema,
  searchTermSchema,
  searchResultSchema,
  searchSessionSchema,
};
