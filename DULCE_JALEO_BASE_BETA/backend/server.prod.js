const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);
const webhookRoutes = require('./routes/webhooks');
app.use('/webhook', webhookRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'dulce-jaleo-backend', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => { console.log('Backend running on port ' + PORT); });
