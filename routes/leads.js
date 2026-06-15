const express = require('express')
const pool = require('../db/pg');
const profileMiddleware = require('../middleware/profileMiddleware');

const leadRouter = express.Router();

leadRouter.get('/leads', profileMiddleware, async (req, res) => {
  try {
    const user = req.user;

    if (!user?.email) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: invalid access token',
      });
    }

    const { email, isAdmin } = user;

    /**
     * Single query:
     * - Join to get assigned user's name
     * - Admin sees all leads
     * - Advocate sees only assigned leads
     */
    const query = `
        SELECT
          l.id,
          l.name,
          l.phone,
          l.connected,
          l.status,
          l.casetype,
          l.location,
          l.court,
          uh.lawyername AS assigned,
          l.assigned_date,
          l.created_at,
          l.description
        FROM leads l
        LEFT JOIN user_history uh
          ON uh.email = l.assigned
        WHERE
          ($1::boolean = true AND EXISTS (
            SELECT 1 FROM user_history u
            WHERE u.email = $2 AND u.superuser = true
          ))
          OR
          ($1::boolean = false AND l.assigned = $2)
        ORDER BY l.created_at DESC
        LIMIT 50;
      `;

    const values = [isAdmin, email];
    const { rows } = await pool.query(query, values);
    console.log('leads data', rows)

    return res.status(200).json({
      status: 'success',
      message: 'Leads fetched successfully',
      leads: rows,
    });

  } catch (err) {
    console.error('Error fetching leads:', err);

    return res.status(500).json({
      status: 'error',
      message: 'Error while fetching leads',
    });
  }
});


// Leads update API handler
leadRouter.put(
  '/leads/:id',
  profileMiddleware,
  async (req, res) => {
    const { id } = req.params;
    console.log('request body is ', req.body)
    const { connected, reason, notes = '', status = 'New' } = req.body;
    const Allowed_Status = ['New', 'Completed', 'In Progress', 'Declined']
    const performedBy = req.user.email;

    /* -------------------- VALIDATION -------------------- */

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({ message: 'Invalid lead id' });
    }
    console.log('check 1...........')

    if (!Allowed_Status.includes(status)) {
      return res.status(400).json({ message: 'In valid status' })
    }
    console.log('check 2...........')


    if (connected !== undefined && typeof connected !== 'boolean') {
      return res.status(400).json({ message: '`connected` must be a boolean' });
    }
    console.log('check 3...........')

    // if (reason !== undefined) {
    //   if (typeof reason !== 'string' || reason.trim().length === 0) {
    //     return res.status(400).json({
    //       message: '`reason` must be a non-empty string'
    //     });
    //   }
    //   console.log('check 4...........')

    // }
    // if (reason.length > 255) {
    //   return res.status(400).json({ message: 'Reason too long' });
    // }

    if (notes.length > 500) {
      return res.status(400).json({ message: 'Notes too long' });
    }
    const cleanReason =
      typeof reason === 'string' ? reason.trim() : null;

    const cleanNotes =
      typeof notes === 'string' ? notes.trim() : '';

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      /* -------------------- FETCH CURRENT STATE -------------------- */
      console.log('check 2')

      const leadResult = await client.query(
        `
      SELECT l.connected,l.status
  FROM leads l
  WHERE l.id = $1
  AND (
      l.assigned = $2
      OR EXISTS (
          SELECT 1
          FROM user_history uh
          WHERE uh.email = $2
            AND uh.superuser = true
      )
  )
  FOR UPDATE OF l;
          `,
        [id, performedBy]
      );
      console.log('check 3')
      if (leadResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }

      const previousConnected = leadResult.rows[0].connected;
      const prevStatus = leadResult.rows[0].status;

      console.log('check 4')
      // IDEMPOTENCY CHECK
      if (previousConnected === connected && prevStatus === status) {
        await client.query('ROLLBACK');

        return res.status(200).json({
          success: true,
          message: 'No change',
          data: { leadId: id, connected }
        });
      }


      /* -------------------- UPDATE LEADS TABLE -------------------- */

      await client.query(
        `
          UPDATE leads
          SET
            connected = $1,
            status=$4,
            updated_at = NOW()
          WHERE id = $2
  AND (
      assigned = $3
      OR EXISTS (
          SELECT 1
          FROM user_history uh
          WHERE uh.email = $3
            AND uh.superuser = true
      )
  )
          `,
        [connected, id, performedBy, status]
      );
      console.log('check 5')
      /* -------------------- INSERT CONNECTION HISTORY -------------------- */

      await client.query(
        `
          INSERT INTO leads_connection_history (
            lead_id,
            connected,
            reason,
            notes,
            performed_by
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
        [id, connected, cleanReason, cleanNotes, performedBy]
      );
      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        data: {
          leadId: id,
          previousConnected,
          connected
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');

      console.error('Update lead failed:', err);

      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to update lead'
      });
    } finally {
      client.release();
    }
  }
);


module.exports = leadRouter;
