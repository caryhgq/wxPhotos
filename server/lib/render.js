const pug = require('pug');

module.exports = (file,options = {})=>{
  options.pretty = true;
  return pug.renderFile('./views/'+file+'.pug', options);
};
