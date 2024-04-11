const axiosInstance = require('axios');
const cardController = require('../card');
jest.mock('axios');
describe('cardController', () => {
  describe('fetchPriceData', () => {
    it('should fetch card prices and return them', async () => {
      const cardName = 'Blue-Eyes White Dragon';
      const mockCardPrices = [10, 20, 30];
      axiosInstance.get.mockResolvedValueOnce({ data: mockCardPrices });

      const result = await cardController.fetchPriceData(cardName);

      expect(result).toEqual(mockCardPrices);
      expect(axiosInstance.get).toHaveBeenCalledWith(`/cardinfo.php?name=${cardName}`);
    });
  });

  describe('fetchDataForRandomCards', () => {
    it('should fetch and generate data for 40 random cards', async () => {
      const mockCardData = [{ name: 'Card 1' }, { name: 'Card 2' }, { name: 'Card 3' }];
      const mockFetchAndGenerateRandomCardData = jest.fn().mockResolvedValueOnce(mockCardData);
      jest
        .spyOn(cardController, 'fetchAndGenerateRandomCardData')
        .mockImplementation(mockFetchAndGenerateRandomCardData);

      const result = await cardController.fetchDataForRandomCards();

      expect(result).toEqual(mockCardData);
      expect(mockFetchAndGenerateRandomCardData).toHaveBeenCalledTimes(40);
    });
  });

  describe('fetchAndTransformCardData', () => {
    it('should fetch and transform card data', async () => {
      const mockData = {
        name: 'Blue-Eyes White Dragon',
        race: 'Dragon',
        type: 'Normal Monster',
        level: 8,
        attribute: 'Light',
      };
      const mockResponse = {
        data: {
          data: [
            {
              name: 'Card 1',
              card_prices: [{ tcgplayer_price: 10 }],
              card_images: [{ image_url: 'image1.jpg' }],
              card_sets: [{ set_rarity: 'Common' }],
            },
            {
              name: 'Card 2',
              card_prices: [{ tcgplayer_price: 20 }],
              card_images: [{ image_url: 'image2.jpg' }],
              card_sets: [{ set_rarity: 'Rare' }],
            },
            {
              name: 'Card 3',
              card_prices: [{ tcgplayer_price: 30 }],
              card_images: [{ image_url: 'image3.jpg' }],
              card_sets: [{ set_rarity: 'Ultra Rare' }],
            },
          ],
        },
      };
      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await cardController.fetchAndTransformCardData(mockData);

      expect(result).toEqual([
        {
          image: 'image1.jpg',
          quantity: 0,
          price: 10,
          totalPrice: 0,
          tag: '',
          collectionId: '',
          watchList: false,
          rarity: 'Common',
          card_set: { set_rarity: 'Common' },
          chart_datasets: [{ x: expect.any(Number), y: 10 }],
          lastSavedPrice: { num: 0, timestamp: expect.any(Number) },
          latestPrice: { num: 10, timestamp: expect.any(Number) },
          priceHistory: [],
          dailyPriceHistory: [],
          id: '1',
          name: 'Card 1',
          type: undefined,
          frameType: undefined,
          desc: undefined,
          atk: undefined,
          def: undefined,
          level: undefined,
          race: undefined,
          attribute: undefined,
          archetype: [],
          card_sets: [{ set_rarity: 'Common' }],
          card_images: [{ image_url: 'image1.jpg' }],
          card_prices: [{ tcgplayer_price: 10 }],
        },
        // Repeat the same structure for Card 2 and Card 3
      ]);
      expect(axiosInstance.get).toHaveBeenCalledWith(
        `/cardinfo.php?name=${mockData.name}&race=${mockData.race}&type=${mockData.type}&level=${mockData.level}&attribute=${mockData.attribute}`,
      );
    });
  });
});
