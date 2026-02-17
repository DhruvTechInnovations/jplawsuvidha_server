// const express=require('express')
// const pool=require('../db/pg');
// const { sendAdminCaseNotification } = require('../controllers/mail');
// const caseRouter=express.Router()
// caseRouter.post('/webClients',async(req,res)=>{
//     // console.log(req.body)
//     try {
//     const { newEntry } = req.body;
//     console.log(newEntry)
//     if (!newEntry) {
//       return res.status(400).json({ success: false, message: "data is required" });
//     }
//     const {
//       clientName,
//       clientPhone,
//       clientEmail,
//       caseCategory,
//       jurisdiction,
//       clientAddress,
//       caseDescription,
//     } = newEntry;
//     // need to mask the phone number and store it in the database.
//     // validate the need of validating the data on server side.
//     const result=await pool.query("INSERT INTO walk_in_client_cases(client_name, client_phone, client_email, case_category, jurisdiction, client_address, case_description)VALUES ($1, $2, $3, $4, $5, $6, $7)   RETURNING *",
//         [clientName,clientPhone,clientEmail,caseCategory,jurisdiction,clientAddress,caseDescription])
//         // sendAdminCaseNotification(result.rows[0]) UNDER DEVELOPMENT
// return res.status(200).json({
//   success: true,
//   message: "Data inserted successfully",
//   data:result.rows[0]
// });   
//  }
//   catch (error) {
//   // console.error("Error occurred while inserting:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//     }
// })
// module.exports=caseRouter
const express = require('express');
const pool = require('../db/pg');
const { sendAdminCaseNotification } = require('../controllers/mail');
const caseRouter = express.Router();
const normalize = (value) =>
  value === undefined || value === '' ? null : value;

caseRouter.post('/webClients', async (req, res) => {
  try {
    const { newEntry } = req.body;

    if (!newEntry) {
      return res.status(400).json({
        success: false,
        message: "Data is required",
      });
    }

    const {
      clientName,
      clientPhone,
      clientEmail,
      caseCategory,
      jurisdiction,
      caseDescription,
      otherCaseCategory
    } = newEntry;

    if (!clientName || !clientPhone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await pool.query(
      `INSERT INTO walk_in_client_cases
      (client_name, client_phone, client_email, case_category, jurisdiction,case_description,other_description)
      VALUES ($1, $2, $3, $4, $5, $6,$7)
      RETURNING *`,
      [
        clientName,
        clientPhone,
        normalize(clientEmail),
        normalize(caseCategory),
        normalize(jurisdiction),
        caseDescription,
        otherCaseCategory
      ]
    );
    // console.log('client details from contact us form',result.rows[0])

    // fire-and-forget email

    sendAdminCaseNotification(result.rows[0])
      .catch(err => console.error("Admin email failed:", err));

    return res.status(200).json({
      success: true,
      message: "Data inserted successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error("Insert error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

module.exports = caseRouter;
