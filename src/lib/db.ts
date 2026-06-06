import postgres from 'postgres'

// Transaction pooler — no prepared statements
const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 3,
})

export default sql
