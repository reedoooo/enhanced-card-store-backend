const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  cardImageSchema,
  cardPriceSchema,
  chartDatasetsSchema,
  cardVariantSchema,
  cardSetSchema,
  // variantSchema,
} = require("./CommonSchemas");
const createNewPriceEntry = (price) => {
  return {
    num: price,
    timestamp: new Date(),
  };
};
const createNivoXYValue = (x, y) => {
  return {
    x,
    y,
  };
};
const updateTotalPrice = (card) => {
  if (!card.quantity) card.quantity = 1;
  if (!card.price) card.price = card.card_prices[0]?.tcgplayer_price || 0;
  card.totalPrice = card.quantity * card.price;
};
function calculateContextualQuantity(card, context) {
  console.log(
    "calculating contextual quantity for: ",
    card.name,
    "in context: ",
    context
  );
  switch (context) {
    case "SearchHistory":
      return card.quantity;
    case "Deck":
      return card.quantity;
    case "Collection":
      return card.quantity;
    case "Cart":
      return card.quantity;
    default:
      throw new Error("Invalid context");
  }
}
// COMMON FIELD SCHEMAS: this data comes straight from the API
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_API_Data = {
  name: { type: String, required: false }, // AUTOSET: false || required: true
  id: { type: String, required: false, unique: false }, // AUTOSET: false || required: true
  type: String, // AUTOSET: false
  frameType: String, // AUTOSET: false
  desc: String, // AUTOSET: false
  atk: Number, // AUTOSET: false
  def: Number, // AUTOSET: false
  level: Number, // AUTOSET: false
  race: String, // AUTOSET: false
  attribute: String, // AUTOSET: false
  archetype: [String], // AUTOSET: false
  card_sets: [{ type: Schema.Types.ObjectId, ref: "CardSet" }], // Reference to CardSet
  card_images: [cardImageSchema], // AUTOSET: false
  card_prices: [cardPriceSchema], // AUTOSET: false
};
// COMMON FIELD SCHEMAS: this data is set by the user
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_User_Input_Data = {
  tag: String, // AUTOSET: false
  watchList: Boolean, // AUTOSET: false
};
// COMMON FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const commonFields_Custom_Dynamic_Data = {
  price: Number, // AUTOSET: false
  quantity: Number, // AUTOSET: false
  image: String, // AUTOSET: true
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
};
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueFields_Custom_Dynamic_Data = {
  latestPrice: priceEntrySchema, // AUTOSET: true
  lastSavedPrice: priceEntrySchema, // AUTOSET: true
  priceHistory: [priceEntrySchema], // AUTOSET: true
  dailyPriceHistory: [priceEntrySchema], // AUTOSET: false
  chart_datasets: [chartDatasetsSchema], // AUTOSET: false
  nivoChartData: {
    id: String,
    color: String,
    data: [{ x: Date, y: Number }],
  },
};
// UNIQUE FIELD SCHEMAS: this data is set initially by server (cardVariants) and then updated by user (variant), but the default value is automatically set to first cardVariant
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueVariantFields = {
  // cardVariants: [cardVariantSchema], // AUTOSET: false
  cardVariants: [{ type: Schema.Types.ObjectId, ref: "CardVariant" }], // Reference to CardSet
  variant: { type: Schema.Types.ObjectId, ref: "CardVariant" }, // Reference to CardSet
  // variant: { type: Schema.Types.ObjectId, ref: 'Variant' }, // AUTOSET: true
  rarity: String, // AUTOSET: true
  contextualQuantity: {
    SearchHistory: Number,
    Deck: Number,
    Collection: Number,
    Cart: Number,
  }, // AUTOSET: true
  contextualTotalPrice: {
    SearchHistory: Number,
    Deck: Number,
    Collection: Number,
    Cart: Number,
  }, // AUTOSET: true
};

const referenceSchema = new Schema({
  refId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
});
const allRefsSchema = new Schema({
  decks: [referenceSchema],
  collections: [referenceSchema],
  carts: [referenceSchema],
  // Add more as needed
});
const genericCardSchema = new Schema(
  {
    ...commonFields_API_Data,
    ...commonFields_Custom_Dynamic_Data,
    ...commonFields_User_Input_Data,
    ...uniqueFields_Custom_Dynamic_Data,
    ...uniqueVariantFields,
    // Unified refs field to store all references
    refs: allRefsSchema,
  },
  { timestamps: { createdAt: "addedAt", updatedAt: "updatedAt" } }
);

// Middleware for genericCardSchema
genericCardSchema.pre("save", async function (next) {
  // if (!this.isModified('price') && !this.isModified('quantity')) return next();
  if (!this.refId) {
    this.refId = this._id;
  }
  if (!this.cardModel) {
    this.cardModel = this.constructor.modelName;
  }
  if (!this.image) {
    this.image = this.card_images[0]?.image_url || "";
  }
  if (this.cardVariants && this.cardVariants.length > 0) {
    const variantIsInCardVariants = this.cardVariants.includes(this.variant);
    if (!this.variant || !variantIsInCardVariants) {
      this.variant = this.cardVariants[0];
    }
  } else {
    // If no variants available, log and skip setting rarity
    logger.info(`[WARNING] No variants available for card: ${this.name}`);
    return next();
  }
  if (this.isModified("quantity") || this.isModified("price")) {
    console.log("quantity modified", this.quantity);
    this.latestPrice = createNewPriceEntry(this.price);
    // this.lastSavedPrice = createNewPriceEntry(this.price);
    this.priceHistory.push(createNewPriceEntry(this.totalPrice));
    this.totalPrice = this.quantity * this.price;
    this.priceHistory.push(createNewPriceEntry(this.totalPrice));
    this.tag = "" || "default";
    this?.chart_datasets?.data?.push(
      createNivoXYValue(this.addedAt, this.totalPrice)
    );

    // Update contextual quantities and total prices
    const contextKeys = ["SearchHistory", "Deck", "Collection", "Cart"];
    contextKeys.forEach((context) => {
      if (context === this.collectionModel) {
        this.contextualQuantity[context] = calculateContextualQuantity(
          this,
          context
        );
        this.contextualTotalPrice[context] =
          this.contextualQuantity[context] * this.price;
      }
    });
  }

  if (!this.totalPrice) {
    if (!this.quantity) {
      console.log("quantity not set, setting to 1");
      this.quantity = 1;
    }
    if (!this.price) {
      console.log("price not set, destructuring tcgPrice");
      this.price = this.card_prices[0]?.tcgplayer_price || 0;
    }
    console.log("totalPrice not set, attempting update");
    this.totalPrice = this.quantity * this.price;
    console.log("totalPrice updated", this.totalPrice.green);
  }
  if (this.updateRefs) {
    // Handle deck references
    if (this.updateRefs.deckRefs) {
      this.updateRefs.deckRefs.forEach((updateRef) => {
        const index = this.deckRefs.findIndex((ref) =>
          ref.deckId.equals(updateRef.deckId)
        );
        if (index > -1) {
          // Update existing reference
          this.deckRefs[index].quantity = updateRef.quantity;
        } else {
          // Add new reference
          this.deckRefs.push(updateRef);
        }
      });
    }

    // Handle collection references
    if (this.updateRefs.collectionRefs) {
      this.updateRefs.collectionRefs.forEach((updateRef) => {
        const index = this.collectionRefs.findIndex((ref) =>
          ref.collectionId.equals(updateRef.collectionId)
        );
        if (index > -1) {
          // Update existing reference
          this.collectionRefs[index].quantity = updateRef.quantity;
        } else {
          // Add new reference
          this.collectionRefs.push(updateRef);
        }
      });
    }

    // Handle cart references
    if (this.updateRefs.cartRefs) {
      this.updateRefs.cartRefs.forEach((updateRef) => {
        const index = this.cartRefs.findIndex((ref) =>
          ref.cartId.equals(updateRef.cartId)
        );
        if (index > -1) {
          // Update existing reference
          this.cartRefs[index].quantity = updateRef.quantity;
        } else {
          // Add new reference
          this.cartRefs.push(updateRef);
        }
      });
    }

    // Clear the updateRefs to prevent reprocessing
    this.updateRefs = null;
  }
  // Populate the variant field
  try {
    await this.populate("variant");

    // Set rarity after successful population
    if (this.variant) {
      this.rarity = this.variant.rarity;
    } else {
      console.log(`[WARNING] Variant not populated for card: ${this.name}`);
    }
  } catch (error) {
    console.log(`[GENERIC CARD: ${this.name}] PRE SAVE ERROR: `, error);
    return next(error);
  }

  const modifiedFields = [
    "image",
    "latestPrice",
    "lastSavedPrice",
    "totalPrice",
    "priceHistory",
    "rarity",
  ];
  modifiedFields.forEach(field => this.markModified(field));

  next();
});

const CardSet = model("CardSet", cardSetSchema);
// const Variant = model('Variant', variantSchema);
const CardVariant = model("CardVariant", cardVariantSchema);
const CardInCollection = mongoose.model("CardInCollection", genericCardSchema);
const CardInDeck = mongoose.model("CardInDeck", genericCardSchema);
const CardInCart = mongoose.model("CardInCart", genericCardSchema);
const CardInSearch = mongoose.model("CardInSearch", genericCardSchema);

module.exports = {
  CardInCollection,
  CardInDeck,
  CardInCart,
  CardInSearch,
  CardSet,
  CardVariant,
};
