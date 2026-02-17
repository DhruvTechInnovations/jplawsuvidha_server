const pool=require('../db/pg')

const addLeadActivity = async (req, res) => {
  const { leadId } = req.params;
  const { activity } = req.body;
// console.log('inside the leadactivity')
// console.log('req.body : ',req.body)
// console.log('req.params : ',req.params)
  const advocateInfo = req.user;
  // console.log('advocateInfo : ',advocateInfo)
  const advocateId=req.user.email

  // Basic validation
  if (!activity || typeof activity !== "string") {
    return res.status(400).json({
      message: "Activity text is required"
    });
  }

  if (activity.length > 5000) {
    return res.status(400).json({
      message: "Activity text too long"
    });
  }

  try {
    const query = `
      INSERT INTO lead_activity_logs
      (lead_id, advocate_id, activity_text)
      VALUES ($1, $2, $3)
      RETURNING id, created_at;
    `;

    const values = [leadId, advocateId, activity];

    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "Activity added successfully",
      activity: result.rows[0]
    });

  } catch (error) {
    console.error("Add Lead Activity Error:", error);

    return res.status(500).json({
      message: "Failed to add activity"
    });
  }
};




// fetch the lead activity
const getLeadActivities = async (req, res) => {
    const { leadId } = req.params;
    const limit = Number(req.query.limit) || 5;
  
    if (isNaN(limit) || limit <= 0 || limit > 50) {
      return res.status(400).json({
        message: "Invalid limit value"
      });
    }
  
    try {
      const query = `
        SELECT
          id,
          activity_text,
          created_at,
          advocate_id
        FROM lead_activity_logs
        WHERE lead_id = $1
        ORDER BY created_at DESC
        LIMIT $2;
      `;
  
      const { rows } = await pool.query(query, [leadId, limit]);
  
      return res.status(200).json({
        activities: rows
      });
  
    } catch (error) {
      console.error("Fetch Lead Activities Error:", error);
  
      return res.status(500).json({
        message: "Failed to fetch activities"
      });
    }
  };
module.exports={addLeadActivity,getLeadActivities}