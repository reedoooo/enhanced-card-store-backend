// download-cards.js

const fs = require('fs');
const download = require('image-downloader');

// Load your card data
const rawData = fs.readFileSync('cardinfo.php.json');
const data = JSON.parse(rawData).data;

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
      .catch((err) => console.log(err));
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
