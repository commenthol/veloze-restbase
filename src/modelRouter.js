import {
  Router,
  sendEtag,
  queryParser,
  bodyParser,
  cacheControl,
  requestId
} from 'veloze'
import { ModelAdapter } from './ModelAdapter.js'
import { camelToDash } from './utils/index.js'

/**
 * @typedef {import('./types.js').Handler} Handler
 *
 * @typedef {object} Hooks
 * @property {Handler|Handler[]} [all]
 * @property {Handler|Handler[]} [create]
 * @property {Handler|Handler[]} [update]
 * @property {Handler|Handler[]} [findById]
 * @property {Handler|Handler[]} [find]
 * @property {Handler|Handler[]} [search]
 * @property {Handler|Handler[]} [deleteById]
 * @property {Handler|Handler[]} [delete]
 */

/**
 * @typedef {object} SetupRestOptions
 * @property {import('../src/adapters/Adapter.js').Adapter} adapter
 * @property {import('veloze/types').BodyParserOptions} bodyParserOpts
 * @property {Hooks} preHooks
 * @property {Hooks} postHooks
 */

/**
 * @param {SetupRestOptions} options
 * @returns {Router}
 */
export function modelRouter(options) {
  const { adapter, bodyParserOpts, preHooks = {}, postHooks = {} } = options

  const modelAdapter = new ModelAdapter(adapter)
  const modelNameDashed = camelToDash(modelAdapter.modelName)

  if (!modelNameDashed) {
    throw new Error('need modelName')
  }
  if (/[/:]/.test(modelNameDashed)) {
    throw new Error('modelName must not contain / or :')
  }

  const router = new Router()
  router.mountPath = `/${modelNameDashed}`

  router.use(
    requestId({ setResponseHeader: true }),
    sendEtag(),
    (req, res, next) => {
      res.setHeader('content-type', 'application/json')
      next()
    },
    preHooks.all
  )

  router.postHook(postHooks.all, (req, res) => {
    res.send(res.body)
  })

  // --- single operations ---

  router.post(
    '/',
    preHooks.create,
    bodyParser(bodyParserOpts),
    async (req, res) => {
      res.body = await modelAdapter.create(req.body)
      res.statusCode = 201
    },
    postHooks.create
  )

  router.put(
    '/:id',
    preHooks.update,
    bodyParser(bodyParserOpts),
    async (req, res) => {
      const payload = { ...req.body, id: req.params?.id }
      res.body = await modelAdapter.update(payload)
    },
    postHooks.update
  )

  // router.patch('/:id',
  //   preHooks.patch,
  //   async (req, res) => {
  //     const payload = { ...req.body, id: req.params?.id }
  //     res.body = await modelAdapter.patch(payload)
  //   },
  //   postHooks.patch
  // )

  router.get(
    '/:id',
    preHooks.findById,
    queryParser,
    async (req, res) => {
      const id = req.params?.id
      res.body = await modelAdapter.findById(id)
    },
    cacheControl(),
    postHooks.findById
  )

  router.get(
    '/',
    queryParser,
    preHooks.find,
    async (req, res) => {
      res.body = await modelAdapter.findMany(req.query)
    },
    cacheControl(),
    postHooks.find
  )

  router.delete(
    '/:id',
    preHooks.deleteById,
    async (req, res) => {
      const id = req.params?.id
      await modelAdapter.deleteById(id)
      res.statusCode = 204
    },
    postHooks.deleteById
  )

  // --- bulk operations ---

  const _search = [
    preHooks.search || preHooks.find,
    bodyParser(bodyParserOpts),
    async (req, res) => {
      res.body = await modelAdapter.searchMany(req.body)
    },
    cacheControl(),
    postHooks.search || postHooks.find
  ]

  router.post('/search', ..._search)
  router.search('/', ..._search)

  router.post(
    '/create',
    preHooks.create,
    (req, res) => modelAdapter.createMany(req, res)
    // there is no postHook available as we are in streaming mode
  )

  router.put(
    '/',
    preHooks.update,
    (req, res) => modelAdapter.updateMany(req, res)
    // there is no postHook available as we are in streaming mode
  )

  router.post(
    '/delete',
    preHooks.delete,
    bodyParser(bodyParserOpts),
    async (req, res) => {
      res.body = await modelAdapter.deleteMany(req.body)
    },
    cacheControl(),
    postHooks.delete
  )

  // console.dir(router.print(), { depth: null })
  return router
}
