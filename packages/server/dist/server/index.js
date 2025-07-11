import Koa from "koa";
import Router from "@koa/router";
import { bodyParser } from "@koa/bodyparser";
import Cors from "@koa/cors";
import st from "node-localstorage";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import serve from "koa-static";

//#region src/utils.ts
const parseJson = (s, fb) => {
	if (!s) return fb;
	try {
		const res = JSON.parse(s);
		return res;
	} catch (err) {
		return fb;
	}
};

//#endregion
//#region src/config.ts
const ls = new st.LocalStorage("./local");
var ConfigUtil = class {
	configs = [];
	cache = /* @__PURE__ */ new Map();
	log = /* @__PURE__ */ new Map();
	constructor() {
		if (!ls.getItem("config")) ls.setItem("config", JSON.stringify([]));
		const configs = parseJson(ls.getItem("config"), []);
		this.configs = configs;
		process.on("exit", () => this.destroy());
		process.on("SIGINT", () => {
			this.destroy();
			process.exit();
		});
		process.on("SIGTERM", () => {
			this.destroy();
			process.exit();
		});
	}
	destroy() {
		this.configs.forEach((config) => {
			config.active = false;
		});
		this.syncConfig();
	}
	syncConfig() {
		ls.setItem("config", JSON.stringify(this.configs));
	}
	add(config) {
		if (this.configMap[config.name]) return {
			code: 500,
			msg: `服务${config.name}已存在`
		};
		this.configs.push(config);
		this.syncConfig();
		return {
			code: 200,
			msg: "ok"
		};
	}
	get configMap() {
		return this.configs.reduce((res, item) => {
			res[item.name] = item;
			return res;
		}, {});
	}
	getConfig(name) {
		return this.configMap[name];
	}
	start(name) {
		return new Promise((resolve$1) => {
			const config = this.getConfig(name);
			if (!config) return resolve$1({
				code: 500,
				msg: `服务${name}不存在`
			});
			if (config.active) return resolve$1({
				code: 500,
				msg: `服务${name}已启动`
			});
			const { command, args, path } = config;
			let isResolve = false;
			const ls$1 = spawn(command, [args], { cwd: path });
			this.cache.set(name, ls$1);
			ls$1.stdout.on("data", (data) => {
				if (!isResolve) {
					isResolve = true;
					config.active = true;
					this.syncConfig();
					resolve$1({ code: 200 });
				}
				if (!this.log.has(name)) this.log.set(name, []);
				const log = this.log.get(name);
				log.push(data.toString());
			});
			ls$1.stderr.on("data", (data) => {
				if (!isResolve) {
					isResolve = true;
					config.active = false;
					this.syncConfig();
					resolve$1({
						code: 500,
						msg: data.toString()
					});
				}
			});
			ls$1.on("close", (code) => {
				config.active = false;
				this.cache.delete(name);
				this.syncConfig();
			});
			ls$1.on("error", (err) => {
				resolve$1({
					code: 500,
					msg: "命令执行错误"
				});
			});
		});
	}
	stop(name) {
		const config = this.getConfig(name);
		if (!config) return {
			code: 500,
			msg: `服务${name}不存在`
		};
		if (!config.active) return {
			code: 500,
			msg: `服务${name}未启动`
		};
		const ls$1 = this.cache.get(name);
		if (ls$1) {
			const res = ls$1.kill();
			if (res) {
				config.active = false;
				this.cache.delete(name);
				this.log.delete(name);
				this.syncConfig();
				return {
					code: 200,
					msg: "ok"
				};
			} else return {
				code: 500,
				msg: `服务${name}停止失败`
			};
		} else {
			if (config.active) {
				config.active = false;
				this.syncConfig();
				return {
					code: 200,
					msg: `服务${name}进程已意外终止，已更新状态`
				};
			}
			return {
				code: 500,
				msg: `服务${name}进程不存在`
			};
		}
	}
	restart(name) {
		this.stop(name);
		this.start(name);
	}
	remove(name) {
		const idx = this.configs.findIndex((item) => item.name == name);
		if (idx === -1) return {
			code: 500,
			msg: `服务${name}不存在`
		};
		this.configs.splice(idx, 1);
		this.cache.delete(name);
		this.log.delete(name);
		this.syncConfig();
		return {
			code: 200,
			msg: "ok"
		};
	}
	modify(name, config) {
		const _config = this.configMap[name];
		Object.assign(_config, config);
		return {
			code: 200,
			msg: "ok"
		};
	}
};

//#endregion
//#region src/start.ts
const monitor = (router$1) => {
	const configUtil = new ConfigUtil();
	router$1.get("/list", (ctx) => {
		const configs = configUtil.configs;
		ctx.body = {
			code: 200,
			data: configs
		};
	});
	router$1.post("/add", (ctx) => {
		ctx.body = configUtil.add(ctx.request.body);
	});
	router$1.post("/start", async (ctx) => {
		const name = ctx.request.body.name;
		ctx.body = await configUtil.start(name);
	});
	router$1.post("/stop", async (ctx) => {
		const name = ctx.request.body.name;
		ctx.body = configUtil.stop(name);
	});
	router$1.post("/delete", (ctx) => {
		ctx.body = configUtil.remove(ctx.request.body.name);
	});
	router$1.get("/log/:name", (ctx) => {
		const name = ctx.params.name;
		const log = configUtil.log.get(name) || [];
		ctx.body = {
			code: 200,
			data: log
		};
	});
	router$1.post("/modify/:name", (ctx) => {
		const name = ctx.params.name;
		const config = ctx.request.body;
		ctx.body = configUtil.modify(name, config);
	});
};

//#endregion
//#region src/useStatic.ts
const filename = fileURLToPath(import.meta.url);
const __dirname = dirname(filename);
const useStatic = (app$1) => {
	if (process.env.NODE_ENV == "production") app$1.use(serve(resolve(__dirname, "../static")));
};

//#endregion
//#region src/index.ts
const app = new Koa();
app.use(Cors());
app.use(bodyParser());
const router = new Router();
useStatic(app);
monitor(router);
const port = 4e3;
app.use(router.routes()).use(router.allowedMethods());
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

//#endregion