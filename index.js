const Koa = require('koa');
// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');

const app = new Koa();

const controller = require('./controller');

const templating = require('./templating');

const isProduction = process.env.NODE_ENV === 'production';

// 记录URL以及页面执行时间:
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    var
        start = new Date().getTime(),
        execTime;
    await next();
    execTime = new Date().getTime() - start;
    ctx.response.set('X-Response-Time', `${execTime}ms`);
});
// 处理静态文件
if (! isProduction) {
    // 这是因为在生产环境下，静态文件是由部署在最前面的反向代理服务器（如Nginx）处理的，Node程序不需要处理静态文件。而在开发环境下，我们希望koa能顺带处理静态文件，否则，就必须手动配置一个反向代理服务器，这样会导致开发环境非常复杂。
    const staticFiles = require('./static-files');
    app.use(staticFiles('/static/', __dirname + '/static'));
}
// 解析POST请求[由于middleware的顺序很重要，这个koa-bodyparser必须在router之前被注册到app对象上]
app.use(bodyParser());
// 处理模板引擎[给ctx加上render()来使用Nunjucks]
app.use(templating('views', {
    noCache: !isProduction,
    watch: !isProduction
}));
// 处理路由:
app.use(controller());

app.listen(3000);
console.log('app started at port 3000...');