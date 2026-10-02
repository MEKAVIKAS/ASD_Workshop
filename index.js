const express = require('express')
const productRoutes = require('./routes/routes.js')

const app = express()

app.use(express.json())
app.use('/products', productRoutes)

app.listen(3000, () => {
    console.log('Server running on port 3000')
})