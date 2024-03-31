const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {
  priceEntrySchema,
  cardImageSchema,
  cardPriceSchema,
  cardVariantSchema,
  cardSetSchema,
  averagedDataSchema,
  chartDatasetEntrySchema,
  createNewPriceEntry,
  dataPointSchema,
  createDataPoint,
} = require("./schemas/CommonSchemas");
const logger = require("../configs/winston");
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
  rarity: String,
  rarities: {
    type: Map,
    of: String,
  },
  sets: {
    type: Map,
    of: String,
  },
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
};
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueFields_Custom_Dynamic_Data = {
  latestPrice: priceEntrySchema, // AUTOSET: true
  lastSavedPrice: priceEntrySchema, // AUTOSET: true
  priceHistory: [priceEntrySchema], // AUTOSET: true
  dailyPriceHistory: [priceEntrySchema], // AUTOSET: false
  priceChangeHistory: [
    {
      timestamp: Date,
      oldPrice: Number,
      newPrice: Number,
      priceDifference: Number,
    },
  ],
  chart_datasets: [chartDatasetEntrySchema],
  nivoChartData: {
    id: String,
    color: String,
    data: [{ x: Date, y: Number }],
  },
};
// UNIQUE FIELD SCHEMAS: this data is set initially by server (cardVariants) and then updated by user (variant), but the default value is automatically set to first cardVariant
// SAVE FUNCTION: fetchAndTransformCardData
const uniqueVariantFields = {
  cardVariants: [{ type: Schema.Types.ObjectId, ref: "CardVariant" }], // Reference to CardSet
  cardModel: String, // AUTOSET: true
  variant: { type: Schema.Types.ObjectId, ref: "CardVariant" }, // Reference to CardSet
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
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
const referenceSchema = new Schema({
  refId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
});
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
const allRefsSchema = new Schema({
  decks: [referenceSchema],
  collections: [referenceSchema],
  carts: [referenceSchema],
  randomCards: {
    type: Map,
    of: referenceSchema,
  },
});
// UNIQUE FIELD SCHEMAS: this data is set, tracked and often updated by the server using data from the API
const randomCardSchema = new Schema({
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
  image: String, // AUTOSET: false
  dailyPriceChange: Number,
  dailyPercentageChange: String,
  refs: allRefsSchema, // AUTOSET: false
  priceHistory: [priceEntrySchema],
  valueHistory: [priceEntrySchema],
  nivoValueHistory: [dataPointSchema],
  averagedChartData: {
    type: Map,
    of: averagedDataSchema,
  },
  nivoChartData: {
    id: String,
    color: String,
    data: [{ x: Date, y: Number }],
  },
  price: Number, // AUTOSET: false
  quantity: Number, // AUTOSET: false
  totalPrice: { type: Number, default: 0 }, // AUTOSET: true
  addedAt: { type: Date, default: Date.now }, // AUTOSET: true
  updatedAt: { type: Date, default: Date.now }, // AUTOSET: true
});

const RandomCard = model("RandomCard", randomCardSchema);
const RandomCardData = mongoose.model("RandomCardData", randomCardSchema);
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
  if (!this.valueHistory) {
    this.valueHistory = [];
  }
  if (!this.nivoValueHistory) {
    this.nivoValueHistory = [];
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
    logger.info("quantity modified", this.quantity); // this?.chart_datasets?.data?.push(
    //   createNivoXYValue(this.addedAt, this.totalPrice)
    // );
    const newPriceEntry = createNewPriceEntry(this.price); // Your existing function
    this.priceHistory.push(newPriceEntry);
    const newChartDataEntry = {
      label: "Your Label",
      data: [{ x: new Date(), y: this.totalPrice }],
    };
    this.chart_datasets.push(newChartDataEntry);

    // Check if there's an existing entry for today's date (or whichever key you're using)
    // const chartKey = new Date().toISOString().split("T")[0]; // Example key: 'YYYY-MM-DD'
    // if (!this.chart_datasets?.has(chartKey)) {
    //   this.chart_datasets?.set(chartKey, [newChartDataEntry]); // Initialize with an array containing the new entry
    // } else {
    //   const existingEntries = this.chart_datasets.get(chartKey);
    //   existingEntries.push(newChartDataEntry);
    //   this.chart_datasets.set(chartKey, existingEntries);
    // }
    const oldTotal = this.totalPrice;
    this.lastSavedPrice = createNewPriceEntry(oldTotal); // Your existing function
    this.totalPrice = this.quantity * this.price;
    this.latestPrice = createNewPriceEntry(this.quantity * this.price); // Your existing function
    // this.lastSavedPrice = this.valueHistory[this?.valueHistory?.length - 1];
    const valueEntry = {
      timestamp: new Date(),
      num: this.totalPrice,
    }; // Your existing function
    this.valueHistory.push(valueEntry);
    this.nivoValueHistory.push(
      createDataPoint(valueEntry?.timestamp, valueEntry?.num, "Data: ")
    );
    this.tag = "" || "default";

    // Update contextual quantities and total prices
    const contextKeys = ["Deck", "Collection", "Cart"];
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
      logger.info("quantity not set, setting to 1");
      this.quantity = 1;
    }
    if (!this.price) {
      logger.info("price not set, destructuring tcgPrice");
      this.price = this.card_prices[0]?.tcgplayer_price || 0;
    }
    logger.info("totalPrice not set, attempting update");
    this.totalPrice = this.quantity * this.price;
    logger.info("totalPrice updated", this.totalPrice.green);
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
  try {
    await this.populate("variant");

    // Set rarity after successful population
    if (this.variant) {
      this.rarity = this.variant.rarity;
    } else {
      logger.info(`[WARNING] Variant not populated for card: ${this.name}`);
    }
  } catch (error) {
    logger.info(`[GENERIC CARD: ${this.name}] PRE SAVE ERROR: `, error);
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
  modifiedFields.forEach((field) => this.markModified(field));

  next();
});

const CardSet = model("CardSet", cardSetSchema);
// const Variant = model('Variant', variantSchema);
const CardVariant = model("CardVariant", cardVariantSchema);
const CardInCollection = mongoose.model("CardInCollection", genericCardSchema);
const CardInDeck = mongoose.model("CardInDeck", genericCardSchema);
const CardInCart = mongoose.model("CardInCart", genericCardSchema);

module.exports = {
  CardInCollection,
  CardInDeck,
  CardInCart,
  CardSet,
  CardVariant,
  RandomCard,
  RandomCardData,
};
