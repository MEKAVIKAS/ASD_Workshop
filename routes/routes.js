const express = require('express')
const router = express.Router()

const { cacheMiddleware } = require('../middleware/cache_middleware.js')

const {
    getAll,
    getOne,
    create,
    replace,
    update,
    remove
} = require('../controllers/product_controller.js')

router.param('id', (req, res, next, id) => {
    const productId = Number(id)

    if (!/^\d+$/.test(id) || !Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: 'Product id must be a positive integer' })
    }

    next()
})

router.get('/', cacheMiddleware, getAll)
router.get('/:id', cacheMiddleware, getOne)

router.post('/', create)
router.put('/:id', replace)
router.patch('/:id', update)
router.delete('/:id', remove)

module.exports = router