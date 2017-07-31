const Koa = require('koa');
const favicon = require('koa-favicon');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const etag = require('koa-etag');
const cors = require('kcors');
const morgan = require('koa-morgan');
const fs = require('fs');
const path  = require('path');

const login = require('./routes/login');
const getSignature = require('./routes/getSignature');
const photo = require('./routes/photo');
const feedback = require('./routes/feedback');
const message = require('./routes/message');


const app = new Koa();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
app.use(morgan('combined', { stream: accessLogStream }))

app.use(etag());
//app.use(cors());
app.use(bodyParser());

app.use(async(ctx,next)=>{
  await next();
  ctx.set('X-Served-By','Koa');
});

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(serve(__dirname + '/public'));

app.use(login.routes());
app.use(getSignature.routes());
app.use(photo.routes());
app.use(feedback.routes());
app.use(message.routes());

app.listen(3000,()=>{
  console.log('%s listening at %s', 'koa2', 'http://127.0.0.1:3000');
});
