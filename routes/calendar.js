const pool=require('../db/pg')
const express = require('express');
const profileMiddleware = require('../middleware/profileMiddleware');

const custom = express.Router();

custom.get("/custom/events",profileMiddleware, async (req, res) => {
  console.log('check1')
  const {email}=req.user
  const result = await pool.query(
    "SELECT * from calendar_events  WHERE email = $1",
    [email]
  );
  console.log('calendar events fetched',result.rows)
  console.log(' from 1 result is ',result)
  res.json(result.rows);
});

custom.post("/custom/event",profileMiddleware, async (req, res) => {
  console.log('inside in app post')
  const data = req.body;
  const user=req.user
  const result = await pool.query(
    `
    INSERT INTO  calendar_events (email,data) values($1,$2)
    RETURNING id, data
    `,
    [user.email, data]
  );

  res.json(result.rows[0]);
});

custom.put("/custom/event/:id",profileMiddleware, async (req, res) => {
  const { id } = req.params;
  const data= req.body;
  console.log('inside update calendar route',id)

  console.log('data from update route',data)
  console.log('req.user email is ',req.user.email)
  const result = await pool.query(
    "UPDATE calendar_events SET data=$1 WHERE id=$2 and email=$3 RETURNING *",
    [data, id, req.user.email]
  );
  if (result.rowCount === 0) {
    return res.status(403).json({ message: "Not allowed or event not found" });
  }
  res.json(result.rows[0]);
});

custom.delete("/custom/event/:id",profileMiddleware, async (req, res) => {
  const { id } = req.params;
  console.log('id in delete', id)
  await pool.query("DELETE FROM calendar_events WHERE id=$1 and email=$2", [id,req.user.email]);
  res.sendStatus(204);
});

module.exports=custom;