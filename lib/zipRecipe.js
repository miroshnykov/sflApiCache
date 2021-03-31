let Promise = require('bluebird');
const fs = require('fs')
const zlib = require('zlib')
const mkdirp = require('mkdirp')
const NodeDir = require('node-dir')

let {getMomentFromUnixTimestamp} = require('./timer')

const generateFilePath = (recipeName) => {
    let date = new Date()
    let unixTimestamp = ~~(date.getTime() / 1000)
    return recipeName + '-' + unixTimestamp + '.json'
}

const createRecursiveFolder = (fileFolder) => {

    return new Promise((resolve, reject) => {

        // console.log('mkdir fileFolder', fileFolder)
        mkdirp(fileFolder, (err) => {
            if (err) {
                console.log('createRecursiveFolderError:', err)
                reject(err);
            }
            resolve();
        });

    })
};

const deleteFile = (filePath) => {

    return new Promise((resolve, reject) => {

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err)
                reject(filePath)
            } else {
                // console.log(`delete file:${filePath}`)
                resolve(filePath)
            }
        });
    })
};


const appendToLocalFile = (filePath, data) => {

    return new Promise((resolve, reject) => {

        fs.appendFileSync(filePath, data, 'utf8', (err) => {
            if (err) {
                console.log('appendFileSyncErr:', err)
                reject(err);
            }
        });
        resolve(filePath)

    })
};

const getLocalFiles = (localFolder) => {

    return new Promise(function (resolve, reject) {

        NodeDir.files(localFolder, function (err, files) {

            if (err) {
                return reject(err);
            }

            files = files.filter(function (file) {
                return file.indexOf('.gz') !== -1;
            });

            files.sort();
            return resolve(files);
        });

    })

};

const compressFileZlibSfl = (fileName) => {

    return new Promise((resolve) => {
        let read = fs.createReadStream(fileName)
        let write = fs.createWriteStream(fileName + '.gz')
        let compress = zlib.createGzip()
        read.pipe(compress).pipe(write)
        compress.on('unpipe', (compression) => {
            if (compression._readableState.ended === true) {
                // console.log('Compression stream ended');
                return new Promise((resolve) => {
                    write.on('finish', () => {
                        // console.log('Compression fully finished');
                        resolve(write);
                    })
                }).then(() => {
                    // console.log(`sfl resolve fileName:${fileName}`)
                    resolve(fileName)
                }).catch((err) => {
                    console.log(`sfl unpipe error fileName:${fileName}`, err)
                })
            }
        })
        compress.on('errors', (err) => {
            console.log(`sfl compress error: fileName:${fileName}`, err)
        })
        write.on('error', (err) => {
            console.log(`sfl write error: fileName:${fileName}`, err)
        })
    }).catch((err) => {
        console.log(`compressFileZlibError fileName:${fileName}`, err)
    })
}


module.exports = {
    generateFilePath,
    createRecursiveFolder,
    appendToLocalFile,
    compressFileZlibSfl,
    deleteFile,
    getLocalFiles
}
