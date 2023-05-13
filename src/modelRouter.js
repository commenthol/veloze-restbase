import { Router, sendEtag, queryParser, bodyParser, cacheControl } from 'veloze'
import { ModelAdapter } from './ModelAdapter.js'
import { camelToDash } from './utils/index.js'

/**
 * @typedef {import('./types').Handler} Handler
 *
 * @typedef {object} Hooks
 * @property {Handler|Handler[]} [all]
 * @property {Handler|Handler[]} [create]
 * @property {Handler|Handler[]} [update]
 * @property {Handler|Handler[]} [findById]
 * @property {Handler|Handler[]} [find]
 * @property {Handler|Handler[]} [search]
 * @property {Handler|Handler[]} [deleteById]
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
export function modelRouter (options) {
  const {
    adapter,
    bodyParserOpts,
    preHooks = {},
    postHooks = {}
  } = options

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
    bodyParser(bodyParserOpts),
    sendEtag(),
    (req, res, next) => {
      res.setHeader('content-type', 'application/json')
      next()
    },
    preHooks.all
  )

  router.postHook(
    postHooks.all,
    (req, res) => {
      res.send(res.body)
    }
  )

  router.post('/',
    preHooks.create,
    wrapAsync(async (req, res) => {
      const payload = req.body
      res.body = await modelAdapter.create(payload)
      res.statusCode = 201
    }),
    postHooks.create
  )

  router.put('/:id',
    preHooks.update,
    wrapAsync(async (req, res) => {
      const payload = { ...req.body, id: req.params?.id }
      res.body = await modelAdapter.update(payload)
    }),
    postHooks.update
  )

  // router.patch('/:id',
  //   preHooks.patch,
  //   wrapAsync(async (req, res) => {
  //     const payload = { ...req.body, id: req.params?.id }
  //     res.body = await modelAdapter.patch(payload)
  //   }),
  //   postHooks.patch
  // )

  router.get('/:id',
    preHooks.findById,
    queryParser,
    wrapAsync(async (req, res) => {
      const id = req.params?.id
      res.body = await modelAdapter.findById(id)
    }),
    cacheControl(),
    postHooks.findById
  )

  router.get('/',
    queryParser,
    preHooks.find,
    wrapAsync(async (req, res) => {
      res.body = await modelAdapter.findMany(req.query)
    }),
    cacheControl(),
    postHooks.find
  )

  const _search = [
    preHooks.search,
    wrapAsync(async (req, res) => {
      res.body = await modelAdapter.searchMany(req.body)
    }),
    cacheControl(),
    postHooks.search
  ]

  router.post('/search', ..._search)
  router.search('/', ..._search)

  router.delete('/:id',
    preHooks.deleteById,
    wrapAsync(async (req, res) => {
      const id = req.params?.id
      await modelAdapter.deleteById(id)
      res.statusCode = 204
    }),
    postHooks.deleteById
  )

  // console.dir(router.print(), { depth: null })
  return router
}

const wrapAsync = (promFn) => (req, res, next) =>
  promFn(req, res)
    .then(() => {
      // @ts-ignore
      if (!req.writableEnded) next()
    })
    .catch((/** @type {any} */ err) => next(err))
