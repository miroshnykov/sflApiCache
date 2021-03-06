const express = require('express');
const config = require('plain-config')()
const http = require('http')
const os = require('os')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getFileSize, formatByteSize, parseFiles} = require('./lib/helper')
const {
    getLocalFiles
} = require('./lib/zipRecipe')

const {getDataCache, setDataCache} = require('./lib/redis')


const {
    createRecipeAffiliateProductProgram,
    // createRecipeSegments
} = require('./recipe/buildfiles')
const {deleteFile} = require('./lib/zipRecipe')

const metrics = require('./lib/metrics')

const LIMIT_CLIENTS = 60
let clients = []
const ss = require('socket.io-stream')
const fs = require('fs')

app.get('/health', (req, res, next) => {
    res.send('Ok')
})

const {
    setFileSizeInfo,
    setRecipeFilesAffiliateProductProgram,
    setRecipeFilesAcProducts,
    setRecipeFilesRefCodes,
} = require(`./crons/recipes`)


// http://localhost:8092/forceCreateRecipeAffiliateProductProgram
// https://sfl-api-cache-stage1.surge.systems/forceCreateRecipeAffiliateProductProgram

app.get('/forceCreateRecipeAffiliateProductProgram', async (req, res, next) => {
    let response = {}
    try {
        let timeMs = 9000
        setTimeout(setRecipeFilesAffiliateProductProgram, timeMs)
        response.run = `addedToQueSetRecipeFilesAffiliateProductProgram-time-${timeMs}`
        res.send(response)
    } catch (e) {
        response.err = 'error recipe' + JSON.stringify(e)
        res.send(response)
    }
})

// http://localhost:8092/forceCreateRecipeAcProducts
// https://sfl-api-cache-stage1.surge.systems/forceCreateRecipeAcProducts
app.get('/forceCreateRecipeAcProducts', async (req, res, next) => {
    let response = {}
    try {
        let timeMs = 9000
        setTimeout(setRecipeFilesAcProducts, timeMs)
        response.run = `addedToQueSetRecipeFilesAcProducts-time-${timeMs}`
        res.send(response)
    } catch (e) {
        response.err = 'error recipe' + JSON.stringify(e)
        res.send(response)
    }
})

// http://localhost:8092/forceCreateRecipeRefCodes
// https://sfl-api-cache-stage1.surge.systems/forceCreateRecipeRefCodes
app.get('/forceCreateRecipeRefCodes', async (req, res, next) => {
    let response = {}
    try {
        let timeMs = 9000
        setTimeout(setRecipeFilesRefCodes, timeMs)
        response.run = `addedToQueSetRecipeFilesRefCodes-time-${timeMs}`
        res.send(response)
    } catch (e) {
        response.err = 'error recipe' + JSON.stringify(e)
        res.send(response)
    }
})


// http://localhost:8092/files
// https://sfl-api-cache-stage1.surge.systems/files
// https://sfl-api-cache.surge.systems/files
app.get('/files', async (req, res, next) => {
    let resp = await checkFilesExists()
    res.send(resp)

})


app.get('/fileSizeInfo', async (req, res, next) => {

    let response = {}
    try {
        let fileSizeInfoCache = await getDataCache('fileSizeInfo') || []

        response.fileSizeInfoCache = fileSizeInfoCache
        res.send(response)
    } catch (e) {
        response.err = 'error fileSizeInfoCache' + JSON.stringify(e)
        console.log(e)
        res.send(response)
    }
})


io.on('connection', async (socket) => {


    socket.on('filesSizeRefCodes', async (fileSizeInfo) => {
        try {
            let fileSizeInfoCache = await getDataCache('filesSizeRefCodes') || []

            console.log(`FileSizeInfoCache:${JSON.stringify(fileSizeInfoCache)}`)
            if (fileSizeInfoCache.length === 0) {
                console.log('FileSizeInfoCache recipeCache is NULL')
                return
            }
            if (JSON.stringify(fileSizeInfoCache) === JSON.stringify(fileSizeInfo)) {
                console.log(` --- FileSize the same  don't need to send   { ${socket.id} } `)
                return
            }

            console.log(`FileSize is different, send to socket id { ${socket.id} }, fileSizeInfoCache:{ ${JSON.stringify(fileSizeInfoCache)} }`)
            io.to(socket.id).emit("filesSizeRefCodes", fileSizeInfoCache)

        } catch (e) {
            console.log('fileSizeInfoError:', e)
            metrics.influxdb(500, `fileSizeInfoError`)
        }

    })


    if (!clients.includes(socket.id)) {

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            // metrics.sendMetricsCountOfClients(clients.length)
            // metrics.influxdb(200, `countOfClients-${clients.length}`)
            console.log(`New client just connected: ${socket.id} clientCount:${clients.length} `)
        } else {
            console.log(`Clients more then ${LIMIT_CLIENTS}`)
            metrics.influxdb(500, `clientsMoreThen60Error`)
        }
    }

    socket.on('sendingAffiliateProductProgram', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)
            let filesInfo = parseFiles(files)
            // console.log('filesInfo:', filesInfo)
            if (filesInfo.affiliateProductProgramData.length === 0) {
                console.log(`no file AffiliateProductProgram in folder:${config.recipe.folder}`)
                return
            }
            let affiliateProductProgramFile = filesInfo.affiliateProductProgramData[0].file

            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${affiliateProductProgramFile} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileAffiliateProductProgram`)
            });
            ss(socket).emit('sendingAffiliateProductProgram', stream);
            fs.createReadStream(affiliateProductProgramFile).pipe(stream);

        } catch (e) {
            console.log('sendFileAffiliateProductProgramError:', e)
            metrics.influxdb(500, `sendFileAffiliateProductProgramError`)
        }

    })

    socket.on('sendingAcProducts', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)
            let filesInfo = parseFiles(files)
            // console.log('filesInfo:', filesInfo)
            if (filesInfo.acProductsData.length === 0) {
                console.log(`no file AcProducts in folder:${config.recipe.folder}`)
                return
            }
            let acProductsDataFile = filesInfo.acProductsData[0].file
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${acProductsDataFile} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileAcProducts`)
            });
            ss(socket).emit('sendingAcProducts', stream);
            fs.createReadStream(acProductsDataFile).pipe(stream);

        } catch (e) {
            console.log('sendFileAcProductsError:', e)
            metrics.influxdb(500, `sendFileAcProductsError`)
        }

    })

    socket.on('sendingRefCodes', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)

            let filesInfo = parseFiles(files)
            // console.log('filesInfo:', filesInfo)
            if (filesInfo.refCodesData.length === 0) {
                console.log(`no file refCodesData in folder:${config.recipe.folder}`)
                return
            }
            let refCodesDataFile = filesInfo.refCodesData[0].file
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${refCodesDataFile} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFilesRefCodes`)
            });
            ss(socket).emit('sendingRefCodes', stream);
            fs.createReadStream(refCodesDataFile).pipe(stream);

        } catch (e) {
            console.log('sendFilesRefCodesError:', e)
            metrics.influxdb(500, `sendFilesRefCodesError`)
        }

    })

    socket.on('disconnect', () => {
        clients.splice(clients.indexOf(socket.id, 1))
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
        // clearInterval(updRedis[socket.id])
        // console.log(`disconnect clients:`, clients);
        // metrics.influxdb(200, `disconnect`)
    })
})

io.on('connect', async (socket) => {
    // console.log(`Connect ${socket.id}, Clients: ${JSON.stringify(clients)} `);
    console.log(`Count of clients: ${clients.length} limit ${LIMIT_CLIENTS}`)
    // metrics.influxdb(200, `clientsCount-${clients.length}`)
})

server.listen({port: config.port}, () => {
    // metrics.influxdb(200, `serveReady`)
    // console.log(JSON.stringify(config))
    console.log(`\n????\x1b[35m Server ready at http://localhost:${config.port},  Using node ${process.version}, env:${config.env} \x1b[0m \n`)
})


const checkFilesExists = async () => {
    let response = {}
    try {

        let files = await getLocalFiles(config.recipe.folder)

        if (files.length === 0) {
            response.noFiles = `no files in folder:${JSON.stringify(config.recipe)}`
            metrics.influxdb(200, `FileDoesNotExistsNoFiles`)
            return response
        }
        let filesInfo = parseFiles(files)
        response.files = files

        let refCodeInfo = []
        let affiliateProductProgramInfo = []
        let acProductsInfo = []
        for (const refCodeFile of filesInfo.refCodesData) {
            let sizerefCodeFileSize = await getFileSize(refCodeFile.file)

            refCodeInfo.push(
                {
                    index: refCodeFile.index,
                    file: refCodeFile.file,
                    size: sizerefCodeFileSize
                })
        }

        for (const affiliateProductProgram of filesInfo.affiliateProductProgramData) {
            let sizeAffiliateProductProgram = await getFileSize(affiliateProductProgram.file)

            affiliateProductProgramInfo.push(
                {
                    index: affiliateProductProgram.index,
                    file: affiliateProductProgram.file,
                    size: sizeAffiliateProductProgram
                })
        }

        for (const acProducts of filesInfo.acProductsData) {
            let sizeAcProducts = await getFileSize(acProducts.file)
            acProductsInfo.push(
                {
                    index: acProducts.index,
                    file: acProducts.file,
                    size: sizeAcProducts
                })
        }

        response.refCodeInfo = refCodeInfo
        response.affiliateProductProgramInfo = affiliateProductProgramInfo
        response.acProductsInfo = acProductsInfo

        if (refCodeInfo.length === 0) {
            metrics.influxdb(200, `FileDoesNotExistsRefCodeInfo`)
        } else {
            metrics.influxdb(200, `FileOnSflApiCacheRefCodeInfoSize-${refCodeInfo[0].size}`)
        }

        if (affiliateProductProgramInfo.length === 0) {
            metrics.influxdb(200, `FileDoesNotExistsAffiliateProductProgramInfo`)
        } else {
            metrics.influxdb(200, `FileOnSflApiCacheAffiliateProductProgramInfoSize-${affiliateProductProgramInfo[0].size}`)
        }

        if (acProductsInfo.length === 0) {
            metrics.influxdb(200, `FileDoesNotExistsAcProductsInfo`)
        } else {
            metrics.influxdb(200, `FileOnSflApiCacheAcProductsInfoSize-${acProductsInfo[0].size}`)
        }
        const computerName = os.hostname()
        response.computerName = computerName || 0

        return response
    } catch (e) {
        response.err = 'error files' + JSON.stringify(e)
        metrics.influxdb(200, `FileExistsOnSflApiCacheNoFiles`)
        return response
    }
}
setInterval(setFileSizeInfo, 900000) // 900000 -> 15 min
setTimeout(setFileSizeInfo, 240000) // 240000 -> 4 min

setInterval(setRecipeFilesAffiliateProductProgram, 2472000) // 2472000 -> 41.2 min
// setInterval(setRecipeFilesAffiliateProductProgram, 11000000) // 11000000 -> 3.05 h
setTimeout(setRecipeFilesAffiliateProductProgram, 60000) // 60000 -> 1 min

setInterval(setRecipeFilesAcProducts, 2712000) // 2712000 -> 45.2 min
setTimeout(setRecipeFilesAcProducts, 120000) // 120000 -> 2 min

setInterval(setRecipeFilesRefCodes, 3012000) // 3012000 -> 50.2 min
setTimeout(setRecipeFilesRefCodes, 180000) // 180000 -> 3 min


setInterval(checkFilesExists, 600000) // 600000 -> 10 min

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
