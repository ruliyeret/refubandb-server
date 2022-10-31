const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
	query,
	getById,
	getByStayName,
	remove,
	update,
	add,
	addChatMsg,
}

async function query(
	filterBy = {
		price: '[0, 1500]',
		types: '[]',
		amenities: '[]',
		city: '',
	}
) {
	if (filterBy) filterBy = JSON.parse(JSON.stringify(filterBy))
	const criteria = _buildCriteria(filterBy)
	try {
		const collection = await dbService.getCollection('stay')
		return await collection.find(criteria).toArray()
	} catch (err) {
		logger.error('cannot find stays', err)
		throw err
	}
}

async function getById(stayId) {
	try {
		const collection = await dbService.getCollection('stay')
		return await collection.findOne({ _id: ObjectId(stayId) })
	} catch (err) {
		logger.error(`while finding stay ${stayId}`, err)
		throw err
	}
}

async function getByStayName(stayName) {
	try {
		const collection = await dbService.getCollection('stay')
		const stay = await collection.findOne({ stayName })
		return stay
	} catch (err) {
		logger.error(`while finding stay ${stayName}`, err)
		throw err
	}
}

async function remove(stayId) {
	try {
		const collection = await dbService.getCollection('stay')
		await collection.deleteOne({ _id: ObjectId(stayId) })
	} catch (err) {
		logger.error(`cannot remove stay ${stayId}`, err)
		throw err
	}
}

async function update(stay) {
	try {
		// pick only updatable fields!
		const stayToSave = {
			_id: ObjectId(stay._id),
			name: stay.name,
			price: stay.price,
			host: stay.host,
			summary: stay.summary,
			imgUrls: stay.imgUrls,
			propertyType: stay.propertyType,
			accommodates: stay.accommodates,
			amenities: stay.amenities || [],
			loc: stay.loc,
			reviews: stay.reviews,
			chatMsgs: stay.chatMsgs,
			wishlistedBy: stay.wishlistedBy,
		}
		const collection = await dbService.getCollection('stay')
		await collection.updateOne({ _id: stayToSave._id }, { $set: stayToSave })
		return stayToSave
	} catch (err) {
		logger.error(`cannot update stay ${stay._id}`, err)
		throw err
	}
}

async function add(stay) {
	try {
		// pick only updatable fields!
		const stayToAdd = {
			name: stay.name,
			price: stay.price,
			host: stay.host,
			summary: stay.summary || '',
			imgUrls: stay.imgUrls,
			propertyType: stay.propertyType || 'Apartment',
			accommodates: stay.accommodates || 2,
			amenities: stay.amenities || [],
			loc: stay.loc,
			reviews: stay.reviews || [],
			chatMsgs: stay.chatMsgs || [],
			wishlistedBy: stay.wishlistedBy || [],
		}
		const collection = await dbService.getCollection('stay')
		await collection.insertOne(stayToAdd)
		return stayToAdd
	} catch (err) {
		logger.error('cannot insert stay', err)
		throw err
	}
}

async function addChatMsg(msg, stayId) {
	try {
		const collection = await dbService.getCollection('stay')
		await collection.updateOne({ _id: ObjectId(stayId) }, { $push: { chatMsgs: msg } })

		return msg
	} catch (err) {
		logger.error('cannot add chat msg', err)
		throw err
	}
}

function _buildCriteria(filterBy) {
	filterBy.price[0] = +filterBy.price[0]
	filterBy.price[1] = +filterBy.price[1]
	const criteria = {}
	if (filterBy.name) {
		const txtCriteria = { $regex: filterBy.name, $options: 'i' }
		criteria.$or = [
			{
				name: txtCriteria,
			},
		]
	}
	if (filterBy.types && filterBy.types.length) {
		criteria.propertyType = { $in: filterBy.types }
	}
	if (filterBy.price && filterBy.price.length) {
		criteria.price = { $gte: filterBy.price[0], $lte: filterBy.price[1] }
	}
	if (filterBy.amenities && filterBy.amenities.length) {
		criteria['amenities.txt'] = { $all: filterBy.amenities }
	}
	if (filterBy.city) {
		const cityCriteria = { $regex: filterBy.city, $options: 'i' }
		criteria['loc.address'] = cityCriteria
	}
	return criteria
}
