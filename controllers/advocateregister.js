require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendAdminAdvocateRegistrationNotification({
  name,
  email,
  phone,
  barCouncilId,
  practiceareas,
  experience,
  regions,
  plan,
  billingcycle

}) {

    const plans= {
        Monthly: {
          Starter: "999",
          Growth: "1,999",
          Pro: "4,999"
        },
        Half_Yearly: {
          Starter: "5,399",
          Growth: "10,799",
          Pro: "26,999"
        }
      };
      console.log('check 1',billingcycle)
      console.log('check 2',plan)



      const price=plans[billingcycle][plan]
      console.log('price is', price)
  try {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
  if (adminEmails.length === 0) {
      console.error('❌ No admin emails configured');
      return;
    }
    console.log(adminEmails)
    console.log("barcouncil id",barCouncilId)
    const msg = {
      to:process.env.ADMIN_EMAIL,
      cc: adminEmails,
      from: process.env.MAIL_FROM,
      subject: '👨‍⚖️ New Advocate Registered',
      html: `
<body style="margin:0; padding:0; background-color:#f7f7f7;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; padding:20px 0;">
    <tr>
      <td align="center">

      
        <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border:1px solid #000000; font-family:Arial, sans-serif;">

          <tr>
            <td>
              <img src="https://jplawsuvidha.com/email_banner.png"
                   alt="JP Law Suvidha"
                   width="620"
                   style="display:block; border-bottom:1px solid #000000;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:20px;">

              <h3 style="margin:0 0 15px 4px; font-size:20px; color:#333333;">
                New Advocate Registration
              </h3>

              <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                <tr>
                  <td style="font-weight:bold; color:#555555; width:180px;">Name:</td>
                  <td>${name}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Email:</td>
                  <td>${email}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Mobile:</td>
                  <td>${phone}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Bar Council Id:</td>
                  <td>${barCouncilId}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Practice Areas:</td>
                  <td>${practiceareas}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Experience:</td>
                  <td>${experience} years</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Regions:</td>
                  <td>${regions}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Plan:</td>
                  <td>${plan}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Billing Cycle:</td>
                  <td>${billingcycle}</td>
                </tr>
                <tr>
                  <td style="font-weight:bold; color:#555555;">Price:</td>
                  <td>${new Number(price)} /-</td>
                </tr>

                <tr>
                  <td style="font-weight:bold; color:#555555;">Registered At:</td>
                  <td>${new Date().toLocaleString('In')}</td>
                </tr>
              </table>

              <hr style="border:none; border-top:1px solid #cccccc; margin:20px 0;" />

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="text-align:center; font-size:13px; color:#555555;">

                <tr>
                  <td align="center" style="padding-bottom:10px;">
                    <img src="https://jplawsuvidha.com/og_logo.jpg"
                         width="120"
                         alt="JP Law Suvidha Logo"
                         style="display:block; margin:0 auto;" />
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom:10px;">
                    © 2026 JP Law Suvidha. All rights reserved.
                  </td>
                </tr>

                <tr>
                  <td>
                    <a href="https://www.linkedin.com/company/jp-law-suvidha/about/"
                       style="color:#0077b5; text-decoration:none;">LinkedIn</a>
                    &nbsp;|&nbsp;
                    <a href="https://youtube.com/@jplawsuvidha?si=Xg-wOQF_fJnYD_hj"
                       style="color:#FF0000; text-decoration:none;">YouTube</a>
                    &nbsp;|&nbsp;
                    <a href="https://x.com/jplawsuvidha_in"
                       style="color:#000000; text-decoration:none;">X</a>
                    &nbsp;|&nbsp;
                    <a href="https://www.instagram.com/jplawsuvidha"
                       style="color:#E1306C; text-decoration:none;">Instagram</a>
                    &nbsp;|&nbsp;
                    <a href="https://www.facebook.com/61579231556644/"
                       style="color:#1877F2; text-decoration:none;">Facebook</a>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
   `
    };

    await sgMail.send(msg);
    console.log('✅ registration notification sent to admin');
  } catch (error) {
    console.error('❌ error sending admin notification', error);
    // IMPORTANT: do NOT throw — email failure should not break registration
  }
}

module.exports = { sendAdminAdvocateRegistrationNotification };
