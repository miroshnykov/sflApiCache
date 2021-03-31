const config = require('plain-config')()

const asyncRedis = require('async-redis')
const redisClient = asyncRedis.createClient(config.redis.port, 'localhost')
const {currentTime} = require('./helper')

redisClient.on('connect', () => {
    console.log(`\x1b[36m  Redis connected to host localhost port ${config.redis.port} \x1b[0m`)
})

redisClient.on('error', (err) => {
    console.log('\x1b[41m Redis error: ' + err + '\x1b[0m')
})

const setRedis = async (key, value) => (await redisClient.set(key, value))

const getRedis = async (value) => (await redisClient.get(value))

const deleteRedis = async (key) => (await redisClient.del(key))

const setDataCache = async (key, data) => {

    try {
        await setRedis(key, JSON.stringify(data))
        // console.log(`*** Redis SET { ${key} } \n`)

    } catch (err) {
        console.log(`\n*** Something happened, setDataCache, err:`, err)
    }
}

const delDataCache = async (key) => {

    try {
        await deleteRedis(key)
        console.log(`*** Redis DEL { ${key} } \n`)

    } catch (err) {
        console.log(`\n*** Something happened, delDataCache, err:`, err)
    }
}

const getDataCache = async (key) => {

    try {
        let redisData = await getRedis(key)
        let formatData
        if (redisData) {
            formatData = JSON.parse(redisData)

            // console.log(`*** REDIS GET { ${key} } count of records: ${formatData.length}, time ${currentTime()} \n`)
        }
        return formatData

    } catch (err) {
        console.log(`\n*** Something happened, getDataCache err:`, err)
    }
}


module.exports = {
    getDataCache,
    setDataCache,
    delDataCache
}