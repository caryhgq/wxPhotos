const Router = require('koa-router');
const crypto = require('crypto');
const router = new Router();

function md5 (str) {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}

function base64Sha1 (str, secret) {
  return crypto.createHmac('sha1', secret).update(str, 'utf8').digest().toString('base64')
}

router.post('/getSignature',(ctx, next) => {
  if(ctx.request.body.data){
    const signature = base64Sha1(ctx.request.body.data, md5('****'));
    ctx.body = {code:'succeed',signature:signature};
  }else{
    ctx.body = {code:'failed',message:'参数不正确！'};
  }
});

router.allowedMethods();

module.exports = router;
