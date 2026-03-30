// controllers/mentorController.js
// Admin adds/edits mentors; public can read them

const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

// ── GET /api/mentors — list all active mentors ──────
async function getAllMentors(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, specialty, bio, avatar_url, contact_info, created_at
       FROM mentors
       WHERE is_active = TRUE
       ORDER BY created_at DESC`
    );
    return res.status(200).json({ success: true, count: rows.length, mentors: rows });
  } catch (err) {
    console.error('getAllMentors error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── GET /api/mentors/:id ─────────────────────────────
async function getMentorById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.name, m.email, m.specialty, m.bio, m.avatar_url, m.contact_info,
              m.created_at,
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT('id', w.id, 'title', w.title, 'date', w.date, 'status', w.status)
                ) FILTER (WHERE w.id IS NOT NULL),
                '[]'
              ) AS workshops
       FROM mentors m
       LEFT JOIN workshops w ON w.mentor_id = m.id
       WHERE m.id = ?
       GROUP BY m.id`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    return res.status(200).json({ success: true, mentor: rows[0] });
  } catch (err) {
    console.error('getMentorById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── POST /api/mentors (admin only) ─────────────────
async function createMentor(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, specialty, bio, contact_info } = req.body;
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [existing] = await pool.query('SELECT id FROM mentors WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A mentor with this email already exists.' });
    }

    const [, result] = await pool.query(
      `INSERT INTO mentors (name, email, specialty, bio, avatar_url, contact_info)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [name, email, specialty, bio || null, avatar_url, contact_info || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Mentor added successfully.',
      mentorId: result.insertId,
    });
  } catch (err) {
    console.error('createMentor error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── PUT /api/mentors/:id (admin only) ───────────────
async function updateMentor(req, res) {
  const { name, email, specialty, bio, contact_info, is_active } = req.body;
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const [existing] = await pool.query('SELECT id FROM mentors WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    const fields = [];
    const values = [];

    if (name !== undefined) fields.push('name = ?'), values.push(name);
    if (email !== undefined) fields.push('email = ?'), values.push(email);
    if (specialty !== undefined) fields.push('specialty = ?'), values.push(specialty);
    if (bio !== undefined) fields.push('bio = ?'), values.push(bio);
    if (contact_info !== undefined) fields.push('contact_info = ?'), values.push(contact_info);
    if (is_active !== undefined) fields.push('is_active = ?'), values.push(is_active);
    if (avatar_url !== undefined) fields.push('avatar_url = ?'), values.push(avatar_url);

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE mentors SET ${fields.join(', ')} WHERE id = ?`, values);

    return res.status(200).json({ success: true, message: 'Mentor updated successfully.' });
  } catch (err) {
    console.error('updateMentor error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// ── DELETE /api/mentors/:id (admin only) ────────────
async function deleteMentor(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM mentors WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }
    return res.status(200).json({ success: true, message: 'Mentor deleted.' });
  } catch (err) {
    console.error('deleteMentor error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = { getAllMentors, getMentorById, createMentor, updateMentor, deleteMentor };