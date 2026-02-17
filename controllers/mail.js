require('dotenv').config();

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendAdminCaseNotification(savedcase) {
  try {
    const {
      client_name,
      client_phone,
      client_email,
      case_category,
      jurisdiction,
      case_description,
    } = savedcase;
 const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
  if (adminEmails.length === 0) {
      console.error('❌ No admin emails configured');
      return;
    }
    console.log(adminEmails)
    const msg = {
      to: process.env.ADMIN_EMAIL,
      cc:adminEmails,
      from: {
        email: process.env.MAIL_FROM,
        name: "JP Law Suvidha",
      },
      subject: "📌 New Case Submission – JP Law Suvidha",
      html: `


<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:6px;">

          <tr>
            <td style="background:#1e2a38; color:#ffffff; padding:20px;">
              <h2 style="margin:0;">📩 New Case Submitted</h2>
              <p style="margin:5px 0 0;">JP Law Suvidha</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px; color:#333;">

              <p>A new case has been submitted. Details are below:</p>

              <h3>👤 Client Information</h3>
              <table width="100%" cellpadding="6">
                <tr><td><strong>Name</strong></td><td>${client_name}</td></tr>
                <tr><td><strong>Phone</strong></td><td>${client_phone}</td></tr>
                <tr><td><strong>Email</strong></td><td>${client_email}</td></tr>
              </table>

              <h3 style="margin-top:20px;">⚖️ Case Details</h3>
              <table width="100%" cellpadding="6">
                <tr><td><strong>Category</strong></td><td>${case_category}</td></tr>
                <tr><td><strong>Jurisdiction</strong></td><td>${jurisdiction}</td></tr>
                <tr>
                  <td style="vertical-align:top;"><strong>Description</strong></td>
                  <td>${case_description}</td>
                </tr>
              </table>

              <p style="margin-top:20px;">
                Please log in to the admin panel to review and assign this case.
              </p>

              <p>
                Regards,<br/>
                <strong>JP Law Suvidha System</strong>
              </p>

            </td>
          </tr>

          <tr>
            <td style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
              © ${new Date().getFullYear()} JP Law Suvidha
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
      `,
    };

    await sgMail.send(msg);
    console.log("✅ Admin case notification email sent");
  } catch (error) {
    console.error("❌ Failed to send admin email:", error);
    throw error;
  }
}

module.exports = {
  sendAdminCaseNotification,
};

