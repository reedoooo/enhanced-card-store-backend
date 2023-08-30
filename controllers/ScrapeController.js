const axios = require('axios');
const ScrapeSchema = require('../models/Scrape'); // Adjust path if necessary.

const TCGPlayer_API_BaseURL = 'https://api.tcgplayer.com/v1.17.0';

const getCardDetailsFromTCGPlayerAPI = async (cardName, headers) => {
  // Start by searching for the card
  const response = await axios.post(
    `${TCGPlayer_API_BaseURL}/catalog/categories/24/search`,
    {
      sort: 'MinPrice DESC',
      limit: 10,
      offset: 0,
      filters: [
        {
          name: 'ProductName',
          values: [cardName],
        },
      ],
    },
    { headers },
  );

  if (!response.data || !response.data.success) {
    throw new Error('Failed to fetch card details from TCGPlayer API');
  }

  // Here, you'd process the API response and extract the details you need
  return response.data.results; // This may need to be adjusted depending on the exact response structure
};

exports.scrapeGetHandler = async (req, res) => {
  console.log('Request', req.body);
  const cardName = req.cardName || 'Dark Magician';

  const defaultHeaders = {
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const result = await getCardDetailsFromTCGPlayerAPI(
      cardName,
      defaultHeaders,
    );
    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal server error occurred.');
  }
};

exports.scrapePostHandler = async (req, res) => {
  console.log('Request', req);
  const cardName = req.cardName || 'Dark Magician';

  if (!cardName) {
    return res.status(400).send('Card name is required.');
  }

  // Extract bearerToken from cookies
  const bearerToken = req.cookies.AWSALB; // Adjust the cookie name accordingly if it's different
  if (!bearerToken) {
    return res.status(401).send('Bearer token is missing.');
  }

  const headers = {
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const data = await getCardDetailsFromTCGPlayerAPI(cardName, headers); // Pass the headers to the function

    // Save to MongoDB using Mongoose
    const savedData = await ScrapeSchema.findOneAndUpdate(
      { url: data.url },
      data,
      {
        upsert: true,
        new: true,
      },
    );

    res.json(savedData);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal server error occurred.');
  }
};
