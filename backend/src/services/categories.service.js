const { getPool } = require('../db/pool');

class CategoriesService {
  async getCategories() {
    const pool = getPool();
    const [categories] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.icon,
        COUNT(CASE WHEN camp.status = 'active' THEN 1 END) as active_campaigns_count
      FROM categories c
      LEFT JOIN campaigns camp ON camp.category_id = c.id
      GROUP BY c.id, c.name, c.slug, c.description, c.icon
      ORDER BY c.name ASC
    `);
    return categories;
  }
}

module.exports = new CategoriesService();

