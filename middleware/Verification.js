// const jwt=require('jsonwebtoken')
// const secret_key='legalsuvidha'
// const refresh_key='suvidhalegal'
// const verification=(req,res,next)=>{
//     const token=req.cookies.token ||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6ImFiIiwiaWF0IjoxNzUzNDQxMTU5LCJleHAiOjE3NTM0NDExNjl9.HA3Wpnk1_W8RlQspZqr8FPPYqD6l_xXqjsfBDdtXI6k'
//     console.log(`token from verification is ${token}`)
//     if(!token)
//     {
//         return res.status(401).json({error:'NO TOKEN'})
//     }
//     try {
//         const decoded = jwt.verify(token,secret_key);
//         console.log('decoded:',decoded)
//         req.user = decoded;
//         console.log('req.user:',req.user)
//         next(); // ✔️ continue to the actual route
//       } catch (err) {
//         res.status(403).json({ error: 'Invalid or expired token' });
//       }
    
// }
// module.exports=verification