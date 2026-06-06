import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 2,
  idle_timeout: 20,
  connect_timeout: 30,
  connection: {
    statement_timeout: 60000,
  },
})

export default sql
