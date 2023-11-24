const express = require('express');
const CardImageController = require('../../controllers/CardImageController');
const { asyncHandler } = require('../../utils/utils');

const router = express.Router();
// Download card images route
router.get(
  '/download',
  // validateObjectId,
  asyncHandler(CardImageController.startDownload),
);
// router.get(
//   '/list',
//   // validateObjectId,
//   asyncHandler(CardImageController.getDownloadedImages),
// );
router.get(
  '/random?numImages=10',
  // validateObjectId,
  asyncHandler(CardImageController.getRandomCardImages),
);
router.get(
  '/:filename',
  // validateObjectId,
  asyncHandler(CardImageController.getCardImageByFilename),
);
// Express route to retrieve random card image URLs
// router.get('/random', (req, res) => {
//   const numRandomImages = 10; // Adjust the number as needed
//   const imageURLs = CardImageController.getRandomCardImages(numRandomImages);
//   res.json(imageURLs);
// });

// // Express route to retrieve the list of downloaded images
// router.get('/downloaded-images', (req, res) => {
//   const downloadedImages = CardImageController.getDownloadedImages();
//   console.log('DOWNLOADED IMAGES ________________', downloadedImages);
//   res.json(downloadedImages);
// });

// // Express route to retrieve a specific image by filename
// router.get('/image/:filename', (req, res) => {
//   const filename = req.params.filename;
//   const imagePath = CardImageController.getCardImageByFilename(filename);

//   if (imagePath) {
//     res.sendFile(imagePath);
//   } else {
//     res.status(404).json({ error: 'Image not found' });
//   }
// });

module.exports = router;
// const fs = require('fs');
// const express = require('express');
// const download = require('image-downloader');
// const router = express.Router();
// const path = require('path');

// // Load your card data
// const rawData = fs.readFileSync('./routes/api/cardinfo.php.json');
// const data = JSON.parse(rawData).data;
// // Define the directory where the downloaded images are located
// const imageDirectory = path.join(__dirname, '../../data/cards');

// function downloadCard(card) {
//   if (typeof card.card_images[0].image_url != 'undefined') {
//     const name = card.name.replace(/[/\\?%*:|"<>]/g, '');
//     let folder = 'cards';
//     const url = card.card_images[0].image_url;
//     const n = url.lastIndexOf('.');
//     const extension = url.substring(n + 1);

//     download
//       .image({
//         url: url,
//         // dest: `../../${folder}/${name}_${card.race}_${card.type}${
//         dest: `../../data/${folder}/${name}_${card.race}_${card.type}${
//           card.level ? '_lvl' + card.level : ''
//         }${card.attribute ? '_' + card.attribute : ''}.${extension}`,
//       })
//       .catch((err) => console.log(err));
//   }
// }

// // Function to get the list of downloaded images
// function getDownloadedImages() {
//   try {
//     // Read the list of files in the image directory
//     const files = fs.readdirSync(imageDirectory);
//     return files.filter((file) => file.endsWith('.jpg')); // Filter only .jpg files
//   } catch (error) {
//     console.error('Error reading image directory:', error);
//     return [];
//   }
// }

// // Express route to retrieve random card image URLs
// router.get('/random', (req, res) => {
//   // Extract image URLs from the loaded JSON data
//   const imageURLs = data.map((item) => item.card_images[0].image_url);

//   // Shuffle the image URLs to get random items
//   const shuffledURLs = imageURLs.sort(() => Math.random() - 0.5);

//   // Select the first 10 random image URLs
//   const selectedURLs = shuffledURLs.slice(0, 10);

//   res.json(selectedURLs);
// });

// // Express route to retrieve the list of downloaded images
// router.get('/downloaded-images', (req, res) => {
//   const downloadedImages = getDownloadedImages();
//   res.json(downloadedImages);
// });

// // Start the card download process
// async function startDownload() {
//   let index = 12000;

//   for (let key = index; key < data.length; key++) {
//     const card = data[key];
//     downloadCard(card);

//     // Optional delay between downloads
//     await new Promise((resolve) => setTimeout(resolve, 500));
//   }
// }

// startDownload(); // Start downloading cards

// module.exports = router;
