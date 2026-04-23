const { getUserFromRequest } = require('../../lib/auth');
const { ensureVisitsTable, getPool } = require('../../lib/db');
const { readJson, sendJson } = require('../../lib/http');
const { hasWriteFlow, updateVisitInFlow } = require('../../lib/power-automate');

module.exports = async (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return sendJson(res, 401, { message: 'Unauthorized' });
  }

  if (req.method !== 'PATCH') {
    return sendJson(res, 405, { message: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const visitId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const endTime = body.end_time ? String(body.end_time).trim() : null;
    const checkoutLat = body.gps_lat == null ? null : Number(body.gps_lat);
    const checkoutLng = body.gps_lng == null ? null : Number(body.gps_lng);
    const checkoutAccuracy = body.gps_accuracy == null ? null : Number(body.gps_accuracy);

    if (hasWriteFlow()) {
      await updateVisitInFlow({
        id: visitId,
        consultant_email: user.email,
        end_time: endTime,
        checkout_gps_lat: checkoutLat,
        checkout_gps_lng: checkoutLng,
        checkout_gps_accuracy: checkoutAccuracy,
      });
    } else {
      await ensureVisitsTable();
      const pool = getPool();
      const result = await pool.query(
        `
          update consultant_visits
          set end_time = coalesce($3, end_time),
              checkout_gps_lat = coalesce($4, checkout_gps_lat),
              checkout_gps_lng = coalesce($5, checkout_gps_lng),
              checkout_gps_accuracy = coalesce($6, checkout_gps_accuracy),
              updated_at = now()
          where id = $1 and consultant_email = $2
          returning id
        `,
        [visitId, user.email, endTime, checkoutLat, checkoutLng, checkoutAccuracy]
      );

      if (!result.rowCount) {
        return sendJson(res, 404, { message: 'Visit not found' });
      }
    }

    return sendJson(res, 200, { id: visitId });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || 'Update failed' });
  }
};
