const fs = require('fs');
const download = require('image-downloader');
const path = require('path');

// Load your card data
const rawData = fs.readFileSync('./routes/api/cardinfo.php.json');
const data = JSON.parse(rawData).data;

// Define the directory where the downloaded images are located
const imageDirectory = path.join(__dirname, '../data/cards');
console.log('--------------------IMAGE DIRECTORY--------------------', imageDirectory);

function downloadCard(card) {
  console.log('DOWNLOADING CARD', card);
  if (typeof card.card_images[0].image_url != 'undefined') {
    const name = card.name.replace(/[/\\?%*:|"<>]/g, '');
    let folder = 'cards';
    const url = card.card_images[0].image_url;
    const n = url.lastIndexOf('.');
    const extension = url.substring(n + 1);

    download
      .image({
        url: url,
        dest: `../../data/${folder}/${name}_${card.race}_${card.type}${
          card.level ? '_lvl' + card.level : ''
        }${card.attribute ? '_' + card.attribute : ''}.${extension}`,
      })
      .catch((err) => console.log(err));
  }
}

function getDownloadedImages() {
  console.log('GETTING DOWNLOADED IMAGES');
  try {
    const files = fs.readdirSync(imageDirectory);
    // console.log('--------------------FILES--------------------', files);
    const imageFiles = files.filter((file) => file.endsWith('.jpg'));
    // console.log('--------------------IMAGE FILES--------------------', imageFiles);
    const imagePaths = imageFiles.map((file) => path.join(imageDirectory, file));
    // console.log('--------------------IMAGE PATHS--------------------', imagePaths);

    return imagePaths;
  } catch (error) {
    console.error('Error reading image directory:', error);
  }
}

async function startDownload() {
  console.log('STARTING DOWNLOAD');
  let index = 12000;

  for (let key = index; key < data.length; key++) {
    const card = data[key];
    downloadCard(card);

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Function to get a random subset of card images
function getRandomCardImages(numImages) {
  const downloadedImages = getDownloadedImages();

  // Shuffle the array of downloaded images randomly
  const shuffledImages = shuffleArray(downloadedImages);

  // Take the first `numImages` images from the shuffled array
  const randomImages = shuffledImages.slice(0, numImages);

  return randomImages;
}

// Function to shuffle an array randomly
function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

// Function to get the path of a card image by filename
function getCardImageByFilename(filename) {
  const imagePath = path.join(imageDirectory, filename);
  if (fs.existsSync(imagePath)) {
    return imagePath;
  }
  return null;
}

module.exports = {
  getDownloadedImages,
  startDownload,
  getRandomCardImages, // Add getRandomCardImages function
  getCardImageByFilename, // Add getCardImageByFilename function
};
