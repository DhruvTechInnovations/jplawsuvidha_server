const {Pool}=require('pg')
const pool=new Pool({
    host: process.env.DB_HOST,
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
  {
    rejectUnauthorized:false
  }
})
pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ Error connecting to PostgreSQL:', err.stack);
    } else {
      console.log('✅ PostgreSQL connected successfully!');
      release(); // release the client back to the pool
    }
  });
module.exports=pool
// const {Pool}=require('pg')
// const pool=new Pool({
//     host:"localhost",
//     database:"lawsuvidha",
//     user:"postgres",
//     password:"pg",
//     port:5432,
// })
// pool.connect((err, client, release) => {
//     if (err) {
//       console.error('❌ Error connecting to PostgreSQL:', err.stack);
//     } else {
//       console.log('✅ PostgreSQL connected successfully!');
//       release(); // release the client back to the pool
//     }
//   });
// module.exports=pool