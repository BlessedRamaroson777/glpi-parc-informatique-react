// GLPI API v2 client wrapper (PROXY MODE)
import { getAccessToken } from "../services/authService" 

let config = {
    timeoutMs: 30000,
}

export function setConfig(nextConfig = {}) {
    config = { ...config, ...nextConfig }
}

function buildHeaders(method = 'GET', extra = {}) {
    const token = getAccessToken()
    const isBodyMethod = ['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())

    return {
        Accept: 'application/json',
        ...(isBodyMethod ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    }
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

    const url = new URL(endpoint, window.location.origin)

    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) {
                url.searchParams.append(k, String(v))
            }
        })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

    const options = {
        method,
        headers: buildHeaders(method, extra.headers),  // <-- pass method here
        signal: controller.signal,
    }

    if (body) {
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
    get: (e, p) => request('GET', e, null, p),
    post: (e, b) => request('POST', e, b),
    patch: (e, b) => request('PATCH', e, b),
    put: (e, b) => request('PUT', e, b),
    delete: (e) => request('DELETE', e),
}

export default apiV2