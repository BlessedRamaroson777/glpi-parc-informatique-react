// GLPI API v1 client wrapper
// Configure once via setConfig before using.

let config = {
    baseUrl: '',
    sessionToken: '',
    appToken: '',
    timeoutMs: 30000,
}

export function setConfig(nextConfig = {}) {
    config = { ...config, ...nextConfig }
}

function buildHeaders(extra = {}) {
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...extra,
    }

    if (config.sessionToken) headers['Session-Token'] = config.sessionToken
    if (config.appToken) headers['App-Token'] = config.appToken

    return headers
}

function parseResponseText(text) {
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

function normalizeRange(range) {
    if (!range) return null
    if (typeof range === 'string') return range
    if (Array.isArray(range) && range.length === 2) {
        return `${range[0]}-${range[1]}`
    }
    return null
}
async function request(method, endpoint, body, params, extra = {}) {
    const base = config.baseUrl
        ? config.baseUrl.replace(/\/$/, '')
        : window.location.origin

    // si base est un chemin relatif (ex: "/apirest.php"), construire avec origin
    const fullBase = base.startsWith('http')
        ? base
        : `${window.location.origin}${base}`

    const url = new URL(`${fullBase}/${endpoint}`)

    if (params && typeof params === 'object') {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value))
            }
        })
    }

    const headers = buildHeaders(extra.headers)
    if (body instanceof FormData) {
        delete headers['Content-Type']
    }

    const controller = new AbortController()
    const timeoutMs = Number.isFinite(extra.timeoutMs) ? extra.timeoutMs : config.timeoutMs
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const options = {
        method,
        headers,
        signal: controller.signal,
    }

    if (body !== undefined && body !== null) {
        options.body = body instanceof FormData ? body : JSON.stringify(body)
    }

    try {
        const response = await fetch(url.toString(), options)
        const text = await response.text()
        if (!response.ok) {
            throw new Error(`API v1 error ${response.status}: ${text}`)
        }
        return response.status === 204 ? null : parseResponseText(text)
    } finally {
        clearTimeout(timeoutId)
    }
}

const apiV1 = {
    setConfig,
    get: (endpoint, params) => request('GET', endpoint, null, params),
    post: (endpoint, body, options) => request('POST', endpoint, body, null, options),
    patch: (endpoint, body, options) => request('PATCH', endpoint, body, null, options),
    put: (endpoint, body, options) => request('PUT', endpoint, body, null, options),
    delete: (endpoint) => request('DELETE', endpoint),
    initSession: async (userToken) => {
        // 1. On fait la requête à GLPI
        const response = await request('POST', 'initSession', null, { user_token: userToken });
        
        // 2. Si GLPI renvoie le token, on met à jour la config du wrapper automatiquement
        if (response && response.session_token) {
            setConfig({ sessionToken: response.session_token });
        }
        return response;
    },
    killSession: () => request('GET', 'killSession'),
    search: (itemtype, params = {}) => request('GET', `search/${itemtype}`, null, params),
    getItem: (itemtype, id) => request('GET', `${itemtype}/${id}`),
    createItem: (itemtype, data) => request('POST', itemtype, data),
    updateItem: (itemtype, id, data) => request('PUT', `${itemtype}/${id}`, data),
    deleteItem: (itemtype, id) => request('DELETE', `${itemtype}/${id}`),
    getList: (itemtype, range, params = {}) => {
        const normalized = normalizeRange(range)
        const headers = normalized ? { Range: `items=${normalized}` } : undefined
        return request('GET', itemtype, null, params, { headers })
    },
    getConfig: () => ({ ...config }),  // ← ajouter
}

export default apiV1
