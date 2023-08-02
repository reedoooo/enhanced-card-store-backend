const mongoose = require('mongoose');
const Product = require('../../models/Product');

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const products = [
  {
    _id: '1',
    category: 'Electronics',
    name: 'Samsung Galaxy S10',
    price: 699.99,
    inStock: 20,
  },
  {
    _id: '2',
    category: 'Electronics',
    name: 'Apple iPhone 13',
    price: 999.99,
    inStock: 10,
  },
  {
    _id: '3',
    category: 'Books',
    name: 'The Da Vinci Code',
    price: 14.99,
    inStock: 50,
  },
  {
    _id: '4',
    category: 'Books',
    name: 'A Brief History of Time',
    price: 19.99,
    inStock: 30,
  },
  {
    _id: '5',
    category: 'Games',
    name: 'The Last of Us Part II - PlayStation 4',
    price: 59.99,
    inStock: 15,
  },
  {
    _id: '6',
    category: 'Games',
    name: 'Super Mario Odyssey - Nintendo Switch',
    price: 59.99,
    inStock: 25,
  },
  {
    _id: '7',
    category: 'Electronics',
    name: 'HP Pavilion Gaming Laptop',
    price: 999.99,
    inStock: 10,
  },
  {
    _id: '8',
    category: 'Electronics',
    name: 'Bose QuietComfort 35 II',
    price: 299.99,
    inStock: 15,
  },
  {
    _id: '9',
    category: 'Books',
    name: 'Sapiens: A Brief History of Humankind',
    price: 18.99,
    inStock: 40,
  },
  {
    _id: '10',
    category: 'Books',
    name: 'Educated: A Memoir',
    price: 13.99,
    inStock: 35,
  },
  {
    _id: '11',
    category: 'Games',
    name: 'Call of Duty: Modern Warfare - Xbox One',
    price: 59.99,
    inStock: 20,
  },
  {
    _id: '12',
    category: 'Games',
    name: 'Legend of Zelda: Breath of the Wild - Nintendo Switch',
    price: 59.99,
    inStock: 30,
  },
  {
    _id: '13',
    category: 'Electronics',
    name: 'Apple Watch Series 7',
    price: 399.99,
    inStock: 12,
  },
  {
    _id: '14',
    category: 'Electronics',
    name: 'Sony WH-1000XM4 Headphones',
    price: 349.99,
    inStock: 8,
  },
  {
    _id: '15',
    category: 'Books',
    name: 'Becoming - Michelle Obama',
    price: 22.99,
    inStock: 60,
  },
  {
    _id: '16',
    category: 'Books',
    name: 'Where the Crawdads Sing',
    price: 15.99,
    inStock: 40,
  },
  {
    _id: '17',
    category: 'Games',
    name: 'FIFA 22 - PlayStation 5',
    price: 59.99,
    inStock: 20,
  },
  {
    _id: '18',
    category: 'Games',
    name: 'Assassin\'s Creed Valhalla - Xbox Series X',
    price: 59.99,
    inStock: 25,
  },
];

Product.insertMany(products, function (err) {
  if (err) {
    console.log('Error: ', err);
  } else {
    console.log('Products inserted successfully');
  }
  mongoose.connection.close();
});
