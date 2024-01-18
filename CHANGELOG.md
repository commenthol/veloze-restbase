# 0.1.1 (2024-01-18)

### fix:

- throw if default schema props are used in schema (#6857aac)
- pass indexes (#afd1ed2)
- do not mutate documents on create or update (#57a1e86)
- Index type (#608e11f)

### docs:

- add link to docs (#5b19840)
- sqlite3 example (#8a10885)
- badges (#8a60adf)

### chore:

- bump dependencies (#70b7d05)

# 0.1.0 (2023-06-06)

### feat:

- bulk operations (#c74e686)
- exposing deleteDeleted method in ModelAdapter (#3bf1db3)
- search endpoint (#264f062)
- search for multiple ids (#a444856)
- findMany with document count support via countDocs=true (#2028265)
- SqlAdapter with sequelize (#beb4d67)
- Rest router and mongo db adapter (#4e97c11)

### fix:

- limit max body size (#9ea88ab)
- linter issue; types (#09f110e)
- adapters/SqlAdapter: prefer int4 over int8 as default integer value (#e1dc2ef)
- id ordering by using timestamp encoded uuids (#af083f2)
- prefix operators with $ (#532107e)
- schema remove additional properties (#81d2186)
- double comma escapes (#5e110ae)
- HttpError info property (#2815ce2)
- index creation (#f57d682)
- schema use coerceTypes=true (#2d69935)
- SqlAdapter: choose datatype text for maxLength > 8000 (#76c79b5)
- sorting (#63c8d5f)

### docs:

- README reviewed (#590e12c)
- document bulk operations (#7c8496e)
- openapi template extended by POST /search (#80f07e3)
- update to CONTRIBUTING (#c9328d9)
- README update (#7f145e7)
- openapi blueprint (#9a8ad51)
- adding contributing and code-of-conduct information (#73bf52f)
- adding examples (#08626ff)

### chore:

- bump dependencies (#307884c)
- bump dependencies (#f460ea3)
- project setup (#ea29c8f)
- initial commit (#436f8f9)

### example:

- update accept headers (#075cffc)

### refactor:

- logger function (#d6a3f5e)
- allow to overwrite logger function (#3f3d949)

### test:

- performance tests created (#d2b8931)
- fix SqlAdapter test (#0dbc762)
- create database before running the tests (#9f0b808)

