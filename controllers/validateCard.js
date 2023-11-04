module.exports = function validateCard(card) {
  if (!card) return false;

  // Validate the 'id' field
  if (typeof card.id !== 'string' || card.id.trim() === '') {
    console.log('card.id is invalid');
    console.log(card.id);
    console.log(typeof card.id);
    console.log(card.id.trim() === '');
    return false;
  }

  // Validate the 'price' and 'totalPrice' fields
  if (typeof card.price !== 'number') {
    console.log('card.price is invalid');
    console.log(card.price);
    console.log(typeof card.price);
    return false;
  }

  if (typeof card.totalPrice !== 'number') {
    console.log('card.totalPrice is invalid');
    console.log(card.totalPrice);
    console.log(typeof card.totalPrice);
    return false;
  }

  // Validate the 'quantity' field
  if (typeof card.quantity !== 'number' || card.quantity <= 0) {
    console.log('card.quantity is invalid');
    console.log(card.quantity);
    console.log(typeof card.quantity);
    console.log(card.quantity <= 0);
    return false;
  }

  // Validate the 'chart_datasets' field
  if (!Array.isArray(card.chart_datasets)) return false;
  for (let dataset of card.chart_datasets) {
    if (typeof dataset.x !== 'object' || typeof dataset.y !== 'number') return false;
  }

  return true;
};
