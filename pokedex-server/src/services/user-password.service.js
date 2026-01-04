const SolarSystem = require('../models/User');

async function getSystemVisitors(systemId) {
  const system = await SolarSystem.findById(systemId)
    .populate({
      path: 'planets',
      populate: { path: 'visitors' }
    })

  if (!system) {
    return null;
  }

  const visitorsById = new Map();

  for (const planet of system.planets || []) {
    for (const visitor of planet.visitors || []) {
      visitorsById.set(visitor._id.toString(), visitor);
    }
  }

  const uniqueVisitors = Array.from(visitorsById.values());
  return uniqueVisitors;
}

module.exports = { getSystemVisitors };
