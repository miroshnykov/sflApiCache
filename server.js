const express = require('express');
const config = require('plain-config')()
const http = require('http')
const os = require('os')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getFileSize, formatByteSize} = require('./lib/helper')
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

// http://localhost:8092/forceCreateRecipe

const {getRefCodes, getAcProducts, getAffiliateProductProgram} = require('./db/dataDb')
app.get('/forceCreateRecipe', async (req, res, next) => {
    let response = {}
    try {

        let refCodes = await getRefCodes()
        let acProducts = await getAcProducts()
        let affiliateProductProgram = await getAffiliateProductProgram()
        response.refCodes = refCodes
        // response.acProducts = acProducts
        response.affiliateProductProgram = affiliateProductProgram
        // res.send(response)
        // return
        let files = await getLocalFiles(config.recipe.folder)
        console.log('forceCreateRecipeFileDebug:', files)
        console.log('forceCreateRecipeRecipe:', config.recipe)
        response.files = files
        response.configRecipe = config.recipe

        if (files.length === 0) {
            response.noFiles = `no files in folder:${JSON.stringify(config.recipe)} created `
            await createRecipeAffiliateProductProgram()

            await waitFor(5000)

            let files = await getLocalFiles(config.recipe.folder)
            response.filesJustCreated = files

            let size1AffiliateProductProgram = await getFileSize(files[0])// affWebsite
            // response.files1Size = formatByteSize(size1AffWe)
            // response.files2Size = formatByteSize(size2Aff)
            // response.files3Size = formatByteSize(size3Camp)
            // response.files4Size = formatByteSize(size4Offer)
            response.sizeAffiliateProductProgram = size1AffiliateProductProgram

            res.send(response)
            return
        }
        let file1 = files[0]
        if (file1) {
            await deleteFile(file1)
            response.file1Deleted = file1
        }

        await createRecipeAffiliateProductProgram()

        if (file1 ) {
            response.files1 = `${files[0]}`
            response.done = 'recipe created'
        } else {
            response.done = 'files does not exists. but Recipe created first time '
        }

        res.send(response)

    } catch (e) {
        response.err = 'error recipe' + JSON.stringify(e)
        res.send(response)
    }
})


// http://localhost:8092/files
// https://sfl-api-cache-stage1.surge.systems/files
app.get('/files', async (req, res, next) => {
    let response = {}

    try {
        let files = await getLocalFiles(config.recipe.folder)

        if (files.length === 0) {
            response.noFiles = `no files in folder:${JSON.stringify(config.recipe)}`
            res.send(response)
            return
        }

        response.files = files
        response.files1 = files[0]
        response.files2 = files[1]
        response.files3 = files[2]
        let sizeAcProducts = await getFileSize(files[0])
        let sizeAffiliateProductProgram = await getFileSize(files[1])
        let sizeRefCodes = await getFileSize(files[2])
        response.sizeAcProducts = sizeAcProducts
        response.sizeAffiliateProductProgram = sizeAffiliateProductProgram
        response.sizeRefCodes = sizeRefCodes
        response.countsOfClients = clients.length || 0

        const computerName = os.hostname()
        // const cpus = os.cpus()
        // const freemem = os.freemem()
        // const userInfo = os.userInfo()
        // const release = os.release()
        response.computerName = computerName || 0
        // response.cpus = cpus || 0
        // response.freemem = freemem || 0
        // response.userInfo = userInfo || 0
        // response.release = release || 0

        res.send(response)
    } catch (e) {
        response.err = 'error files' + JSON.stringify(e)
        res.send(response)
    }
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


    socket.on('fileSizeInfo', async (fileSizeInfo) => {
        try {
            let fileSizeInfoCache = await getDataCache('fileSizeInfo') || []

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
            io.to(socket.id).emit("fileSizeInfo", fileSizeInfoCache)

        } catch (e) {
            console.log('fileSizeInfoError:', e)
            metrics.influxdb(500, `fileSizeInfoError`)
        }

    })


    if (!clients.includes(socket.id)) {

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            metrics.sendMetricsCountOfClients(clients.length)
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

            // console.log('FILE:',files)
            let file = files[1]
            if (!file) {
                console.log(`no files in folder:${config.recipe.folder}`)
                return
            }
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${file} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileAffiliateProductProgram`)
            });
            ss(socket).emit('sendingAffiliateProductProgram', stream);
            fs.createReadStream(file).pipe(stream);

        } catch (e) {
            console.log('sendFileAffiliateProductProgramError:', e)
            metrics.influxdb(500, `sendFileAffiliateProductProgramError`)
        }

    })

    // acProductsData
    socket.on('sendingAcProducts', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)

            // console.log('FILE:',files)
            let file = files[0]
            if (!file) {
                console.log(`no files in folder:${config.recipe.folder}`)
                return
            }
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${file} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFileAcProducts`)
            });
            ss(socket).emit('sendingAcProducts', stream);
            fs.createReadStream(file).pipe(stream);

        } catch (e) {
            console.log('sendFileAcProductsError:', e)
            metrics.influxdb(500, `sendFileAcProductsError`)
        }

    })

// refCodesData
    socket.on('sendingRefCodes', async () => {

        try {
            let files = await getLocalFiles(config.recipe.folder)

            // console.log('FILE:',files)
            let file = files[2]
            if (!file) {
                console.log(`no files in folder:${config.recipe.folder}`)
                return
            }
            let stream = ss.createStream();
            stream.on('end', () => {
                console.log(`file:${file} sent to soket ID:${socket.id}`);
                metrics.influxdb(200, `sendFilesRefCodes`)
            });
            ss(socket).emit('sendingRefCodes', stream);
            fs.createReadStream(file).pipe(stream);

        } catch (e) {
            console.log('sendFilesRefCodesError:', e)
            metrics.influxdb(500, `sendFilesRefCodesError`)
        }

    })

    socket.on('disconnect', () => {
        // clients.splice(clients.indexOf(socket.id, 1))
        // metrics.sendMetricsCountOfClients(clients.length)

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
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port},  Using node ${process.version}, env:${config.env} \x1b[0m \n`)
})

const {
    setFileSizeInfo,
    setRecipeFilesAffiliateProductProgram,
    setRecipeFilesAcProducts,
    setRecipeFilesRefCodes,
} = require(`./crons/recipes`)


setInterval(setFileSizeInfo, 900000) // 900000 -> 15 min
setTimeout(setFileSizeInfo, 60000) // 60000 -> 1 min


setInterval(setRecipeFilesAffiliateProductProgram, 2472000) // 2472000 -> 41.2 min
setTimeout(setRecipeFilesAffiliateProductProgram, 60000) // 60000 -> 1 min

setInterval(setRecipeFilesAcProducts, 2712000) // 2712000 -> 45.2 min
setTimeout(setRecipeFilesAcProducts, 120000) // 120000 -> 2 min

setInterval(setRecipeFilesRefCodes, 3012000) // 3012000 -> 50.2 min
setTimeout(setRecipeFilesRefCodes, 180000) // 180000 -> 3 min



const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
