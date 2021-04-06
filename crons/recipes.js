const {
    createRecipeAffiliateProductProgram,
    createRecipeAcProducts,
    createRecipeRefCodes,
} = require('../recipe/buildfiles')

const {deleteFile} = require('../lib/zipRecipe')

const config = require('plain-config')()
const os = require('os')
const {getFileSize, formatByteSize, parseFiles} = require('../lib/helper')

const {getDataCache, setDataCache} = require('../lib/redis')
const {
    getLocalFiles
} = require('../lib/zipRecipe')
const metrics = require('../lib/metrics')

const setFileSizeInfo = async () => {

    // if (config.env === 'development' || config.env === 'staging') return
    try {
        let files = await getLocalFiles(config.recipe.folder)
        const computerName = os.hostname()
        let response = {}

        console.log(`getLocalFilesDebug for computerName:${computerName}, files:${JSON.stringify(files)}`)
        if (files.length === 0) {
            console.log(`I am not able to get the Size of recipe,  No files in folder ${config.recipe.folder}`)
            metrics.influxdb(500, `fileSizeAllRecipeNotExists`)
            return
        }

        let filesInfo = parseFiles(files)
        response.files = filesInfo

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

        let fileSizeAcProductsData
        let fileSizeAffiliateProductProgram
        let fileSizeRefCodesData

        fileSizeAcProductsData = acProductsInfo[0].size
        fileSizeAffiliateProductProgram = affiliateProductProgramInfo[0].size
        fileSizeRefCodesData = refCodeInfo[0].size


        if (!fileSizeAffiliateProductProgram) {
            metrics.influxdb(500, `fileSizeAffiliateProductProgramNotExists-${computerName}`)
        }


        if (!fileSizeAcProductsData) {
            metrics.influxdb(500, `fileSizeAcProductsDataNotExists-${computerName}`)
        }

        if (!fileSizeRefCodesData) {
            metrics.influxdb(500, `fileSizeRefCodesDataNotExists-${computerName}`)
        }
        //
        // console.log(`File size for computerName:${computerName}
        //             fileSizeAcProductsData:${fileSizeAcProductsData},
        //             fileSizeAffiliateProductProgram:${fileSizeAffiliateProductProgram},
        //             fileSizeRefCodesData:${fileSizeRefCodesData}`
        // )

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

        console.log(`Set filesSizeRefCodes:${JSON.stringify(fileSizeInfo)}`)
        await setDataCache(`filesSizeRefCodes`, fileSizeInfo)

        metrics.influxdb(200, `setFileSizeRefCodes-${fileSizeInfo.refCodesData}`)
        metrics.influxdb(200, `setFileSizeAffiliateProductProgram-${fileSizeInfo.affiliateProductProgram}`)
        metrics.influxdb(200, `setFileSizeAcProductsData-${fileSizeInfo.acProductsData}`)

    } catch (e) {
        console.log('getFilesSizeError:', e)
        metrics.influxdb(500, `getFilesSizeError'`)
    }

}

const setRecipeFilesAffiliateProductProgram = async () => {
    if (config.env === 'development') return
    const computerName = os.hostname()
    try {
        let files = await getLocalFiles(config.recipe.folder)

        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []
        for (const affiliateProductProgram of filesInfo.affiliateProductProgramData) {
            await deleteFile(affiliateProductProgram.file)
            response.deleted.push(affiliateProductProgram.file)
        }

        console.log(` **** Deleted AffiliateProductProgram files:${JSON.stringify(response)}`)
        await createRecipeAffiliateProductProgram()
        console.log(` **** Create files AffiliateProductProgram, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)

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
        let files = await getLocalFiles(config.recipe.folder)
        console.log(`\nCreate files AcProducts, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []

        for (const acProducts of filesInfo.acProductsData) {
            await deleteFile(acProducts.file)
            response.deleted.push(acProducts.file)
        }
        console.log(` **** Deleted  AcProducts files:${JSON.stringify(response)}`)
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

        let files = await getLocalFiles(config.recipe.folder)
        let filesInfo = parseFiles(files)

        let response = {}
        response.deleted = []
        for (const refCodeFile of filesInfo.refCodesData) {
            await deleteFile(refCodeFile.file)
            response.deleted.push(refCodeFile.file)
        }

        console.log(` **** Deleted  RefCodes files:${JSON.stringify(response)}`)

        await createRecipeRefCodes()
        console.log(`\nCreate files RefCodes, computerName:${computerName}, files:${JSON.stringify(files)}, ConfigRecipeFolder:${JSON.stringify(config.recipe)}  `)
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

