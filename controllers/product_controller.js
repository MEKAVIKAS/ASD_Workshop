
const {
    getProducts,
    getProduct,
    createProduct,
    replaceProduct,
    updateProduct,
    deleteProduct
} = require('../services/product_service.js')

const { cache, invalidateCache } = require('../middleware/cache_middleware')

function validateProduct(data, requireAllFields = false) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return 'Request body must be a JSON object'
    }

    const hasName = Object.prototype.hasOwnProperty.call(data, 'name')
    const hasPrice = Object.prototype.hasOwnProperty.call(data, 'price')

    if (requireAllFields && (!hasName || !hasPrice)) {
        return 'name and price are required'
    }

    if (hasName && (typeof data.name !== 'string' || data.name.trim() === '')) {
        return 'name must be a non-empty string'
    }

    if (hasPrice && (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0)) {
        return 'price must be a non-negative number'
    }

    return null
}


async function getAll(req, res) {
    try {
        const products = await getProducts()

        cache[req.originalUrl] = {
            data: products,
            createdAt: Date.now()
        }

        res.json(products)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}


async function getOne(req, res) {
    try {
        const product = await getProduct(req.params.id)

        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        cache[req.originalUrl] = {
            data: product,
            createdAt: Date.now()
        }

        res.json(product)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' })
    }
}


async function create(req, res) {
    const validationError = validateProduct(req.body, true)
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    try {
        const product = await createProduct(req.body)
        invalidateCache()
        res.status(201).json(product)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}


async function replace(req, res) {
    const validationError = validateProduct(req.body, true)
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    try {
        const product = await replaceProduct(
            req.params.id,
            req.body
        )

        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        invalidateCache()
        res.json(product)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}


async function update(req, res) {
    const validationError = validateProduct(req.body)
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    try {
        const product = await updateProduct(
            req.params.id,
            req.body
        )

        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        invalidateCache()
        res.json(product)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}


async function remove(req, res) {
    try {
        const product = await deleteProduct(req.params.id)

        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        invalidateCache()
        res.json({ message: 'Product deleted', product })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    getAll,
    getOne,
    create,
    replace,
    update,
    remove
}