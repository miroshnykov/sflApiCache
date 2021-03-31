const mysql = require('serverless-mysql')()
let mysqlAdcenterDb
const config = require('plain-config')()
module.exports = {

    get: () => {
        if (!mysqlAdcenterDb) {
            console.log(`\n\x1b[35mFirst init adcenter DB  \x1b[0m`)
            const {host, database, user, password, port} = config.mysql
            // console.log(`host:{ ${host} },user:{ ${user} },database:{ ${database} }`)
            let mysqlConfig = {
                host: host,
                database: database,
                user: user,
                password: password,
                port: port
            }
            console.log(mysqlConfig)
            mysql.config(mysqlConfig)
            mysqlAdcenterDb = mysql
        }
        // console.log(' << get singleton DB >>')
        return mysqlAdcenterDb
    }
}
