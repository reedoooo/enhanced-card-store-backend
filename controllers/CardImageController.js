const fs = require('fs');
const download = require('image-downloader');
const path = require('path');

// Load your card data
const rawData = fs.readFileSync('./routes/api/cardinfo.php.json');
const data = JSON.parse(rawData).data;

// Define the directory where the downloaded images are located
const imageDirectory = path.join(__dirname, '../../data/cards');

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
    return files.filter((file) => file.endsWith('.jpg'));
  } catch (error) {
    console.error('Error reading image directory:', error);
    return [];
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

module.exports = {
  getDownloadedImages,
  startDownload,
};
