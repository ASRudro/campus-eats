const db = require('../config/db');

/**
 * Get all campus food shops / stalls
 */
async function getShops(req, res) {
  try {
    const [shops] = await db.query(`
      SELECT 
        s.*,
        COUNT(m.id) as item_count
      FROM shops s
      LEFT JOIN menu_items m ON s.id = m.shop_id AND m.is_available = 1
      GROUP BY s.id
      ORDER BY s.id ASC
    `);

    const formatted = shops.map(shop => ({
      ...shop,
      logo_url: shop.logo_url || (shop.id <= 2 ? `/images/shops/shop${shop.id}_logo.jpg` : `/images/shops/shop${shop.id}_logo.svg`),
      rating: Number(shop.rating),
      is_open: Boolean(shop.is_open),
      item_count: Number(shop.item_count || 0)
    }));

    return res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('getShops error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch campus food shops.' });
  }
}

/**
 * Get all menu items with search, shop filtering, category filtering, and sorting
 */
async function getAllItems(req, res) {
  try {
    const { search, category, shop_id, shop, sort, is_special, is_combo, available_only } = req.query;

    let query = `
      SELECT 
        m.id, m.shop_id, m.category_id, m.name, m.description, m.price, m.calories,
        m.image_url, m.preparation_time, m.is_available, m.is_special, m.is_combo,
        c.name as category_name,
        s.name as shop_name, s.tagline as shop_tagline, s.category_type as shop_category,
        s.badge as shop_badge, s.location as shop_location, s.delivery_time as shop_delivery_time,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      LEFT JOIN shops s ON m.shop_id = s.id
      LEFT JOIN ratings r ON m.id = r.menu_item_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (m.name LIKE ? OR m.description LIKE ? OR s.name LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    const targetShop = shop_id || shop;
    if (targetShop && targetShop !== 'All' && targetShop !== 'all') {
      query += ` AND (m.shop_id = ? OR s.name = ?)`;
      params.push(targetShop, targetShop);
    }

    if (category && category !== 'All' && category !== 'all') {
      query += ` AND (c.name = ? OR m.category_id = ?)`;
      params.push(category, category);
    }

    if (is_special === 'true') {
      query += ` AND m.is_special = 1`;
    }

    if (is_combo === 'true') {
      query += ` AND m.is_combo = 1`;
    }

    if (available_only === 'true') {
      query += ` AND m.is_available = 1`;
    }

    query += ` GROUP BY m.id`;

    // Sorting
    if (sort === 'price_asc') {
      query += ` ORDER BY m.price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY m.price DESC`;
    } else if (sort === 'rating') {
      query += ` ORDER BY average_rating DESC`;
    } else if (sort === 'prep_time') {
      query += ` ORDER BY m.preparation_time ASC`;
    } else {
      // Default: Popularity / Specials
      query += ` ORDER BY m.is_special DESC, m.id ASC`;
    }

    const [items] = await db.query(query, params);

    // Format numbers
    const formatted = items.map(item => ({
      ...item,
      shop_id: Number(item.shop_id || 1),
      price: Number(item.price),
      calories: Number(item.calories),
      preparation_time: Number(item.preparation_time),
      is_available: Boolean(item.is_available),
      is_special: Boolean(item.is_special),
      is_combo: Boolean(item.is_combo),
      average_rating: Number(Number(item.average_rating).toFixed(1)),
      review_count: Number(item.review_count)
    }));

    return res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('getAllItems error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch menu items.' });
  }
}

/**
 * Get single menu item with shop info and reviews
 */
async function getItemById(req, res) {
  try {
    const { id } = req.params;

    const [items] = await db.query(
      `SELECT 
        m.id, m.shop_id, m.category_id, m.name, m.description, m.price, m.calories,
        m.image_url, m.preparation_time, m.is_available, m.is_special, m.is_combo,
        c.name as category_name,
        s.name as shop_name, s.tagline as shop_tagline, s.category_type as shop_category,
        s.badge as shop_badge, s.location as shop_location, s.delivery_time as shop_delivery_time,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      LEFT JOIN shops s ON m.shop_id = s.id
      LEFT JOIN ratings r ON m.id = r.menu_item_id
      WHERE m.id = ?
      GROUP BY m.id`,
      [id]
    );

    if (!items || items.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }

    const item = items[0];

    // Fetch reviews for this item
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name, u.student_id
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.menu_item_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...item,
        shop_id: Number(item.shop_id || 1),
        price: Number(item.price),
        calories: Number(item.calories),
        preparation_time: Number(item.preparation_time),
        is_available: Boolean(item.is_available),
        is_special: Boolean(item.is_special),
        is_combo: Boolean(item.is_combo),
        average_rating: Number(Number(item.average_rating).toFixed(1)),
        review_count: Number(item.review_count),
        reviews
      }
    });
  } catch (err) {
    console.error('getItemById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch item details.' });
  }
}

/**
 * Get all categories
 */
async function getCategories(req, res) {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY id ASC');
    return res.status(200).json({ success: true, data: categories });
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
}

/**
 * Create a new category (Admin only)
 */
async function createCategory(req, res) {
  try {
    const { name, description, icon } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [resInsert] = await db.query(
      'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)',
      [name.trim(), description || null, icon || 'Utensils']
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: { id: resInsert.insertId, name: name.trim(), description, icon }
    });
  } catch (err) {
    console.error('createCategory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
}

/**
 * Create a new menu item (Admin only)
 */
async function createMenuItem(req, res) {
  try {
    const {
      shop_id, category_id, name, description, price, calories,
      image_url, preparation_time, is_available, is_special, is_combo
    } = req.body;

    const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

    const [resInsert] = await db.query(
      `INSERT INTO menu_items (shop_id, category_id, name, description, price, calories, image_url, preparation_time, is_available, is_special, is_combo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shop_id || 1,
        category_id,
        name.trim(),
        description || '',
        price,
        calories,
        image_url && image_url.trim() !== '' ? image_url.trim() : defaultImg,
        preparation_time,
        is_available !== undefined ? (is_available ? 1 : 0) : 1,
        is_special ? 1 : 0,
        is_combo ? 1 : 0
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      item_id: resInsert.insertId
    });
  } catch (err) {
    console.error('createMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create menu item.' });
  }
}

/**
 * Update an existing menu item (Admin only)
 */
async function updateMenuItem(req, res) {
  try {
    const { id } = req.params;
    const {
      shop_id, category_id, name, description, price, calories,
      image_url, preparation_time, is_available, is_special, is_combo
    } = req.body;

    await db.query(
      `UPDATE menu_items
       SET shop_id = COALESCE(?, shop_id),
           category_id = COALESCE(?, category_id),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           calories = COALESCE(?, calories),
           image_url = COALESCE(?, image_url),
           preparation_time = COALESCE(?, preparation_time),
           is_available = COALESCE(?, is_available),
           is_special = COALESCE(?, is_special),
           is_combo = COALESCE(?, is_combo)
       WHERE id = ?`,
      [
        shop_id || null,
        category_id || null,
        name ? name.trim() : null,
        description !== undefined ? description : null,
        price !== undefined ? price : null,
        calories !== undefined ? calories : null,
        image_url ? image_url.trim() : null,
        preparation_time !== undefined ? preparation_time : null,
        is_available !== undefined ? (is_available ? 1 : 0) : null,
        is_special !== undefined ? (is_special ? 1 : 0) : null,
        is_combo !== undefined ? (is_combo ? 1 : 0) : null,
        id
      ]
    );

    return res.status(200).json({ success: true, message: 'Menu item updated successfully.' });
  } catch (err) {
    console.error('updateMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update menu item.' });
  }
}

/**
 * Delete a menu item (Admin only)
 */
async function deleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM menu_items WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Menu item deleted successfully.' });
  } catch (err) {
    console.error('deleteMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete menu item.' });
  }
}

/**
 * Quick toggle availability (Admin or Kitchen Staff)
 */
async function toggleAvailability(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT is_available FROM menu_items WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const newStatus = rows[0].is_available ? 0 : 1;
    await db.query('UPDATE menu_items SET is_available = ? WHERE id = ?', [newStatus, id]);

    return res.status(200).json({
      success: true,
      message: `Item marked as ${newStatus ? 'Available' : 'Unavailable'}.`,
      is_available: Boolean(newStatus)
    });
  } catch (err) {
    console.error('toggleAvailability error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle availability.' });
  }
}

/**
 * Get Pickup Slots
 */
async function getPickupSlots(req, res) {
  try {
    const [slots] = await db.query('SELECT * FROM pickup_slots WHERE is_active = 1 ORDER BY id ASC');
    return res.status(200).json({ success: true, data: slots });
  } catch (err) {
    console.error('getPickupSlots error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pickup slots.' });
  }
}

module.exports = {
  getShops,
  getAllItems,
  getItemById,
  getCategories,
  createCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getPickupSlots
};
