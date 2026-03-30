// controllers/talentController.js

const { pool } = require('../config/db');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// ── GET /api/talents  — public feed ─────────────────
async function getAllTalents(req, res) {
  try {
    const { category, user_id } = req.query;

    let sql = `
      SELECT t.id, t.title, t.description, t.category,
             t.file_url, t.file_type, t.views, t.created_at,
             u.id AS user_id, u.name AS author_name, u.avatar_url AS author_avatar
      FROM talents t
      JOIN users u ON u.id = t.user_id
    `;
    const params = [];
    const conditions = [];

    if (category) { conditions.push('t.category = ?'); params.push(category); }
    if (user_id)  { conditions.push('t.user_id = ?');  params.push(user_id); }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.query(sql, params);
    return res.status(200).json({ success: true, count: rows.length, talents: rows });
  } catch (err) {
    console.error('GetAllTalents error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── GET /api/talents/:id ─────────────────────────────
async function getTalentById(req, res) {
  try {
    // Increment view count
    await pool.query('UPDATE talents SET views = views + 1 WHERE id = ?', [req.params.id]);

    const [rows] = await pool.query(
      `SELECT t.*, u.name AS author_name, u.avatar_url AS author_avatar, u.location AS author_location
       FROM talents t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }
    return res.status(200).json({ success: true, talent: rows[0] });
  } catch (err) {
    console.error('GetTalentById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── POST /api/talents  (protected) ──────────────────
async function createTalent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, category } = req.body;
  const file_url  = req.file ? `/uploads/${req.file.filename}` : null;
  const file_type = req.file ? req.file.mimetype : null;

  try {
    const [, result] = await pool.query(
      `INSERT INTO talents (user_id, title, description, category, file_url, file_type)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [req.user.id, title, description, category, file_url, file_type]
    );

    return res.status(201).json({
      success: true,
      message: 'Talent uploaded successfully!',
      talentId: result.insertId,
    });
  } catch (err) {
    console.error('CreateTalent error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── PUT /api/talents/:id  (owner only) ───────────────
async function updateTalent(req, res) {
  try {
    const [rows] = await pool.query('SELECT user_id FROM talents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised to edit this talent.' });
    }

    const { title, description, category } = req.body;
    const fields = [];
    const values = [];

    if (title       !== undefined) { fields.push('title = ?');       values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (category    !== undefined) { fields.push('category = ?');    values.push(category); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE talents SET ${fields.join(', ')} WHERE id = ?`, values);

    return res.status(200).json({ success: true, message: 'Talent updated.' });
  } catch (err) {
    console.error('UpdateTalent error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── DELETE /api/talents/:id  (owner or admin) ────────
async function deleteTalent(req, res) {
  try {
    const [rows] = await pool.query('SELECT user_id, file_url FROM talents WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Talent not found.' });
    }
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this talent.' });
    }

    // Delete the uploaded file from disk
    if (rows[0].file_url) {
      const filePath = path.join(__dirname, '..', rows[0].file_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM talents WHERE id = ?', [req.params.id]);
    return res.status(200).json({ success: true, message: 'Talent deleted.' });
  } catch (err) {
    console.error('DeleteTalent error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { getAllTalents, getTalentById, createTalent, updateTalent, deleteTalent };