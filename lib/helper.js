const config = require('plain-config')()
const fs = require('fs')
const metrics = require('../lib/metrics')

const convertTime = (timestamp) => {
    let months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let date = new Date(timestamp * 1000);
    let year = date.getFullYear();
    let month = months_arr[date.getMonth()];
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let convdataTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return convdataTime
}

const currentTime = () => {
    let date = new Date()
    let current = ~~(date.getTime() / 1000)
    return convertTime(current)
}

const memorySizeOf = (obj) => {
    let bytes = 0;

    const sizeOf = (obj) => {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (let key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes
    };

    const formatByteSize = (bytes) => {
        if (bytes < 1024) return bytes + " bytes"
        else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB"
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB"
        else return (bytes / 1073741824).toFixed(3) + " GiB"
    }

    return formatByteSize(sizeOf(obj))
};

const memorySizeOfBite = (obj) => {
    let bytes = 0;

    const sizeOf = (obj) => {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (let key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes
    };

    return sizeOf(obj)
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const formatByteSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB"
    else return (bytes / 1073741824).toFixed(3) + " GiB"
}

const getFileSize = (filename) => {
    try {

        let stats = fs.statSync(filename);
        let fileSizeInBytes = stats.size;
        // let fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
        // console.log('fileSizeInBytes:',fileSizeInMegabytes,'MB')
        // return `${fileSizeInMegabytes} MB`;
        // console.log(`*** getFileSize:${filename}, size:${formatByteSize(fileSizeInBytes)}`)
        return fileSizeInBytes
    } catch (e) {
        console.log('getFileSizeError:', e)
        metrics.influxdb(500, `getFileSizeError`)
    }
}

const parseFiles = (files) => {
    try {
        let filesInfo = {}
        filesInfo.acProductsData = []
        filesInfo.affiliateProductProgramData = []
        filesInfo.refCodesData = []
        files.forEach((file, index) => {
            if (file.includes('acProductsData')) {
                // console.log('acProductsData index:',index,file)
                filesInfo.acProductsData.push({index: index, file: file})
            }
            if (file.includes('affiliateProductProgram')) {
                // console.log('affiliateProductProgram index:',index,file)
                filesInfo.affiliateProductProgramData.push({index: index, file: file})
            }
            if (file.includes('refCodesData')) {
                // console.log('refCodesData index:',index,file)
                filesInfo.refCodesData.push({index: index, file: file})
            }

        })
        return filesInfo
    } catch (e) {
        console.log('parceFiles', e)
    }

}


module.exports = {
    currentTime,
    memorySizeOf,
    memorySizeOfBite,
    formatBytes,
    formatByteSize,
    getFileSize,
    parseFiles
}

