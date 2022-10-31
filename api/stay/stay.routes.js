const express = require('express')
const { requireAuth } = require('../../middlewares/requireAuth.middleware')
const { getStay, getStays, deleteStay, updateStay } = require('./stay.controller')
const router = express.Router()

router.get('/', getStays)
router.get('/:id', getStay)

// middleware that is specific to this router
router.use(requireAuth)

router.post('/', requireAuth, updateStay)
router.put('/:id', requireAuth, updateStay)
router.delete('/:id', requireAuth, deleteStay)

module.exports = router
