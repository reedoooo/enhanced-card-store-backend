const { logToAllSpecializedLoggers } = require('../middleware/infoLogger');

function logValidationError(message, card) {
  logToAllSpecializedLoggers('error', message, { section: 'errors', data: card }, 'log');
}

module.exports.validateCard = function validateCard(card) {
  let hasError = false;

  if (!card) {
    logValidationError('Card validation failed: card is undefined or null', card);
    return false;
  }

  // Validate the 'id' field
  if (typeof card.id !== 'string' || card.id.trim() === '') {
    logValidationError(`card.id is invalid: must be a non-empty string. Got ${card.id}`, card);
    hasError = true;
  }

  // Validate and potentially correct the 'price' field
  if (typeof card.price !== 'number') {
    const correctedPrice = parseFloat(card.price);
    if (isNaN(correctedPrice)) {
      logValidationError(`card.price is invalid after correction: Got ${card.price}`, card);
      hasError = true;
    } else {
      card.price = correctedPrice; // Correct the price in the card
    }
  }

  // Validate the 'totalPrice' field
  if (typeof card.totalPrice !== 'number') {
    logValidationError(
      `card.totalPrice is invalid: must be a number, got ${typeof card.totalPrice}.`,
      card,
    );
    hasError = true;
  }

  // Validate the 'quantity' field
  if (typeof card.quantity !== 'number' || card.quantity <= 0) {
    logValidationError(
      `card.quantity is invalid: must be a positive number, got ${card.quantity}.`,
      card,
    );
    hasError = true;
  }

  // Other validations commented out should be added here if needed...

  if (hasError) {
    return false; // If any errors are present, return false
  }

  logToAllSpecializedLoggers(
    'info',
    'Card validated and price corrected if needed',
    { section: 'info', card: card },
    'log',
  );

  return true; // If no errors, card is valid
};
