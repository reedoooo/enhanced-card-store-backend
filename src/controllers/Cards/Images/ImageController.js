// // imageController.js
// const fs = require('fs').promises;
// const path = require('path');
// const download = require('image-downloader');

// const publicDirectory = path.join(__dirname, '..', 'public'); // Adjust the path according to your project structure

// async function downloadImage(url, name) {
//   const options = {
//     url,
//     dest: path.join(publicDirectory, name), // Save to the correct public folder
//   };
//   try {
//     const { filename } = await download.image(options);
//     return filename; // Return the saved filename path
//   } catch (error) {
//     logger.error('Failed to download image', error);
//     throw error;
//   }
// }

// exports.getDownloadCardImage = asyncHandler(async (req, res) => {
// const url = req.query.url; // Assume URL is passed as a query parameter
//   const name = `card_${Date.now()}.jpg`; // Generate a unique name for the image

//   try {
//     const imagePath = await downloadImage(url, name);
//     const imageUrl = `/public/${path.basename(imagePath)}`; // Convert file path to URL
//     res.send({ imageUrl }); // Send the image URL back to the client
//   } catch (error) {
//     res.status(500).send('Failed to download image');
//   }
// });
