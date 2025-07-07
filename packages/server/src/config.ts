import { Config } from './type'
import st from 'node-localstorage'
import { parseJson } from './utils'
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process'

const ls = new st.LocalStorage('./local')

export class ConfigUtil {
  configs: Config[] = []
  cache: Map<string, ChildProcessWithoutNullStreams> = new Map()
  log: Map<string, string[]> = new Map()
  constructor() {
    if (!ls.getItem('config')) {
      ls.setItem('config', JSON.stringify([]))
    }
    const configs = parseJson<Config[]>(ls.getItem('config'), [])
    this.configs = configs
  }

  syncConfig() {
    ls.setItem('config', JSON.stringify(this.configs))
  }

  add(config: Config) {
    if (this.configMap[config.name]) {
      return {
        code: 500,
        msg: `服务${config.name}已存在`,
      }
    }
    this.configs.push(config)
    this.syncConfig()
    return {
      code: 200,
      msg: 'ok',
    }
  }

  get configMap() {
    return this.configs.reduce(
      (res, item) => {
        res[item.name] = item
        return res
      },
      {} as Record<string, Config>,
    )
  }

  getConfig(name: string) {
    return this.configMap[name]
  }

  start(name: string) {
    const config = this.getConfig(name)
    config.active = true
    this.syncConfig()
    const { command, args, path } = config

    const ls = spawn(command, [args], {
      cwd: path,
    })

    this.cache.set(name, ls)

    ls.stdout.on('data', (data) => {
      if (!this.log.has(name)) {
        this.log.set(name, [])
      }
      const log = this.log.get(name)
      log.push(data.toString())
    })

    ls.stderr.on('data', (data) => {
      console.log("%c Line:74 🍧 data", "color:#3f7cff", data);
    })

    ls.on('close', (code) => {
      config.active = false
      this.cache.delete(name) // Add this line
      this.syncConfig()
      console.log(`child process exited with code ${code}`)
    })
  }

  stop(name: string) {
    console.log("%c Line:86 🍢 name", "color:#4fff4B", name);
    const ls = this.cache.get(name)
    if (ls) {
      const res = ls.kill()
      console.log("%c Line:89 🥝 res", "color:#93c0a4", res);
      if (res) {
        const config = this.getConfig(name)
        config.active = false
        this.cache.delete(name)
        this.log.delete(name)
        this.syncConfig()
      }
    }
  }

  restart(name: string) {
    this.stop(name)
    this.start(name)
  }

  remove(name: string) {
    const idx = this.configs.findIndex((item) => item.name == name)
    if (idx === -1) {
      return {
        code: 500,
        msg: `服务${name}不存在`,
      }
    }
    this.configs.splice(idx, 1)
    this.cache.delete(name)
    this.log.delete(name)
    this.syncConfig()
    return {
      code: 200,
      msg: 'ok',
    }
  }
}
