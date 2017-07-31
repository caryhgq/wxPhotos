const jsSHA = require('jssha');

const createNonceStr = () => (Math.random().toString(36).substr(2, 15));

const createTimestamp = () => (parseInt(new Date().getTime() / 1000) + '');

const raw = (args) => {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function(key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};

const sign = (jsapi_ticket, url) => {
  let ret = {
    jsapi_ticket: jsapi_ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimestamp(),
    url: url
  };
  (new jsSHA("SHA-1", "TEXT")).update(raw(ret));
  ret.signature = shaObj.getHash("HEX")
  return ret;
};

module.exports = sign;
