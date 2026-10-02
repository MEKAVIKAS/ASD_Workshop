const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')
const app = require('../index.js')

let server
let baseUrl

before(async () => {
    server = app.listen(0)

    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.once('listening', resolve)
    })

    baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
    if (!server) {
        return
    }

    if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections()
    }

    await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
    })
})

test('GET /products returns a product list', async () => {
    const response = await fetch(`${baseUrl}/products`)
    const products = await response.json()

    assert.equal(response.status, 200)
    assert.ok(Array.isArray(products))
    assert.ok(products.some(product => product.id === 1))
})

test('GET /products/:id returns the matching product', async () => {
    const response = await fetch(`${baseUrl}/products/1`)
    const product = await response.json()

    assert.equal(response.status, 200)
    assert.equal(product.name, 'Keyboard')
})

test('GET /products/:id rejects malformed IDs', async () => {
    const response = await fetch(`${baseUrl}/products/not-an-id`)
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.message, 'Product id must be a positive integer')
})

test('GET /products/:id returns 404 for a missing valid ID', async () => {
    const response = await fetch(`${baseUrl}/products/9999`)
    const body = await response.json()

    assert.equal(response.status, 404)
    assert.equal(body.message, 'Product not found')
})

test('malformed JSON receives a JSON 400 response', async () => {
    const response = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json'
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.message, 'Invalid JSON body')
})

test('POST rejects a product with a missing price', async () => {
    const response = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Missing price' })
    })
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.message, 'name and price are required')
})