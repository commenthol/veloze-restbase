# @veloze/restbase

> Rest-API to database using JSON-schema

In software development we often repeat ourselves when it comes to persisting
data. Usually you may just store data records according to a model (and its
schema) which do not necessarily relate to another model.

Here this project may help you to define a RESTful Router based on a provided
JSON-schema. Such schema needs to be "flat" such that data can be persisted and
queried from relational databases.

It implements the common RESTful endpoints for persisting and querying documents
based on the documents JSON-schema:

- **C**reate: `POST /{modelName}`
- **R**ead: `GET /{modelName}/:id`
- simple find: `GET /{modelName}?:queryParams`
- complex find: `SEARCH /{modelName}` or `POST /{modelName}/search`
- **U**pdate: `PUT /{modelName}/:id`
- **D**elete: `DELETE /{modelName}/:id`

Provides database adapters for:

- [mongodb](https://www.mongodb.com/docs/drivers/node/current/)
- mysql, mysql, postgres, cockroach via [sequelize](https://sequelize.org/)

Uses optimistic locking by default. Optionally it allows to defer deletion of
documents (documents are marked for deletion, but are not immediately removed;
requires a separate cleanup job).

Works also with express like routers.

Please referrer to the documentation in `docs/index.md`.

# Usage

```js
import dotenv from "dotenv";
import { Server } from "veloze";

import { MongoClient } from "mongodb";
import { modelRouter, MongoAdapter } from "../src/index.js";

// let's read env vars from a .env file
dotenv.config();
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
  optimisticLocking: true, // enables optimistic locking (by version)
  instantDeletion: false,  // disables instant deletion of documents
  jsonSchema,
});
// 3. create the rest-router
const itemsRouter = modelRouter({ adapter });
// 4. create a Server
const server = new Server({ onlyHTTP1: true });
// 5. mount the router to the "plural" path
server.use("/items", itemsRouter.handle);
// 6. start up the server
server.listen(HTTP_PORT);
console.info("server started %j", server.address());

process.on("SIGHUP", () => {
  // 7. don't forget to close the db-connection
  client.close();
});
```

Run the example:

```sh
# clone this project
git clone https://github.com/commenthol/veloze-restbase
# install dependencies
npm i
# start mongodb (needs docker, docker-compose)
npm run dcup -- mongodb
# start the server
node examples/index.js
# make some noise
node examples/traffic.js
```

# License

MIT licensed
