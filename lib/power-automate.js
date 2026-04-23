async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text ? { raw: text } : {};
  }

  if (!response.ok) {
    throw new Error(data.message || `Power Automate request failed with HTTP ${response.status}`);
  }

  return data;
}

function getWriteUrl() {
  return process.env.POWER_AUTOMATE_URL || '';
}

function getReadUrl() {
  return process.env.POWER_AUTOMATE_READ_URL || '';
}

function hasWriteFlow() {
  return !!getWriteUrl();
}

function hasReadFlow() {
  return !!getReadUrl();
}

async function createVisitInFlow(visit) {
  return postJson(getWriteUrl(), {
    action: 'create',
    id: visit.id,
    consultantName: visit.consultant_name,
    consultantEmail: visit.consultant_email,
    workMode: visit.work_mode,
    storeId: visit.store_id,
    visitDate: visit.visit_date,
    startTime: visit.start_time,
    endTime: visit.end_time,
    reason: visit.reason,
    notes: visit.notes,
    latitude: visit.gps_lat,
    longitude: visit.gps_lng,
    accuracy: visit.gps_accuracy,
    checkoutLatitude: null,
    checkoutLongitude: null,
    checkoutAccuracy: null,
  });
}

async function updateVisitInFlow(visit) {
  return postJson(getWriteUrl(), {
    action: 'checkout',
    id: visit.id,
    consultantEmail: visit.consultant_email,
    endTime: visit.end_time,
    checkoutLatitude: visit.checkout_gps_lat,
    checkoutLongitude: visit.checkout_gps_lng,
    checkoutAccuracy: visit.checkout_gps_accuracy,
  });
}

async function readVisitsFromFlow(user, filters = {}) {
  const data = await postJson(getReadUrl(), {
    action: 'list',
    consultantEmail: user.email,
    storeId: filters.storeId || '',
    visitDate: filters.visitDate || '',
  });

  return Array.isArray(data?.visits) ? data.visits : [];
}

module.exports = {
  createVisitInFlow,
  hasReadFlow,
  hasWriteFlow,
  readVisitsFromFlow,
  updateVisitInFlow,
};
