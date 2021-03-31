let config = {};

config.port = 8092

config.env = process.env.NODE_ENV || `production`

config.mysql = {
    host: '',
    user: '',
    port: 3306,
    password: '',
    database: ''
}


config.redis = {
    host: '',
    port: 6379
}

config.recipe = {
    folder: '/tmp/recipe_sfl_api/'
}

config.influxdb = {
    host: 'https://influx.surge.systems/influxdb',
    project: 'sfl-api-cache',
    intervalRequest: 10, // batch post to influxdb when queue length gte 100
    intervalSystem: 30000, // 30000 ms = 30 s
    intervalDisk: 60000 // 300000 ms = 5 min
}


module.exports = config;