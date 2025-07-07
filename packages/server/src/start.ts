import Router from '@koa/router'
import { ConfigUtil } from './config'

export const monitor = (router: Router) => {
  const configUtil = new ConfigUtil()

  router.get('/list', (ctx) => {
    const configs = configUtil.configs
    ctx.body = {
      code: 200,
      data: configs,
    }
  })

  router.post('/add', (ctx) => {
    ctx.body = configUtil.add(ctx.request.body)
  })

  router.post('/start', async (ctx) => {
    const name = ctx.request.body.name
    configUtil.start(name)
    ctx.body = {
      code: 200,
      msg: 'ok',
    }
  })

  router.post('/stop', async (ctx) => {
    const name = ctx.request.body.name
    configUtil.stop(name)
    ctx.body = {
      code: 200,
      msg: 'ok',
    }
  })

  router.post('/delete', (ctx) => {
    console.log("%c Line:38 🍒 ctx", "color:#ffdd4d", ctx);
    ctx.body = configUtil.remove(ctx.request.body.name)
  })

  router.get('/log/:name', (ctx) => {
    const name = ctx.params.name
    const log = configUtil.log.get(name) || []
    ctx.body = {
      code: 200,
      data: log,
    }
  })
}
