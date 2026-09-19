const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createSOS,
  getUserSOS,
  getSOSById,
  updateSOSStatus,
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
} = require('../controllers/sosController');

const router = express.Router();

// All citizen SOS endpoints require valid JWT authentication
router.use(authMiddleware);

// Citizen SOS endpoints
router.post('/', createSOS);
router.get('/', getUserSOS);
router.get('/contacts', getEmergencyContacts);
router.post('/contacts', addEmergencyContact);
router.delete('/contacts/:id', deleteEmergencyContact);

router.get('/:id', getSOSById);
router.patch('/:id/status', updateSOSStatus);
router.put('/:id/resolve', (req, res, next) => {
  req.body = req.body || {};
  req.body.status = 'resolved';
  return updateSOSStatus(req, res, next);
});

module.exports = router;
