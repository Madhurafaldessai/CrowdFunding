const { getHealthStatus } = require('../db/health');

class HealthController {
  async getHealth(req, res) {
    const health = await getHealthStatus();
    const httpStatus = health.status === 'ok' ? 200 : 503;
    return res.status(httpStatus).json(health);
  }
}

module.exports = new HealthController();

