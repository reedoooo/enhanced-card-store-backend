const fs = require('fs').promises;
const download = require('image-downloader');
const path = require('path');
const { respondWithError } = require('../../utils/utils');
const { FILE_CONSTANTS } = require('../../constants');

async function loadData() {
  const filePath = path.join(__dirname, '..', 'data', 'cardinfo.php.json');
  try {
    const rawData = await fs.readFile(filePath);
    return JSON.parse(rawData).data.slice(0, 10); // Limit to first 10 cards
  } catch (error) {
    console.error(`Error loading card data from ${filePath}:`, error);
    return [];
  }
}

async function downloadCard(card) {
  if (card.card_images && card.card_images.length > 0) {
    const name = card.name.replace(/[/\\?%*:|"<>]/g, '');
    const url = card.card_images[0].image_url;
    const extension = path.extname(url);
    const fullName = `${name}_${card.race}_${card.type}${card.level ? '_lvl' + card.level : ''}${
      card.attribute ? '_' + card.attribute : ''
    }${extension}`;

    try {
      const destPath =
        process.env.NODE_ENV === 'production'
          ? path.join(__dirname, '..', 'public', 'images', 'cards', fullName)
          : path.join(__dirname, '..', 'data', 'cards', fullName);

      await download.image({ url: url, dest: destPath });
      console.log(`Downloaded: ${name}`);
    } catch (err) {
      console.error(`Error downloading ${name}:`, err);
    }
  }
}

exports.startDownload = async (req, res, next) => {
  try {
    const data = await loadData();
    for (const card of data) {
      await downloadCard(card);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay between downloads
    }
    res.json({ message: 'Download started for cards', data: data });
  } catch (error) {
    respondWithError(res, 500, 'Error starting download', error);
  }
};

async function getDownloadedImages() {
  try {
    const files = await fs.readdir(FILE_CONSTANTS.DOWNLOADED_IMAGES_PATH);
    return files
      .filter((file) => file.endsWith('.jpg'))
      .map((file) => path.join(FILE_CONSTANTS.DOWNLOADED_IMAGES_PATH, file));
  } catch (error) {
    console.error('Error reading image directory:', error);
    return [];
  }
}

exports.getCardImageByFilename = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(FILE_CONSTANTS.DOWNLOADED_IMAGES_PATH, filename);
    if (await fs.stat(imagePath).catch(() => false)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).send('Image not found');
    }
  } catch (error) {
    respondWithError(res, 500, 'Error getting card image by filename', error);
  }
};

// const fs = require('fs').promises;
// const download = require('image-downloader');
// const path = require('path');
// const { respondWithError } = require('../utils/utils');
// const { logData } = require('../utils/loggingUtils');
// const { FILE_CONSTANTS } = require('../constants');

// // async function loadData() {
// //   try {
// //     const rawData = await fs.readFile(FILE_CONSTANTS.CARDINFO_PHP_JSON__PATH);
// //     return JSON.parse(rawData).data;
// //   } catch (error) {
// //     console.error('Error loading card data:', error);
// //   }
// // }

// async function loadData() {
//   const filePath = path.join(__dirname, '..', 'data', 'cardinfo.php.json');
//   try {
//     const rawData = await fs.readFile(filePath);
//     const data = JSON.parse(rawData).data;

//     // Limit to the first 10 cards
//     const limitedData = data.slice(0, 10);
//     return limitedData;
//   } catch (error) {
//     console.error(`Error loading card data from ${filePath}:`, error);
//     return null; // Or handle the error as needed
//   }
// }

// async function downloadCard(card) {
//   if (card.card_images && card.card_images.length > 0) {
//     console.log('downloadCard data...');

//     const name = card.name.replace(/[/\\?%*:|"<>]/g, '');
//     let folder = 'cards';
//     const url = card.card_images[0].image_url;
//     const n = url.lastIndexOf('.');
//     const extension = url.substring(n + 1);
//     const fullName = `${name}_${card.race}_${card.type}${card.level ? '_lvl' + card.level : ''}${
//       card.attribute ? '_' + card.attribute : ''
//     }.${extension}`;

//     try {
//       await download.image({
//         url: url,
//         dest: `../../data/${folder}/${fullName}`,
//       }),
//         console.log(`Downloaded: ${name}`);
//     } catch (err) {
//       console.log(`Error downloading ${name}:`, err);
//     }
//   }
// }

// exports.startDownload = async (req, res, next) => {
//   try {
//     console.log('Loading data...');
//     const data = await loadData();
//     logData(data);
//     console.log('Data loaded. Starting download...');
//     for (let key = 12000; key < data.length; key++) {
//       await downloadCard(data[key]);
//       await new Promise((resolve) => setTimeout(resolve, 500)); // Delay
//     }
//     // res.send('Download started for: ' + data.length + ' cards');
//     res.json({ message: 'Success', data: data });
//   } catch (error) {
//     console.error('Error starting download:', error);
//     respondWithError(res, 500, 'Error updating collection in startDownload', error);

//     next(error);
//   }
// };

// // function shuffleArray(array) {
// //   const shuffledArray = [...array];
// //   for (let i = shuffledArray.length - 1; i > 0; i--) {
// //     const j = Math.floor(Math.random() * (i + 1));
// //     [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
// //   }
// //   return shuffledArray;
// // }

// exports.getRandomCardImages = async (req, res, next) => {
//   try {
//     console.log('getRandomCardImages data...');
//     console.log('req.query', req.query);
//     const numImages = parseInt(req.query.numImages) || 10;
//     console.log('numImages', numImages);
//     const downloadedImages = await getDownloadedImages();
//     console.log('downloadedImages', downloadedImages);

//     if (!downloadedImages || downloadedImages.length < numImages) {
//       console.log('Not enough images downloaded. Starting download process...');
//       // Initiate the download process
//       this.startDownload()
//         .then(() => {
//           res.status(202).send('Download process started. Not enough images were available.');
//         })
//         .catch((error) => {
//           respondWithError(res, 500, 'Error initiating download in getRandomCardImages', error);
//         });
//       return;
//     }

//     res.json({ message: 'Success', data: downloadedImages.slice(0, numImages) });
//   } catch (error) {
//     respondWithError(res, 500, 'Error fetching random card images', error);
//     next(error);
//   }
//   return null;
// };

// // [...             ...]
// // Route to get a card image by filename
// // [...             ...]
// exports.getCardImageByFilename = async (req, res, next) => {
//   try {
//     const filename = req.params.filename;

//     const imagePath = path.join(FILE_CONSTANTS.DOWNLOADED_IMAGES_PATH, filename);
//     if (await fs.stat(imagePath).catch(() => false)) {
//       res.sendFile(imagePath);
//     } else {
//       res.status(404).send('Image not found');
//     }
//   } catch (error) {
//     respondWithError(res, 500, 'Error updating collection in getCardImageByFilename', error);

//     next(error);
//   }
//   return null;
// };

// async function getDownloadedImages() {
//   try {
//     const files = await fs.readdir(FILE_CONSTANTS.DOWNLOADED_IMAGES_PATH);
//     console.log('files', files);
//     const imageFiles = files.filter((file) => file.endsWith('.jpg'));
//     console.log('imageFiles', imageFiles);
//     return imageFiles.map((file) => path.join(FILE_CONSTANTS.DOWNLOADED_IMAGES_PATH, file));
//   } catch (error) {
//     console.error('Error reading image directory:', error);
//   }
// }
