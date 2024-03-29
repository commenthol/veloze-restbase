# veloze-restbase REST API

All collections / tables require a JSON schema before storing documents.

Only flat objects can be stored and queried (for compatibility with relational
databases).

To uniquely identify a document an `id` is created when the record is created.
With this, the `createdAt` and `updatedAt` timestamps are set to "now".  
For optimistic locking (regardless if set in database-adapter) `version` is set
to 1 and incremented on every update.

It is recommended to use plural names for `modelName`. E.g. use "users" instead
of "user". Such the path to your model here would be "POST /users" to create a
new document in the database.

> **ℹ︎ INFO**: For all examples the JSON-schema is assumed:
> 
> ```json
> {
>   "type": "object",
>   "properties": {
>     "item": { "type": "string" },
>     "count": { "type": "integer", "default": 0 } 
>   },
>   "required": ["item"]
> }
> ```

**Table of Contents**

<!-- !toc -->

* [Atomic operations](#atomic-operations)
  * [POST /{modelName}&nbsp;](#post-modelname)
  * [PUT /{modelName}/:id](#put-modelnameid)
  * [DELETE /{modelName}/:id](#delete-modelnameid)
  * [GET /{modelName}/:id](#get-modelnameid)
  * [GET /{modelName}&nbsp;](#get-modelname)
    * [Query Operators numeric](#query-operators-numeric)
    * [Query Operators string](#query-operators-string)
    * [Query Parameters](#query-parameters)
  * [POST /{modelName}/search](#post-modelnamesearch)
  * [SEARCH /{modelName}&nbsp;](#search-modelname)
* [Bulk operations](#bulk-operations)
  * [POST /{modelName}/create](#post-modelnamecreate)
  * [PUT /{modelName}&nbsp;](#put-modelname)
  * [POST /{modelName}/delete](#post-modelnamedelete)

<!-- toc! -->

# Atomic operations

## POST /{modelName}&nbsp;

Create new document in database.

Provide the data according to the JSON schema

`id` is autogenerated together with `createdAt` and `updatedAt` timestamp.

*Example*:

```json
POST /items
content-type: application/json
{
  "item": "paper",
  "count": 15
}
```

**Returns:**

- 201 Created

  Returns the created document

  ```json
  {
    "id": string,
    "v": integer,
    "updatedAt": string($date-time),
    "createdAt": string($date-time),
    ... // properties according to json-schema, e.g.
    "item": "paper",
    "count": 15
  }
  ```

- 400 Bad Request

  Reasons: Empty document, schema validation error

## PUT /{modelName}/:id

Update a document.

`updatedAt` timestamp is set to current date-time.  
`v` version number is incremented.

*Example*:

```json
POST /items 
{
  "id": "0lgg8pg824co0Z3dHVGDOqDm",
  "v": 1,
  "item": "scissor"
}
```

**Returns:**

- 200 OK

  Returns the updated document

  ```json
  {
    "id": string,
    "v": integer,
    "updatedAt": string($date-time),
    "createdAt": string($date-time),
    ... // properties according to json-schema, e.g.
    "item": "scissor",
    "count": 15
  }
  ```

- 400 Bad Request

  Reasons: Empty document, schema validation error

- 404 Not Found

  Reasons: Document with `id` not found

## DELETE /{modelName}/:id

Delete a document with `id`.

By default documents are deleted immediately.

If using `instantDelete=false` through the database-adapter the document is only
marked as deleted by setting a `deletedAt` timestamp.

This requires latter data removal via e.g. cron-jobs to remove the deleted
documents from the database.

**Returns:**

- 204 No Content

  Document deleted

- 404 Not Found

  Document not there (anymore...)

## GET /{modelName}/:id

Finds documents by its id.

**Returns:**

- 200 OK

  The found document.

  ```json
  {
    "id": string,
    "v": integer,
    "updatedAt": string($date-time),
    "createdAt": string($date-time),
    ... // properties according json-schema
  }
  ```

- 404 Not Found

  Document not there (anymore...)

## GET /{modelName}&nbsp;

Query multiple documents.

Only properties which are named in the JSON-schema of the model can be used as
query parameters

> **⚠️ NOTE:** All query operators `$`-chars must be properly URL encoded with `%24`.

### Query Operators numeric

| operator | description                                                         |
| -------- | ------------------------------------------------------------------- |
| $gt      | Matches values that are greater than a specified value.             |
| $gte     | Matches values that are greater than or equal to a specified value. |
| $lt      | Matches values that are less than a specified value.                |
| $lte     | Matches values that are less than or equal to a specified value.    |
| $ne      | Matches all values that are not equal to a specified value.         |

**Examples**

```js
// 10 < width <= 15
GET ?width%24gt=10&width%24lte=15

// height !== 17
GET ?height%24ne=17
```

### Query Operators string

| operator | description                                            |
| -------- | ------------------------------------------------------ |
| $starts  | starts-with search                                     |
| $like    | contains                                               |
| $ends    | ends-with search                                       |
| $cs      | (modifier) case sensitive search                       |
| $not     | (modifier) inverse search e.g. `field$not$like=foobar` |

> **⚠️ NOTE:** Case (in-)sensitive search may not work for all database
> adapters. Please consider setting the correct collation.
> E.g. for [postgres](https://www.postgresql.org/docs/current/collation.html#COLLATION-NONDETERMINISTIC) choose
> 
> ```sql
> CREATE COLLATION case_insensitive (provider = icu, locale = 'und-u-ks-level2', deterministic = false);
> ```
> 
> E.g. for mariadb, mysql
> 
> ```sql
> ALTER TABLE mytable
> CONVERT TO CHARACTER SET utf8mb4
> COLLATE utf8mb4_general_ci; -- *_ci = case insensitive
> ```

**Examples**

```js
// search all `item`s which do not contain `paper` case-insensitive
GET ?item%24not%24like=paper

// search all `article`s which starts-with `Jacket` case-sensitive
GET ?article%24starts%24cs=Jacket
```

### Query Parameters

| param     | type     | description                                                                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| offset    | integer  | pagination offset                                                                                                                      |
| limit     | integer  | pagination limit or size (defaults to 100 documents)                                                                                   |
| countDocs | boolean  | Include document count in response.                                                                                                    |
| fields    | string[] | comma separated list of schema properties which shall be returned.                                                                     |
| sort      | string[] | comma separated list of schema properties for sorting. <br>Needs `$desc` operator for descending sort. <br>Defaults to ascending sort. |

> **⚠️ NOTE:** Avoid using the params as document properties. You won't be able to
> query for any of these doc properties then.

**Examples**

```js
// get the 2nd page for a page which contains 100 documents
GET ?offset=100&limit=100&countDocs=true

// get back only { id, v, item } properties from the query
GET ?fields=id,v,item

// sort result set by ascending `price` and descending `date`
GET ?sort=price,date%24desc
```

**Returns:**

- 200 OK

  The found documents.

  ```json
  {
    "offset": integer,
    "limit": integer,
    "count": integer, // only for &countDocs=true
    "data": [         // the found documents
      {
        "id": string,
        "v": integer,
        "updatedAt": string($date-time),
        "createdAt": string($date-time),
        ... // properties according json-schema
      }
    ]
  }
  ```

- 400 Bad Request

  Reason: Validation errors on provided query parameters

  E.g. `GET /{modelName}?foobar=1` where `foobar` is not a valid document property, will respond with:

  ```json
  {
    "status": 400,
    "message": "validation error",
    "errors": {
      "foobar": "unsupported property"
    }
  }
  ```

## POST /{modelName}/search

Same as [SEARCH /{modelName}&nbsp;](#search-modelname)

## SEARCH /{modelName}&nbsp;

Query multiple documents.

Only properties which are named in the JSON-schema of the model can be used as
search parameters. 

All Query params from [GET /{modelName}&nbsp;](#get-modelname) can be used to
form complex search terms.

* [Query Operators numeric](#query-operators-numeric)
* [Query Operators string](#query-operators-string)
* [Query Parameters](#query-parameters)

Additionally the boolean operators `$and` and `$or` can be used. 

E.g. with the following JSON-Schema

```json
{
  "type": "object",
  "properties": {
    "item": { "type": "string" },
    "count": { "type": "integer" } 
  }
}
```

To search for the first 10 documents which do not contain "paper" (case-insensitive) and
have a count greater 5 and less than 30, sorted by "item" and "count"
(descending), where only the fields "id", "item" and "count" are returned.

```json
SEARCH /items
content-type: application/json
{
  "offset": 0,
  "limit": 10,
  "sort": [
    { "item": 1 },    // sort item ascending
    { "count": -1 }   // sort width descending
  ],
  "fields": ["id", "item", "width"],
  "$and": [
    { "item": { "$like": "paper", "$not": true, "$cs": false } },
    { "count": { "$gt": 5, "$lte": 30 } }
  ]
}
```

To obtain all documents where item is "paper", "journal" sorted by "width".

```json
SEARCH /items
content-type: application/json
{
  "item": ["paper", "journal"],
  "fields": ["id", "count"],
  "sort": [{ "width": 1 }]
}
```

# Bulk operations

## POST /{modelName}/create

Create multiple documents

*Example Request*:

```json
POST /items/create
content-type: application/json
[
  {"item": "paper" },
  {"item": "scissor", "count": 1 },
  {"item": "stone", "count": 3 },
  {"x-item": "foo" },
]
```

Each document is schema checked and then persisted. In case of errors the error
message and its status is returned. The ordering of the items as presented in
the request is maintained.

*Example Response*:

```json
200 OK
content-type: application/json
[
  {
    "id": "0lhwef7qq99NuNN62BW7NNjQ", 
    "v": 1,
    "createdAt": Date,
    "item": "paper",
    "count": 0
  }, {
    "id": "0lhwef7qtIrkY37pGJjVY63l", 
    "v": 1,
    "createdAt": Date,
    "item": "scissor", 
    "count": 1 
  }, {
    "id": "0lhwef7qvk8sI9M1gj33J7fE", 
    "v": 1,
    "createdAt": Date,
    "item": "stone", 
    "count": 3 
  }, {
    "status": 400, 
    "message": "validation error"
  }  
]
```

## PUT /{modelName}&nbsp;

Update multiple documents

To update documents id and version `v` must be present in the document.

*Example Request*:

```json
PUT /items
content-type: application/json
[
  {
    "id": "0lhwef7qq99NuNN62BW7NNjQ", 
    "v": 1,
    "count": 5
  }, {
    "id": "0lhwef7qtIrkY37pGJjVY63l", 
    "v": 1,
    "item": "scissors", 
  }, {
    "item": "foo"
  }
]
```

Each document is schema checked and then persisted. In case of errors the error
message and its status is returned. The ordering of the items as presented in
the request is maintained.

*Example Response*:

```json
200 OK
content-type: application/json
[
  {
    "id": "0lhwef7qq99NuNN62BW7NNjQ", 
    "v": 2,
    "createdAt": Date,
    "item": "paper",
    "count": 5
  }, {
    "id": "0lhwef7qtIrkY37pGJjVY63l", 
    "v": 2,
    "createdAt": Date,
    "item": "scissors", 
    "count": 1 
  }, {
    "status": 400, 
    "message": "validation error"
  }  
]
```

## POST /{modelName}/delete

Delete multiple documents

For deleting multiple documents the same syntax as with [SEARCH /{modelName}&nbsp;](#search-modelname)
shall be used.

*Example Request*:

All items with type "paper" or "stone" are to be deleted.

```json
POST /items/delete
content-type: application/json
{
  "item": ["paper", "stone"]
}
```

*Example Response*:

All items with type "paper" or "stone" are to be deleted.

```json
200 OK
content-type: application/json
{
  "deletedCount": 2
}
```
