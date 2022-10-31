const express = require('express')
const { requireAuth } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const { addOrder, getOrders, updateOrder } = require('./order.controller')
const router = express.Router()

// middleware that is specific to this router

router.get('/', log, getOrders)

router.use(requireAuth)

router.post('/', requireAuth, addOrder)
router.put('/:id', requireAuth, updateOrder)

module.exports = router
