const {
    createRecipeAffiliateProductProgram,
    createRecipeAcProducts,
    createRecipeRefCodes,
} = require('../recipe/buildfiles')

const {deleteFile} = require('../lib/zipRecipe')

const config = require('plain-config')()

const os = require('os')
const {getFileSize, formatByteSize} = require('../lib/helper')

const {getDataCache, setDataCache} = require('../lib/redis')
const {
    getLocalFiles
} = require('../lib/zipRecipe')
const metrics = require('../lib/metrics')

const setFileSizeInfo = async () => {

    console.log('setFileSizeInfo')
    // if (config.env === 'development' || config.env === 'staging') return
    try {
        let files = await getLocalFiles(config.recipe.folder)
        const computerName = os.hostname()
        console.log(`getLocalFilesDebug for computerName:${computerName}, files:${JSON.stringify(files)}`)
        if (files.length === 0) {
            console.log(`I am not able to get the Size of recipe,  No files in folder ${config.recipe.folder}`)
            metrics.influxdb(500, `fileSizeAllRecipeNotExists`)
            return
        }
        let file1 = files[0] // acProductsData
        let file2 = files[1] //affiliateProductProgram
        let file3 = files[2]//refCodesData
        let fileSizeAcProductsData
        let fileSizeAffiliateProductProgram
        let fileSizeRefCodesData


        if (file1) {
            fileSizeAcProductsData = await getFileSize(file1) || 0
        } else {
            metrics.influxdb(500, `fileSizeacProductsDataNotExists-${computerName}`)
        }

        if (file2) {
            fileSizeAffiliateProductProgram = await getFileSize(file2) || 0
        } else {
            metrics.influxdb(500, `fileSizeAffilaitesNotExists-${computerName}`)
        }


        if (file3) {
            fileSizeRefCodesData = await getFileSize(file3) || 0
        } else {
            metrics.influxdb(500, `fileSizeRefCodesDataNotExists-${computerName}`)
        }


        console.log(`File size for computerName:${computerName}  
                    fileSizeAcProductsData:${fileSizeAcProductsData}, 
                    fileSizeAffiliateProductProgram:${fileSizeAffiliateProductProgram},  
                    fileSizeRefCodesData:${fileSizeRefCodesData}`
        )

        let fileSizeInfo = {}

        if (fileSizeAcProductsData) {
            fileSizeInfo.acProductsData = Number(fileSizeAcProductsData)
        }
        if (fileSizeAffiliateProductProgram) {
            fileSizeInfo.affiliateProductProgram = Number(fileSizeAffiliateProductProgram)
        }

        if (fileSizeRefCodesData) {
            fileSizeInfo.refCodesData = Number(fileSizeRefCodesData)
        }

        console.log(`Set fileSizeRefCode:${JSON.stringify(fileSizeInfo)}`)
        await setDataCache(`fileSizeRefCode`, fileSizeInfo)

        // metrics.sendMetricsSystem(fileSizeInfo, 0)

    } catch (e) {
        console.log('getFilesSizeError:', e)
        metrics.influxdb(500, `getFilesSizeError'`)
    }

}

const setRecipeFilesAffiliateProductProgram = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesAffiliateProductProgram **** `)

        let files = await getLocalFiles(config.recipe.folder)
        console.log(`\nCreate files AffiliateProductProgram, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
        if (files.length === 0) {
            console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
            await createRecipeAffiliateProductProgram()
            metrics.influxdb(200, `createRecipeAffiliateProductProgram_${computerName}`)
            return
        }

        // console.log('list of files files:', files)
        let file1 = files[1]
        if (file1) {
            await deleteFile(file1)
        }

        await createRecipeAffiliateProductProgram()

        metrics.influxdb(200, `createRecipeAffiliateProductProgram--${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeAffiliateProductProgramError-${computerName}`)
        console.log('create files createRecipeAffiliateProductProgram error:', e)
    }

}


const setRecipeFilesAcProducts = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesAcProducts **** `)

        let files = await getLocalFiles(config.recipe.folder)
        console.log(`\nCreate files AcProducts, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
        if (files.length === 0) {
            console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
            await createRecipeAcProducts()
            metrics.influxdb(200, `createRecipeAcProducts_${computerName}`)
            return
        }

        // console.log('list of files files:', files)
        let file1 = files[0]
        if (file1) {
            await deleteFile(file1)
        }

        await createRecipeAcProducts()

        metrics.influxdb(200, `createRecipeAcProducts-${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeAcProductsError-${computerName}`)
        console.log('create files createRecipeAcProducts error:', e)
    }

}

const setRecipeFilesRefCodes = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        console.log(`**** setRecipeFilesRefCodes **** `)

        let files = await getLocalFiles(config.recipe.folder)
        console.log(`\nCreate files AcProducts, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
        if (files.length === 0) {
            console.log(`no files in folder:${JSON.stringify(config.recipe)} created `)
            await createRecipeRefCodes()
            metrics.influxdb(200, `createRecipeAcProducts_${computerName}`)
            return
        }
        //
        // console.log('list of files files:', files)
        let file1 = files[2]
        if (file1) {
            await deleteFile(file1)
        }

        await createRecipeRefCodes()

        metrics.influxdb(200, `createRecipeRefCodes-${computerName}`)
    } catch (e) {
        metrics.influxdb(500, `createRecipeRefCodesError-${computerName}`)
        console.log('create files createRecipeRefCodesError error:', e)
    }

}

module.exports = {
    setFileSizeInfo,
    setRecipeFilesAffiliateProductProgram,
    setRecipeFilesAcProducts,
    setRecipeFilesRefCodes
}

