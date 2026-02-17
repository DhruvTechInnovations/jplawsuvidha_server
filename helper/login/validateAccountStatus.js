// function validateAccountStatus(user) {
//   if (!user.admin_verified || user.payment_status === 'pending') {
//     const err = new Error('Account not yet activated');
//     err.status = 403;
//     console.log('error is ',err)
//     throw err;
//   }
// }
// module.exports=validateAccountStatus
function validateAccountStatus(user) {
  if (!user.admin_verified) {
    const err = new Error('Admin verification pending');
    err.status = 403;
    throw err;
  }


  if (user.payment_status === 'pending') {
    const err = new Error('Payment is pending');
    err.status = 402; // Payment Required (more semantically correct)
    throw err;
  }
}

module.exports = validateAccountStatus;
