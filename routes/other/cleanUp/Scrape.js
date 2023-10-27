const mongoose = require('mongoose');

const PricingDataSchema = new mongoose.Schema({
  date: String,
  condition: String,
  quantity: String,
  price: String,
});

const PricingData2Schema = new mongoose.Schema({
  pricePoint: String,
  price: String,
});

const ListingGeneralInfoSchema = new mongoose.Schema({
  otherListings: String,
  lowestAvailablePrice: String,
});

const ListingSpotlightInfoSchema = new mongoose.Schema({
  spotlightCondition: String,
  spotlightPrice: String,
  spotlightShipping: String,
  spotlightSeller: String,
});

const ScrapeSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    pricingData: [PricingDataSchema],
    pricingData2: [PricingData2Schema],
    listingGeneralInfo: ListingGeneralInfoSchema,
    listingSpotlightInfo: ListingSpotlightInfoSchema,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Scrapes', ScrapeSchema);
