
const cache = {}

const TTL = 60 * 1000

function invalidateCache() {
    for (const key in cache) {
        delete cache[key]
    }
}

function cacheMiddleware(req, res, next) {
    const key = req.originalUrl

    for (const cacheKey in cache) {
        const entry = cache[cacheKey]

        if (entry && Date.now() - entry.createdAt >= TTL) {
            delete cache[cacheKey]
        }
    }

    const entry = cache[key]

    if (entry) {
        const age = Date.now() - entry.createdAt

        if (age < TTL) {
            res.set('X-Cache', 'HIT')
            return res.json(entry.data)
        }
    }

    res.set('X-Cache', 'MISS')
    next()
}

module.exports = {
    cache,
    cacheMiddleware,
    invalidateCache
}