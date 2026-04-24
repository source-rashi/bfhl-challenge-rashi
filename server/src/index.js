const express     = require('express');
const cors        = require('cors');
const processData = require('./processor');

const app = express();
app.use(cors());          // allow all origins
app.use(express.json());  // parse JSON body

// ─────────────────────────────────────────
// POST /bfhl
// ─────────────────────────────────────────
app.post('/bfhl', (req, res) => {
  const { data } = req.body;

  // Guard: data must be a non-empty array
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'data must be a non-empty array' });
  }

  const result = processData(data);

  return res.status(200).json({
    user_id:             'rashida_24042026',
    email_id:            'rashida@college.edu',
    college_roll_number: 'ROLLNUMBER123',
    hierarchies:         result.hierarchies,
    invalid_entries:     result.invalid_entries,
    duplicate_edges:     result.duplicate_edges,
    summary:             result.summary,
  });
});

// ─────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
