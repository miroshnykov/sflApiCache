let MomentTz = require('moment-timezone')

const getMomentFromUnixTimestamp = (unixTimestamp, timezone) => (MomentTz.utc(unixTimestamp).tz(timezone))

module.exports = {
    getMomentFromUnixTimestamp
}
