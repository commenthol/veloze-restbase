import supertest from 'supertest'
import dotenv from 'dotenv'

// let's read env vars from a .env file
dotenv.config()
const {
  HTTP_PORT = 3000
} = process.env

const url = `http://127.0.0.1:${HTTP_PORT}`

const create = (data) => supertest(url)
  .post('/items')
  .type('json')
  .send(data)
  .then(res => res.body)

const update = (data) => supertest(url)
  .put('/items/' + data.id)
  .type('json')
  .send(data)
  .then(res => res.body)

const get = (id) => supertest(url)
  .get('/items/' + id)
  .type('json')
  .then(res => res.body)

const find = (query) => supertest(url)
  .get('/items')
  .query(query)
  .then(res => res.body)

const main = async () => {
  // create some entries
  let quantity = 0
  for (const item of ['paper', 'stone', 'scissor']) {
    await create({ item, quantity })
    quantity++
  }

  const foundItem = await find({ item: 'paper', countDocs: true, limit: 1 })
  console.log('found>', foundItem)

  {
    const { id, item, version, quantity } = foundItem.data[0]
    const updated = await update({
      id, // needed
      item, // required
      version, // needed for optimistic locking
      quantity: Number(quantity) + 42 // our update
    })
    console.log('updated>', updated)
  }

  const foundById = await get(foundItem.data[0].id)
  console.log('foundById>', foundById)

  const foundAll = await find({ countDocs: true })
  console.log('foundAll>', foundAll)
}

main().catch(console.error)
