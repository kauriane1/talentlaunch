// controllers/workshopController.js

const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

// ── GET /api/workshops ───────────────────────────────
async function getAllWorkshops(req, res) {
  try {
    const { status } = req.query; // optional filter: ?status=upcoming

    let sql = `
      SELECT w.id, w.title, w.description, w.date, w.location,
             w.capacity, w.status,
             m.id AS mentor_id, m.name AS mentor_name, m.specialty AS mentor_specialty,
             (SELECT COUNT(*) FROM workshop_enrollments e WHERE e.workshop_id = w.id) AS enrolled_count
      FROM workshops w
      LEFT JOIN mentors m ON m.id = w.mentor_id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE w.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY w.date ASC';

    const [rows] = await pool.query(sql, params);
    return res.status(200).json({ success: true, count: rows.length, workshops: rows });
  } catch (err) {
    console.error('GetAllWorkshops error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── GET /api/workshops/:id ───────────────────────────
async function getWorkshopById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT w.*, m.name AS mentor_name, m.specialty AS mentor_specialty,
              m.avatar_url AS mentor_avatar,
              (SELECT COUNT(*) FROM workshop_enrollments e WHERE e.workshop_id = w.id) AS enrolled_count
       FROM workshops w
       LEFT JOIN mentors m ON m.id = w.mentor_id
       WHERE w.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workshop not found.' });
    }
    return res.status(200).json({ success: true, workshop: rows[0] });
  } catch (err) {
    console.error('GetWorkshopById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── POST /api/workshops  (admin only) ────────────────
async function createWorkshop(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, mentor_id, date, location, capacity } = req.body;

  try {
    const [, result] = await pool.query(
      `INSERT INTO workshops (title, description, mentor_id, date, location, capacity)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [title, description, mentor_id || null, date, location || null, capacity || 30]
    );

    return res.status(201).json({
      success: true,
      message: 'Workshop created successfully.',
      workshopId: result.insertId,
    });
  } catch (err) {
    console.error('CreateWorkshop error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── PUT /api/workshops/:id  (admin only) ─────────────
async function updateWorkshop(req, res) {
  const { title, description, mentor_id, date, location, capacity, status } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM workshops WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Workshop not found.' });
    }

    const fields = [];
    const values = [];

    if (title       !== undefined) { fields.push('title = ?');       values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (mentor_id   !== undefined) { fields.push('mentor_id = ?');   values.push(mentor_id); }
    if (date        !== undefined) { fields.push('date = ?');        values.push(date); }
    if (location    !== undefined) { fields.push('location = ?');    values.push(location); }
    if (capacity    !== undefined) { fields.push('capacity = ?');    values.push(capacity); }
    if (status      !== undefined) { fields.push('status = ?');      values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE workshops SET ${fields.join(', ')} WHERE id = ?`, values);

    return res.status(200).json({ success: true, message: 'Workshop updated.' });
  } catch (err) {
    console.error('UpdateWorkshop error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── DELETE /api/workshops/:id  (admin only) ──────────
async function deleteWorkshop(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM workshops WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Workshop not found.' });
    }
    return res.status(200).json({ success: true, message: 'Workshop deleted.' });
  } catch (err) {
    console.error('DeleteWorkshop error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── POST /api/workshops/:id/enroll  (protected) ──────
async function enrollInWorkshop(req, res) {
  try {
    const workshopId = req.params.id;
    const userId     = req.user.id;

    // Check workshop exists and is not full
    const [ws] = await pool.query(
      `SELECT w.capacity,
              (SELECT COUNT(*) FROM workshop_enrollments e WHERE e.workshop_id = w.id) AS enrolled_count,
              w.status
       FROM workshops w WHERE w.id = ?`,
      [workshopId]
    );

    if (ws.length === 0) {
      return res.status(404).json({ success: false, message: 'Workshop not found.' });
    }

    if (ws[0].status === 'cancelled' || ws[0].status === 'completed') {
      return res.status(400).json({ success: false, message: 'This workshop is no longer accepting enrollments.' });
    }

    if (ws[0].enrolled_count >= ws[0].capacity) {
      return res.status(400).json({ success: false, message: 'Workshop is full.' });
    }

    await pool.query(
      'INSERT INTO workshop_enrollments (user_id, workshop_id) VALUES (?, ?)',
      [userId, workshopId]
    );

    return res.status(201).json({ success: true, message: 'Enrolled successfully!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'You are already enrolled in this workshop.' });
    }
    console.error('EnrollInWorkshop error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── DELETE /api/workshops/:id/enroll  (protected) ────
async function unenrollFromWorkshop(req, res) {
  try {
    const [result] = await pool.query(
      'DELETE FROM workshop_enrollments WHERE user_id = ? AND workshop_id = ?',
      [req.user.id, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    }
    return res.status(200).json({ success: true, message: 'Unenrolled successfully.' });
  } catch (err) {
    console.error('UnenrollFromWorkshop error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── GET /api/workshops/my (protected) — get user's enrolled workshops ─────
async function getMyWorkshops(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT w.id, w.title, w.description, w.date, w.location,
              w.capacity, w.status,
              m.id AS mentor_id, m.name AS mentor_name, m.specialty AS mentor_specialty
       FROM workshops w
       LEFT JOIN mentors m ON m.id = w.mentor_id
       INNER JOIN workshop_enrollments e ON e.workshop_id = w.id AND e.user_id = ?
       ORDER BY w.date ASC`,
      [userId]
    );

    return res.status(200).json({ success: true, count: rows.length, workshops: rows });
  } catch (err) {
    console.error('GetMyWorkshops error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  getAllWorkshops, getWorkshopById, getMyWorkshops,
  createWorkshop, updateWorkshop, deleteWorkshop,
  enrollInWorkshop, unenrollFromWorkshop,
};