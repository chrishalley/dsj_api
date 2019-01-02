const fs = require('fs');

exports.getTerms = (req, res, next) => {
  fs.readFile('server/static/termsAndConditions.txt', 'utf-8', (err, content) => {
    if (err) {
      return next(err);
    }
    return res.status(200).send(content);
  });
}; 