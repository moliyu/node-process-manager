import Koa from "koa";
import Router from "@koa/router";
import { bodyParser } from "@koa/bodyparser";
import Cors from "@koa/cors";
import { monitor } from "./start";

const app = new Koa();
app.use(Cors());
app.use(bodyParser());
const router = new Router();

// app.use(async (ctx) => {
//   ctx.body = "Hello Koa123444";
// });

monitor(router);
const port = 4000;

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
