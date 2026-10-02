const express = require('express')
const productRoutes = require('./routes/routes.js')

const app = express()

app.use(express.json())
app.use('/products', productRoutes)

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON body' })
    }

    next(err)
})

if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server running on port 3000')
    })
}

module.exports = app