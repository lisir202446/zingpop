import type { KVNamespaceListOptions, KVNamespaceListResult, KVNamespacePutOptions } from "@cloudflare/workers-types"
import { Resource as ResourceBase } from "sst"
import Cloudflare from "cloudflare"

export const waitUntil = async (promise: Promise<any>) => {
  await promise
}

const kvStore = new Map<string, { value: string; expiration?: number }>()

function env(name: string) {
  const value = process.env[name]
  return value === undefined || value === "" ? undefined : value
}

function cleanupKv() {
  const now = Date.now()
  Array.from(kvStore.entries()).forEach(([key, entry]) => {
    if (!entry.expiration || entry.expiration > now) return
    kvStore.delete(key)
  })
}

function memoryKvNamespace() {
  return {
    get: async (key: string | string[]) => {
      cleanupKv()
      if (Array.isArray(key)) {
        return new Map(key.flatMap((item) => (kvStore.get(item)?.value ? [[item, kvStore.get(item)!.value]] : [])))
      }
      return kvStore.get(key)?.value
    },
    put: async (key: string, value: string, opts?: KVNamespacePutOptions) => {
      const expiration =
        opts?.expiration !== undefined
          ? opts.expiration * 1000
          : opts?.expirationTtl !== undefined
            ? Date.now() + opts.expirationTtl * 1000
            : undefined
      kvStore.set(key, { value, expiration })
    },
    delete: async (key: string) => {
      kvStore.delete(key)
    },
    list: async (opts?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown, string>> => {
      cleanupKv()
      const keys = Array.from(kvStore.keys())
        .filter((key) => !opts?.prefix || key.startsWith(opts.prefix))
        .map((name) => ({
          name,
          expiration: kvStore.get(name)?.expiration ? Math.floor(kvStore.get(name)!.expiration! / 1000) : undefined,
          metadata: null,
        }))
      return {
        keys,
        list_complete: true,
        cacheStatus: null,
      }
    },
  }
}

function defaultLimits() {
  return JSON.stringify({
    free: {
      promoTokens: 10_000_000,
      dailyRequests: 100,
    },
    lite: {
      rollingLimit: 100,
      rollingWindow: 24,
      weeklyLimit: 500,
      monthlyLimit: 2_000,
    },
    black: {
      "20": {
        fixedLimit: 2_000,
        rollingLimit: 300,
        rollingWindow: 24,
      },
      "100": {
        fixedLimit: 10_000,
        rollingLimit: 1_000,
        rollingWindow: 24,
      },
      "200": {
        fixedLimit: 20_000,
        rollingLimit: 2_000,
        rollingWindow: 24,
      },
    },
  })
}

function defaultModels() {
  return JSON.stringify({
    zenModels: {
      "deepseek-chat": {
        name: "DeepSeek Chat",
        cost: {
          input: 0,
          output: 0,
        },
        providers: [
          {
            id: "deepseek",
            model: "deepseek-chat",
          },
        ],
      },
      "deepseek-reasoner": {
        name: "DeepSeek Reasoner",
        cost: {
          input: 0,
          output: 0,
        },
        providers: [
          {
            id: "deepseek",
            model: "deepseek-reasoner",
          },
        ],
      },
    },
    liteModels: {
      "deepseek-chat": {
        name: "DeepSeek Chat",
        cost: {
          input: 0,
          output: 0,
        },
        providers: [
          {
            id: "deepseek",
            model: "deepseek-chat",
          },
        ],
      },
    },
    providers: {
      deepseek: {
        displayName: "DeepSeek",
        api: env("DOMESTIC_MODEL_API") ?? env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/v1",
        apiKey: env("DOMESTIC_MODEL_API_KEY") ?? env("DEEPSEEK_API_KEY") ?? "",
        format: "openai",
      },
    },
  })
}

function fallbackResource(prop: string) {
  if (env(prop)) return { type: "sst.sst.Secret", value: env(prop)! }
  if (prop === "App") return { type: "sst.sst.Linkable", stage: env("APP_STAGE") ?? process.env.NODE_ENV ?? "development" }
  if (prop === "GatewayKv") return memoryKvNamespace()
  if (prop === "ZenData" || prop === "ZenDataNew") {
    return {
      type: "sst.cloudflare.Bucket",
      put: async () => {},
    }
  }
  if (prop === "ZEN_SESSION_SECRET") {
    return {
      type: "sst.sst.Secret",
      value: env("ZEN_SESSION_SECRET") ?? env("SESSION_SECRET") ?? "local-dev-session-secret",
    }
  }
  if (prop === "ZEN_LIMITS") {
    return {
      type: "sst.sst.Secret",
      value: env("ZEN_LIMITS") ?? env("ZEN_LIMITS_JSON") ?? defaultLimits(),
    }
  }
  if (/^ZEN_MODELS\d+$/.test(prop)) {
    return {
      type: "sst.sst.Secret",
      value: prop === "ZEN_MODELS1" ? env("ZEN_MODELS_JSON") ?? defaultModels() : "",
    }
  }
  if (prop === "ZEN_LITE_PRICE") {
    return {
      type: "sst.sst.Linkable",
      product: "lite-domestic",
      price: "lite-domestic-monthly",
      priceInr: 0,
      firstMonth100Coupon: "",
      firstMonth50Coupon: "",
    }
  }
  if (prop === "ZEN_BLACK_PRICE") {
    return {
      type: "sst.sst.Linkable",
      product: "black-domestic",
      plan20: "black-domestic-20",
      plan100: "black-domestic-100",
      plan200: "black-domestic-200",
    }
  }
}

export const Resource = new Proxy(
  {},
  {
    get(_target, prop: keyof typeof ResourceBase) {
      const value =
        (() => {
          try {
            return ResourceBase[prop]
          } catch {
            return fallbackResource(prop)
          }
        })() ?? fallbackResource(prop)

      if (!value) return value
      if ("type" in value) {
        // @ts-ignore
        if (value.type === "sst.cloudflare.Bucket") {
          return {
            put: async () => {},
          }
        }
        // @ts-ignore
        if (value.type === "sst.cloudflare.Kv") {
          const apiToken = env("CLOUDFLARE_API_TOKEN")
          const accountId = env("CLOUDFLARE_DEFAULT_ACCOUNT_ID")
          if (!apiToken || !accountId) return memoryKvNamespace()
          const client = new Cloudflare({
            apiToken,
          })
          // @ts-ignore
          const namespaceId = value.namespaceId
          return {
            get: (k: string | string[]) => {
              const isMulti = Array.isArray(k)
              return client.kv.namespaces
                .bulkGet(namespaceId, {
                  keys: Array.isArray(k) ? k : [k],
                  account_id: accountId,
                })
                .then((result) => (isMulti ? new Map(Object.entries(result?.values ?? {})) : result?.values?.[k]))
            },
            put: (k: string, v: string, opts?: KVNamespacePutOptions) =>
              client.kv.namespaces.values.update(namespaceId, k, {
                account_id: accountId,
                value: v,
                expiration: opts?.expiration,
                expiration_ttl: opts?.expirationTtl,
                metadata: opts?.metadata,
              }),
            delete: (k: string) =>
              client.kv.namespaces.values.delete(namespaceId, k, {
                account_id: accountId,
              }),
            list: (opts?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown, string>> =>
              client.kv.namespaces.keys
                .list(namespaceId, {
                  account_id: accountId,
                  prefix: opts?.prefix ?? undefined,
                })
                .then((result) => {
                  return {
                    keys: result.result,
                    list_complete: true,
                    cacheStatus: null,
                  }
                }),
          }
        }
      }
      return value
    },
  },
) as Record<string, any>
