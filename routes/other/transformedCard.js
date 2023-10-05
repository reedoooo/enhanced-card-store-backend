const colors = require('colors');
const { getIO } = require('../../socket');
const { ChartData, ChartDataSchema } = require('../../models/ChartData');
const User = require('../../models/User');

const transformCard = async (dataset) => {
  const dataPoints = dataset?.datasets[0]?.data?.points;
  const cardName = dataPoints?.cardName;

  const existingCard = await ChartData.findOne({ 'datasets.data.points.cardName': cardName });

  if (!existingCard && (!dataPoints || !dataPoints?.y)) {
    console.error(
      'No existing card found and dataPoints.y is also missing for cardName:',
      cardName,
    );
    return null;
  }

  const initialPrice = existingCard ? existingCard?.updatedPrice : dataPoints?.y;
  const updatedPrice = dataPoints?.y;
  const cardQuantity = dataPoints?.totalQuantity;
  const totalCardPrice = dataPoints?.totalPrice;
  const priceDifference = updatedPrice - initialPrice;
  const priceChange = priceDifference / (initialPrice || 1);
  const priceChanged = priceDifference !== 0;
  const roundedPriceChange = Math.round(priceChange * 100) / 100;

  return {
    userId: dataset?.userId,
    collectionId: dataset?.collectionId,
    chartId: dataset?.chartId,
    cardData: {
      cardId: dataset?._id,
      initialPrice: initialPrice,
    },
    cardInfoData: {
      updatedPrice: updatedPrice,
      cardQuantity: cardQuantity,
      totalCardPrice: totalCardPrice,
      priceDifference: priceDifference,
      priceChanged: priceChanged,
      roundedPriceChange: roundedPriceChange,
    },
  };
};

const transformedDataSets = async (datasets) => {
  if (!datasets || !Array.isArray(datasets)) {
    console.error('Datasets is either undefined or not an array.');
    return [];
  }

  const transformedCards = await Promise.all(
    datasets.map(async (dataset) => await transformCard(dataset)),
  );

  // Since the transformedCard returns data in a different format from your ChartData schema,
  // you need to extract the necessary fields and structure the document correctly before saving.

  const transformedChartData = {
    userId: datasets[0]?.userId,
    datasets: transformedCards.map((card) => ({
      label: card.cardName,
      data: [card.cardData, card.cardInfoData], // you can adjust this to fit the intended schema structure
    })),
  };

  const savedChartData = new ChartData(transformedChartData);
  await savedChartData.save();

  const io = getIO();
  io.emit('CARD_STATS_UPDATE', savedChartData);
  return transformedCards;
};

module.exports = { transformedDataSets, transformCard };
