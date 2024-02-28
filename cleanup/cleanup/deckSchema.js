// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const deckSchema = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Reference to the user who owns this deck
//   name: String, // Name of the deck
//   description: String, // Description of the deck
//   totalPrice: { type: Number, default: 0 }, // Total price of all cards in the deck
//   quantity: { type: Number, default: 0 }, // Total quantity of all cards in the deck
//   tags: [String], // Tags or categories associated with this deck
//   color: String, // Color or theme of the deck
//   items: [{ type: Schema.Types.ObjectId, ref: 'DeckItem' }], // Array of DeckItem references
//   // Include other fields as needed
// });

// const Deck = mongoose.model('Deck', deckSchema);
// module.exports = { Deck };
