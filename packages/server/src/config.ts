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
      log.push(data)
    })

    ls.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })

    ls.on('close', (code) => {
      config.active = false
      this.syncConfig()
      console.log(`child process exited with code ${code}`)
    })
  }

  stop(name: string) {
    const ls = this.cache.get(name)
    if (ls) {
      const res = ls.kill()
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
