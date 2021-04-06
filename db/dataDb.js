const config = require('plain-config')()
let dbMysql = require('./mysqlAdcenterDb').get()

const getRefCodes = async () => {
    try {
        let result = await dbMysql.query(` 
                SELECT r.affiliate_id AS affiliateId,
                        r.id AS refCodeId,
                       concat(a.first_name, " ", a.last_name) AS affiliateName,
                       a.employee_id AS accountExecutiveId,
                       (SELECT e.name FROM employees e WHERE e.id = a.employee_id ) AS accountExecutiveName,                       
                       a.account_mgr_id AS accountManagerId,
                       (SELECT e.name FROM employees e WHERE e.id = a.account_mgr_id ) AS accountManagerName,
                       a.\`status\` AS affiliateStatus,
                       a.affiliate_type AS affiliateType,       
                       r.campaign_id AS campaignId,
                       r.program_id AS programId,
                       (SELECT p.name FROM programs p WHERE p.id = r.program_id) AS programName,                        
                       r.product_id AS productId,
                       a.is_traffic_blocked AS isTrafficBlocked,
                       a.is_lock_payment AS isLockPayment                       
                FROM ref_codes AS r
                LEFT JOIN affiliates AS a ON r.affiliate_id = a.id                                                 
        `)
        await dbMysql.end()
        // console.log(`\nget offerInfo count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}


const getAffiliateProductProgram = async () => {

    let timeStartFrom = config.env === 'staging' ? 1488058665 : 1427900440

    try {
        let result = await dbMysql.query(` 

            SELECT 
                program_id as affiliateProductProgramId, 
                affiliate_id as affiliatesId, 
                product_id as productId
            FROM affiliate_product_programs  
            WHERE date_added > ${timeStartFrom}                                             
        `)
        await dbMysql.end()
        // console.log(`\nget offerInfo count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

const getAcProducts = async () => {
    try {
        let result = await dbMysql.query(` 
                SELECT program_id as programId,
                       id, 
                       name AS productName
                FROM ac_products                                            
        `)
        await dbMysql.end()
        // console.log(`\nget offerInfo count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    getRefCodes,
    getAffiliateProductProgram,
    getAcProducts
}