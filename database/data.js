
const fs = require('fs/promises')
const path = require('path')

const filePath = path.join(__dirname, '../database/db.json')


async function getAllProducts() {
    await new Promise((resolve, reject)=>{ setTimeout(resolve,1500) })

    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data)
}

async function getProductById(id) {
    const products = await getAllProducts()
    return products.find(product => product.id === Number(id))
}

async function writeProducts(products) {
    await fs.writeFile(filePath, JSON.stringify(products),'utf-8')
}

module.exports = {
    getAllProducts,
    getProductById,
    writeProducts
}