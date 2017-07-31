const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const db = require('../conf/db');
const privatekey = require('../conf/privatekey');
const router = new Router();

const feedback = db.get('feedback');


//提交意见反馈
router.post('/photo/api/gallery/feedback', async(ctx, next) => {
  console.log(ctx.request.body);
  let token = ctx.request.body.token;
  let  formData = ctx.request.body.formData;
  if (token && formData) {
    const decoded = jwt.verify(token, privatekey);
    if (decoded.openid) {
      delete decoded.iat;
      let findResult = await feedback.find({openid : decoded.openid});
      if(findResult.length >= 1){
        delete findResult[0]['_id'];
        formData.createTime = new Date();
        findResult[0].feedback.push(formData);
        await feedback.update({openid:decoded.openid},findResult[0]);
      }else{
        decoded.feedback = [];
        formData.createTime = new Date();
        decoded.feedback.push(formData);
        await feedback.insert(decoded);
      }

      ctx.body = {
        code: 'succeed',
        message: '反馈成功！'
      };
    } else {
      ctx.body = {
        code: 'failed',
        message: '反馈失败！'
      };
    }

  }
});

router.allowedMethods();

module.exports = router;
