const { getUserFromRequest } = require('../../lib/auth');
const { ensureVisitsTable, getPool, mapVisitRow, newVisitId } = require('../../lib/db');
const { readJson, sendJson } = require('../../lib/http');
const { createVisitInFlow, hasReadFlow, hasWriteFlow, readVisitsFromFlow } = require('../../lib/power-automate');

module.exports = async (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return sendJson(res, 401, { message: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const query = req.query || {};
      const storeId = String(query.store_id || '').trim();
      const visitDate = String(query.visit_date || '').trim();
      const hasStoreDayFilter = !!storeId && !!visitDate;

      if (hasReadFlow()) {
        return sendJson(res, 200, await readVisitsFromFlow(user, { storeId, visitDate }));
      }

      await ensureVisitsTable();
      const pool = getPool();
      const result = hasStoreDayFilter
        ? await pool.query(
            `
              select *
              from consultant_visits
              where store_id = $1 and visit_date = $2
              order by created_at desc
            `,
            [storeId, visitDate]
          )
        : await pool.query(
            `
              select *
              from consultant_visits
              where consultant_email = $1
              order by created_at desc
            `,
            [user.email]
          );
      return sendJson(res, 200, result.rows.map(mapVisitRow));
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      const visit = {
        id: newVisitId(),
        consultant_email: user.email,
        consultant_name: user.name,
        work_mode: body.work_mode === 'work_from_home' ? 'work_from_home' : 'store_visit',
        store_id: String(body.store_id || '').trim(),
        visit_date: String(body.visit_date || '').trim() || new Date().toISOString().slice(0, 10),
        start_time: String(body.start_time || '').trim(),
        end_time: body.end_time ? String(body.end_time).trim() : null,
        reason: String(body.reason || '').trim(),
        notes: String(body.notes || ''),
        gps_lat: Number(body.gps_lat),
        gps_lng: Number(body.gps_lng),
        gps_accuracy: body.gps_accuracy == null ? null : Number(body.gps_accuracy),
      };

      if (!visit.store_id || !visit.start_time || !visit.reason) {
        return sendJson(res, 400, { message: 'Store, start time, and reason are required' });
      }
      if (!Number.isFinite(visit.gps_lat) || !Number.isFinite(visit.gps_lng)) {
        return sendJson(res, 400, { message: 'Latitude and longitude are required' });
      }

      if (hasWriteFlow()) {
        await createVisitInFlow(visit);
      } else {
        await ensureVisitsTable();
        const pool = getPool();
        await pool.query(
          `
            insert into consultant_visits (
              id, consultant_email, consultant_name, work_mode, store_id, start_time, end_time,
              visit_date, reason, notes, gps_lat, gps_lng, gps_accuracy
            )
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          `,
          [
            visit.id,
            visit.consultant_email,
            visit.consultant_name,
            visit.work_mode,
            visit.store_id,
            visit.start_time,
            visit.end_time,
            visit.visit_date,
            visit.reason,
            visit.notes,
            visit.gps_lat,
            visit.gps_lng,
            visit.gps_accuracy,
          ]
        );
      }

      return sendJson(res, 200, { id: visit.id });
    }

    return sendJson(res, 405, { message: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, 500, { message: error.message || 'Request failed' });
  }
};
