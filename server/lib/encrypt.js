const crypto = require('crypto');

module.exports = function encrypt(obj){
  if(obj && obj instanceof Object){
    return crypto.createHmac('sha256', obj.secret).update(obj.field).digest('hex');
  }
}