import Koa from 'koa'
import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'
import Cors from '@koa/cors'
import { monitor } from './start'
import { useStatic } from './useStatic'

const app = new Koa()
app.use(Cors())
app.use(bodyParser())
const router = new Router()

useStatic(app)
monitor(router)
const port = 4000

app.use(router.routes()).use(router.allowedMethods())

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
