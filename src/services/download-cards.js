const fs = require('fs');
const download = require('image-downloader');
const { UPLOADED_IMAGES_PATH } = require('../configs/constants');
const logger = require('../configs/winston');
const rawData = fs.readFileSync('cardinfo.php.json');
const data = JSON.parse(rawData).data;
if (!fs.existsSync(UPLOADED_IMAGES_PATH)) {
  fs.mkdirSync(UPLOADED_IMAGES_PATH, { recursive: true });
}
function downloadCard(card) {
  if (typeof card.card_images[0].image_url != 'undefined') {
    const name = card.name.replace(/[/\\?%*:|"<>]/g, '');

    let folderA = 'public';
    let folderB = 'cards';

    const url = card.card_images[0].image_url;
    const n = url.lastIndexOf('.');
    const extension = url.substring(n + 1);

    download
      .image({
        url: url,
        dest: `${folderA}/${folderB}/${name}_${card.race}_${card.type}${
          card.level ? '_lvl' + card.level : ''
        }${card.attribute ? '_' + card.attribute : ''}.${extension}`,
      })
      .catch((err) => logger.info(err));
  }
}
/**
 * Downloads an image from a URL to a specific destination.
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} imageName - The name of the image file, including the file extension.
 * @returns {Promise<string>} A promise that resolves with the path to the downloaded image.
 * @example downloadImage('https://example.com/image.jpg', 'image.jpg');
 * @example downloadImage('URL_OF_THE_IMAGE', 'desiredImageName.jpg');
 */
async function downloadImage(imageUrl, imageName) {
  const options = {
    url: imageUrl,
    dest: path.join(publicDirectory, imageName), // Save to public/images directory
  };

  try {
    const { filename } = await download.image(options);

    logger.info('Saved to', filename); // Saved to public/images/imageName
  } catch (error) {
    logger.error('Failed to download image:', error);
  }
}

async function startDownload() {
  let index = 12000;

  for (let key = index; key < data.length; key++) {
    const card = data[key];

    downloadCard(card);
    await wait(500); // Optional delay between downloads
  }
}

module.exports = startDownload;
