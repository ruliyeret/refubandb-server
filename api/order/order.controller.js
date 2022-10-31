const logger = require('../../services/logger.service')
const socketService = require('../../services/socket.service')
const orderService = require('./order.service')

async function getOrders(req, res) {
	try {
		var filterBy = {}
		if (req.query.params) filterBy = JSON.parse(req.query.params)
		const orders = await orderService.query(filterBy)
		res.send(orders)
	} catch (err) {
		logger.error('Cannot get orders', err)
		res.status(500).send({ err: 'Failed to get orders' })
	}
}

async function updateOrder(req, res) {
	try {
		const updatedOrder = await orderService.update(req.body)
		socketService.emitToUser({
			type: 'order-updated',
			data: updatedOrder,
			userId: updatedOrder.buyer._id,
		})
		res.send(updatedOrder)
	} catch (err) {
		logger.error('Failed to update order', err)
		res.status(500).send({ err: 'Failed to update order' })
	}
}

async function addOrder(req, res) {
	try {
		const order = await orderService.add(req.body)

		// TODO: notify users when a new order has been made!
		// prepare the updated review for sending out
		// order.byUser = await userService.getById(order.byUserId)
		// order.aboutToy = await stayService.getById(order.aboutToyId)

		// console.log('CTRL SessionId:', req.sessionID)
		// socketService.broadcast({ type: 'review-added', data: order })
		// socketService.emitToAll({
		// 	type: 'toy-updated',
		// 	data: order.aboutToy,
		// 	room: order.aboutToy._id,
		// })
		res.send(order)
	} catch (err) {
		console.log(err)
		logger.error('Failed to add order', err)
		res.status(500).send({ err: 'Failed to add order' })
	}
}

module.exports = {
	getOrders,
	updateOrder,
	addOrder,
}
