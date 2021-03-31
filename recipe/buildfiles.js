let chalk = require("chalk")
let JSONStream = require("JSONStream")
let fileSystem = require("fs")
let path = require('path')
const os = require('os')
const config = require('plain-config')()

const computerName = os.hostname()

const {getAffiliateProductProgram, getAcProducts, getRefCodes} = require('../db/dataDb')
// const {getSegments} = require('../db/segments')
const {
    generateFilePath,
    createRecursiveFolder,
    compressFileZlibSfl,
    deleteFile
} = require('../lib/zipRecipe')

const {memorySizeOf, memorySizeOfBite} = require('../lib/helper')

const metrics = require('../lib/metrics')

const createRecipeAffiliateProductProgram = async () => {
    try {
        let affiliateProductProgramData = await getAffiliateProductProgram()
        console.log(`get affiliateProductProgramData count:${affiliateProductProgramData.length}, from computer:${computerName} `)
        // if (affiliateProductProgramData.length === 0) {
        //     console.log(`No campaigns data`)
        //     return
        // }
        let filePath = config.recipe.folder + await generateFilePath('affiliateProductProgram')
        // console.log('filePath', filePath)
        let fileFolder = path.dirname(filePath);
        // console.log('fileFolder:', fileFolder)
        await createRecursiveFolder(fileFolder)
        // console.log('sfl_filePath:', filePath)

        // let sizeCampaign = await memorySizeOf(affiliateProductProgramData)

        // console.log('res.length', offerData.length)
        // console.log('sizeOfDbMaps:', sizeOfDbMaps)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        affiliateProductProgramData.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {

                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                console.log(`File AffiliateProductProgram created path:${filePath}`)
            }
        );
    } catch (e) {
        metrics.influxdb(500, `createRecipeCampaignError-${computerName}`)
        console.log('createRecipeCampaignError:', e)
    }
}

const createRecipeAcProducts = async () => {
    try {
        let acProductsData = await getAcProducts()
        console.log(`get acProductsData count:${acProductsData.length}, from computer:${computerName} `)
        // if (affiliateProductProgramData.length === 0) {
        //     console.log(`No campaigns data`)
        //     return
        // }
        let filePath = config.recipe.folder + await generateFilePath('acProductsData')
        // console.log('filePath', filePath)
        let fileFolder = path.dirname(filePath);
        // console.log('fileFolder:', fileFolder)
        await createRecursiveFolder(fileFolder)
        // console.log('sfl_filePath:', filePath)

        // let sizeCampaign = await memorySizeOf(affiliateProductProgramData)

        // console.log('res.length', offerData.length)
        // console.log('sizeOfDbMaps:', sizeOfDbMaps)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        acProductsData.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {

                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                console.log(`File acProductsData created path:${filePath}`)
            }
        );
    } catch (e) {
        metrics.influxdb(500, `createRecipeAcProductsDataError-${computerName}`)
        console.log('createRecipeAcProductsDataError:', e)
    }
}

const createRecipeRefCodes = async () => {
    try {
        let refCodesData = await getRefCodes()
        console.log(`get acProductsData count:${refCodesData.length}, from computer:${computerName} `)
        // if (affiliateProductProgramData.length === 0) {
        //     console.log(`No campaigns data`)
        //     return
        // }
        let filePath = config.recipe.folder + await generateFilePath('refCodesData')
        // console.log('filePath', filePath)
        let fileFolder = path.dirname(filePath);
        // console.log('fileFolder:', fileFolder)
        await createRecursiveFolder(fileFolder)
        // console.log('sfl_filePath:', filePath)

        // let sizeCampaign = await memorySizeOf(affiliateProductProgramData)

        // console.log('res.length', offerData.length)
        // console.log('sizeOfDbMaps:', sizeOfDbMaps)

        let transformStream = JSONStream.stringify();
        let outputStream = fileSystem.createWriteStream(filePath);

        transformStream.pipe(outputStream);

        refCodesData.forEach(transformStream.write);

        transformStream.end();

        outputStream.on(
            "finish",
            async function handleFinish() {

                await compressFileZlibSfl(filePath)
                await deleteFile(filePath)
                console.log(`File refCodesData created path:${filePath}`)
            }
        );
    } catch (e) {
        metrics.influxdb(500, `createReciperefCodesDataError-${computerName}`)
        console.log('createReciperefCodesDataError:', e)
    }
}



module.exports = {
    createRecipeAffiliateProductProgram,
    createRecipeAcProducts,
    createRecipeRefCodes
}
