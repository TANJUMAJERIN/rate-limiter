const express = require('express');
//const tokenBucketMiddleware = require('./middleware/tokenBucketMiddleware');
const tokenBucketWithoutRace = require('./middleware/tokenBucketWithoutRace');
const cors = require('cors');

const app = express();
app.use(cors({
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After']
}));
app.use(express.json());

//app.use('/api', tokenBucketMiddleware);
 app.use('/api',tokenBucketWithoutRace)

app.get('/api/request', (req, res) => {
  try {
    res.json({ message: "Request successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
