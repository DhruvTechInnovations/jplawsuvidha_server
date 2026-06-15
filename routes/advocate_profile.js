const express = require("express");
const pool = require("../db/pg");
const authMiddleware = require("../middleware/profileMiddleware");
const profileMiddleware = require("../middleware/profileMiddleware");
const {image_storage,s3}=require('../helper/login/s3client.js')
const { v4: uuidv4 } = require("uuid");
const{PutObjectCommand} =require('@aws-sdk/client-s3')
// const { GetObjectCommand } =require("@aws-sdk/client-s3");
// const { getSignedUrl } =require("@aws-sdk/s3-request-presigner");


const profile_router = express.Router();
// async function generateSignedUrl(fileKey) {
//   const command = new GetObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: fileKey,
//   });

//   // URL valid for 1 hour
//   const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
//   return signedUrl;
// }


profile_router.get("/profile", profileMiddleware, async (req, res) => {
  try {
     if (!req.user || !req.user.email) {
      return res.status(401).json({
        message: "Unauthorized: invalid access token",
      });
    }
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    // 2. Fetch profile from DB
    const query = `
      SELECT
        lawyername AS name,
        email,
        barcouncilid AS "barCouncilId",
        mobile AS "phone",
        address,
        state,
        postal_code AS "zipcode",
        profile_image
      FROM user_history
      WHERE email = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [email]);
    // const fileKey=rows[0].fileKey
    // const url = await generateSignedUrl(fileKey);
    console.log('this is from fetching profile',rows)

    if (rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // 3. Send clean response
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Profile route error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
profile_router.put('/profile',profileMiddleware,async (req,res)=>{
  const {email}=req.user
  console.log('user trying to update the profile is',email)
  try{
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        message: "Unauthorized: invalid access token",
      });
    }
    const{state,zipcode,phone,address,fullName}=req.body
   const result=await pool.query(`UPDATE user_history SET lawyername=$1,state=$2,postal_code=$3,country=$4,address=$5,mobile=$6,plast_update=NOW() where email=$7 RETURNING *`,[fullName,state,zipcode,'India',address,phone,email])
   console.log('updated result for the profile update is ',result.rows[0])

    return res.status(200).json({
      status:'success',
      message:'Profile updated successfully',
      updateProfile:result.rows[0]
    })


  }catch(err)
  {
    console.error("Update Profile route error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
})

profile_router.post(
  "/profile/upload-profile",
  image_storage.single("file"),
  profileMiddleware,
  async (req, res) => {
    console.log('inside post of profile')
    try {
      console.log('inside photo upload')
      const {email} = req.user;
      const file = req.file;
      console.log('file',req.file)

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileKey = `profiles/${uuidv4()}-${file.originalname}`;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_PROFILE,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));

      const imageUrl = `https://${process.env.AWS_BUCKET_PROFILE}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      await pool.query(
        `UPDATE user_history SET profile_image=$1 WHERE email=$2`,
        [imageUrl, email]
      );

      res.json({
        message: "Profile uploaded successfully",
        imageUrl,
      });

    } catch (err) {
      console.error("S3 upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


module.exports = profile_router;
