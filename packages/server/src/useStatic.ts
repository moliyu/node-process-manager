import Koa from 'koa'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import serve from 'koa-static'

const filename = fileURLToPath(import.meta.url)
const __dirname = dirname(filename)

export const useStatic = (app: Koa) => {
  if (process.env.NODE_ENV == 'production') {
    app.use(serve(resolve(__dirname, '../static')))
  }
}
