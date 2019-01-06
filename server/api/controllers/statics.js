const fs = require('fs');

exports.getStandardConditions = (req, res, next) => {
  fs.readFile('server/static/termsAndConditions.md', 'utf-8', (err, content) => {
    if (err) {
      return next(err);
    }
    return res.status(200).send(content);
  });
}; 

exports.updateStandardConditions = (req, res, next) => {
  if (req.body) {
    const update = req.body.update;
    fs.writeFile('server/static/termsAndConditions.md', update, 'utf-8', (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).send();
    });
  }
}