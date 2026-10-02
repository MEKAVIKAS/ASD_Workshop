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

test('unknown routes return a JSON 404 response', async () => {
    const response = await fetch(`${baseUrl}/no-such-route`)
    const body = await response.json()

    assert.equal(response.status, 404)
    assert.equal(body.message, 'Route not found')
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

test('product CRUD endpoints complete a successful lifecycle', async () => {
    let productId

    try {
        const createResponse = await fetch(`${baseUrl}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'CRUD test product', price: 12.5 })
        })
        const createdProduct = await createResponse.json()
        productId = createdProduct.id

        assert.equal(createResponse.status, 201)
        assert.equal(createdProduct.name, 'CRUD test product')
        assert.equal(createdProduct.price, 12.5)
        assert.ok(Number.isInteger(productId))

        const patchResponse = await fetch(`${baseUrl}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: 14.5 })
        })
        const patchedProduct = await patchResponse.json()

        assert.equal(patchResponse.status, 200)
        assert.equal(patchedProduct.name, 'CRUD test product')
        assert.equal(patchedProduct.price, 14.5)

        const replaceResponse = await fetch(`${baseUrl}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Replaced test product', price: 20 })
        })
        const replacedProduct = await replaceResponse.json()

        assert.equal(replaceResponse.status, 200)
        assert.equal(replacedProduct.id, productId)
        assert.equal(replacedProduct.name, 'Replaced test product')
        assert.equal(replacedProduct.price, 20)

        const deleteResponse = await fetch(`${baseUrl}/products/${productId}`, {
            method: 'DELETE'
        })
        const deletion = await deleteResponse.json()

        assert.equal(deleteResponse.status, 200)
        assert.equal(deletion.message, 'Product deleted')
        assert.equal(deletion.product.id, productId)
        productId = undefined
    } finally {
        if (productId !== undefined) {
            const cleanupResponse = await fetch(`${baseUrl}/products/${productId}`, {
                method: 'DELETE'
            })

            assert.ok([200, 404].includes(cleanupResponse.status))
        }
    }
})