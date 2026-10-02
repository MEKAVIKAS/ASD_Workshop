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

router.get('/', cacheMiddleware, getAll)
router.get('/:id', cacheMiddleware, getOne)

router.post('/', create)
router.put('/:id', replace)
router.patch('/:id', update)
router.delete('/:id', remove)

module.exports = router