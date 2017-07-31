const path = require('path');
const Multiparty = require('multiparty');

//过滤出表单字段数据，如为多项，忽略处理（即为数组）
function filterFields(fields) {
  let final = {};
  for (let keys in fields) {
    if (fields[keys].length <= 1) {
      final[keys] = fields[keys][0]
    } else {
      final[keys] = fields[keys];
    }
  }
  return final;
}
//过滤出文件数据，如为多项，忽略处理（即为数组）
function filterFiles(files) {
  let final = {};
  for (let keys in files) {
    if (files[keys].length <= 1) {
      final[keys] = path.basename(files[keys][0].path);
    } else {
      final[keys] = files[keys].map((item, index) => (path.basename(item.path)));
    }
  }
  return final;
}

module.exports = (ctx) => {
  return new Promise(function (resolve, reject) {
    const form = new Multiparty.Form({
      autoFiles: true,
      uploadDir: path.dirname(__dirname) + '/public/upload'
    });
    form.parse(ctx.req, function (err, fields, files) {
      resolve(Object.assign({}, filterFields(fields), filterFiles(files)));
    });
  });
}
