// TCGPlayerController.js
const axios = require('axios');
const qs = require('querystring');

exports.generateToken = async (req, res) => {
  console.log('req.body', req.body);
  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.PUBLIC_KEY,
    client_secret: process.env.PRIVATE_KEY,
  });

  const config = {
    method: 'post',
    url: 'https://api.tcgplayer.com/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  };
  try {
    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error in token generation');
  }
};

exports.getCatalogCategories = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  console.log('token', token);
  const config = {
    method: 'get',
    url: 'https://api.tcgplayer.com/[VERSION]/catalog/categories',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error in getting catalog categories');
  }
};

exports.authorizeAuthCode = async (req, res) => {
  console.log('req.body', req.body);
  const options = {
    method: 'POST',
    url: 'https://api.tcgplayer.com/app/authorize/authCode',
    headers: { accept: 'application/json' },
  };
  try {
    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error in authorization');
  }
};