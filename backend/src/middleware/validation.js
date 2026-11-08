const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, errors.array());
  }
  next();
}

module.exports = {
  validate,
};

