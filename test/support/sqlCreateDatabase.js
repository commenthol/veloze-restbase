export async function createDatabasePostgres(options) {
  const { user, password, host, port, database } = options
  const { default: pg } = await import('pg')
  const client = new pg.Client({
    user,
    password,
    host,
    port,
    database: 'postgres'
  })
  client.connect()
  try {
    await client.query(`CREATE DATABASE ${database}`)
  } catch (e) {
    if (e.message !== `database "${database}" already exists`) {
      throw e
    }
  }
  client.end()
}

export async function createDatabaseMariaDb(options) {
  const { user, password, host, port, database } = options
  const { default: mariadb } = await import('mariadb')
  const client = await mariadb.createConnection({ user, password, host, port })
  await client.query(
    `CREATE DATABASE IF NOT EXISTS ${database}` +
      ' DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_general_ci'
  )
  client.end()
}
