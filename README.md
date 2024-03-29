[![npm-badge][npm-badge]][npm]
![types-badge][types-badge]

# @veloze/restbase

> Rest-API to database using JSON-schema

In software development we often repeat ourselves when it comes to persisting
data. Usually you may just want to store data records according to a model (and
its schema), which does not necessarily relate to another model.

This project may help you to define a RESTful Router based on a provided
JSON-schema. Such schema needs to be "flat" such that data can be persisted and
queried from relational databases also.

It implements the common RESTful endpoints for persisting and querying documents
based on the documents JSON-schema:

- **C**reate: `POST /{modelName}`
- **R**ead: `GET /{modelName}/:id`
- simple find: `GET /{modelName}?:queryParams`
- complex find: `SEARCH /{modelName}` or `POST /{modelName}/search`
- **U**pdate: `PUT /{modelName}/:id`
- **D**elete: `DELETE /{modelName}/:id`

as well as bulk operations on many documents:

- **C**reate many: `POST /{modelName}/create`
- **U**pdate many: `PUT /{modelName}`
- **D**elete many: `POST /{modelName}/delete`

Provides database adapters for:

- [mongodb](https://www.mongodb.com/docs/drivers/node/current/)
- mysql, mysql, postgres, cockroach via [sequelize](https://sequelize.org/)

Uses optimistic locking by default. Optionally it allows to defer deletion of
documents (documents are marked for deletion, but are not immediately removed;
requires a separate cleanup job).

Works also with express like routers.

Please refer to the documentation in [docs/index.md](./docs/index.md).

# Usage

```sh
pnpm i @veloze/restbase
```

```js
import { Server } from "veloze";
import { MongoClient } from "mongodb";
import { modelRouter, MongoAdapter } from "@veloze/restbase";

const {
  HTTP_PORT = 3000,
  MONGODB_URL = "mongodb://root:example@127.0.0.1:27017",
} = process.env;

// 1. define a JSON-schema
const jsonSchema = {
  type: "object",
  required: ["item"],
  properties: {
    item: { type: "string", maxLength: 255 },
    quantity: { type: "integer", minimum: 0, default: 0 },
  },
};
// 2. create an adapter
const client = new MongoClient(MONGODB_URL); // db driver (reuse for multiple data object)
const adapter = new MongoAdapter({
  client,
  database: "inventory",
  modelName: "items", // use plural form!!
  optimisticLocking: true, // enables optimistic locking (by version `v`)
  instantDeletion: false,  // disables instant deletion of documents
  jsonSchema,
});
// 3. create the rest-router by passing the adapter
const itemsRouter = modelRouter({ adapter });
// 4. create a Server
const server = new Server({ onlyHTTP1: true });
// 5. mount the router to the "plural" path
server.use("/items", itemsRouter.handle);
// 6. start up the server
server.listen(HTTP_PORT);
```

Run the example:

```sh
# clone this project
git clone https://github.com/commenthol/veloze-restbase
# install dependencies
npm i
```

with mongodb
```sh
# start mongodb (needs docker, docker-compose)
npm run dc:up -- mongodb
# start the server
node examples/index.js
# make some noise
node examples/traffic.js
```

with postgres
```sh
# start postgres (needs docker, docker-compose)
npm run dc:up -- postgres
# start the server
node examples/express.js
# make some noise
node examples/traffic.js
```

# License

MIT licensed

[npm-badge]: https://badgen.net/npm/v/@veloze/restbase
[npm]: https://www.npmjs.com/package/@veloze/restbase
[types-badge]: https://badgen.net/npm/types/@veloze/restbase
