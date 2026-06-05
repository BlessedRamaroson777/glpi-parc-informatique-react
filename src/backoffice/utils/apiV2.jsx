// GLPI API v2 client wrapper
// Configure once via setConfig before using.

let config = {
    baseUrl: '',
    accessToken: '',
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

    if (config.accessToken) headers.Authorization = `Bearer ${config.accessToken}`

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

async function request(method, endpoint, body, params, extra = {}) {
    if (!config.baseUrl) {
        throw new Error('API v2 baseUrl is not configured')
    }
    const url = new URL(`${config.baseUrl.replace(/\/$/, '')}/${endpoint}`)

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
            throw new Error(`API v2 error ${response.status}: ${text}`)
        }
        return response.status === 204 ? null : parseResponseText(text)
    } finally {
        clearTimeout(timeoutId)
    }
}

const apiV2 = {
    setConfig,
    get: (endpoint, params) => request('GET', endpoint, null, params),
    post: (endpoint, body, options) => request('POST', endpoint, body, null, options),
    patch: (endpoint, body, options) => request('PATCH', endpoint, body, null, options),
    put: (endpoint, body, options) => request('PUT', endpoint, body, null, options),
    delete: (endpoint) => request('DELETE', endpoint),
}

export default apiV2
