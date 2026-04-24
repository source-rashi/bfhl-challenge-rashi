const express = require('express');
const cors = require('cors');
const evaluateData = require('./processor');

const server = express();

// Enable CORS as requested by evaluator
server.use(cors());

// Parse JSON payload
server.use(express.json());

// Main BFHL endpoint
server.post('/bfhl', (request, response) => {
  const payload = request.body.data;

  // Validation
  if (!payload || !Array.isArray(payload)) {
    return response.status(400).json({ error: 'data must be a non-empty array' });
  }

  // Process tree logic (responds in under 3 secs easily for 50 nodes)
  const processed = evaluateData(payload);

  // Return formatted JSON
  return response.status(200).json({
    user_id:             'rashi_agrawal_08092005',
    email_id:            'rashi_agrawal@srmap.edu.in',
    college_roll_number: 'AP23110010155',
    ...processed
  });
});

const APP_PORT = process.env.PORT || 3001;
server.listen(APP_PORT, () => console.log(`API Listening on port ${APP_PORT}`));
