const dbService = require('../../services/db.service')
const ObjectId = require('mongodb').ObjectId
const asyncLocalStorage = require('../../services/als.service')
const logger = require('../../services/logger.service')
const socketService = require('../../services/socket.service')

async function query(filterBy = {}) {
	try {
		filterBy = {
			name: '',
			status: '',
		}
		// filterBy = JSON.parse(filterBy)
		const criteria = _buildCriteria(filterBy)
		const collection = await dbService.getCollection('order')
		return await collection.find(criteria).toArray()
	} catch (err) {
		logger.error('cannot find reviews', err)
		throw err
	}
}

async function getById(orderId) {
	try {
		const collection = await dbService.getCollection('order')
		return await collection.findOne({ _id: ObjectId(orderId) })
	} catch (err) {
		logger.error(`while finding order ${orderId}`, err)
		throw err
	}
}

async function update(order) {
	try {
		// pick only updatable fields!
		const orderToSave = {
			_id: ObjectId(order._id),
			host: order.host,
			createdAt: order.createdAt,
			buyer: order.buyer,
			total: order.total,
			startDate: order.startDate,
			endDate: order.endDate,
			guests: order.guests,
			stay: order.stay,
			status: order.status,
		}
		const collection = await dbService.getCollection('order')
		await collection.updateOne({ _id: orderToSave._id }, { $set: orderToSave })
		return orderToSave
	} catch (err) {
		logger.error(`cannot update order ${order._id}`, err)
		throw err
	}
}

// async function remove(orderId) {
// 	try {
// 		const store = asyncLocalStorage.getStore()
// 		const { userId } = store
// 		const collection = await dbService.getCollection('order')
// 		// remove only if user is owner/admin
// 		const query = { _id: ObjectId(orderId) }
// 		query.buyer._id = ObjectId(userId)
// 		await collection.deleteOne(query)
// 	} catch (err) {
// 		logger.error(`cannot remove order ${orderId}`, err)
// 		throw err
// 	}
// }

async function add(order) {
	try {
		// peek only updatable fields!
		const orderToAdd = {
			host: order.host,
			createdAt: order.createdAt || Date.now(),
			buyer: order.buyer,
			total: order.total,
			startDate: order.startDate,
			endDate: order.endDate,
			guests: order.guests,
			stay: order.stay,
			status: order.status || 'pending',
		}
		const collection = await dbService.getCollection('order')
		await collection.insertOne(orderToAdd)
		socketService.emitTo({
			type: 'order-added',
			data: orderToAdd,
		})
		return orderToAdd
	} catch (err) {
		logger.error('cannot insert order', err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	const criteria = {}
	if (filterBy.name) {
		const txtCriteria = { $regex: filterBy.name, $options: 'i' }
		criteria.$or = [
			{
				name: txtCriteria,
			},
		]
	}
	if (filterBy.status) {
		if (!filterBy.status) {
			filterBy.status = ['pending', 'rejected', 'approved']
		} else {
			filterBy.status = [filterBy.status]
		}
		criteria.status = { $in: filterBy.status }
	}
	return criteria
}

module.exports = {
	query,
	update,
	add,
}
