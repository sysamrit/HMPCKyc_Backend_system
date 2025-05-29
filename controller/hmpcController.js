const { db } = require("../db/db");
const { convertObjectToArray } = require("../utils/convert_object_to_2d_array");

const getHmpcTechData = async (req, res) => {
    try {
        const hmpcQuery = `
            SELECT 
                *,
                IF(technical_ver IS NULL OR technical_ver = '', 'Pending', technical_ver) AS technical_ver,
                IF(crm_ver IS NULL OR crm_ver = '', 'Pending', crm_ver) AS crm_ver
            FROM tbl_hm_pc_kyc
        `;

        const [hmpcData] = await db.promise().execute(hmpcQuery);

        return res.status(200).json({ status: 200, data: hmpcData });
    } catch (error) {
        console.error("Error fetching HMPC data:", error);
        res.status(500).json({ status: 500, message: "Error fetching data." });
    }
};

const getHmpcCRMData = async (req, res) => {
    try {
        const hmpcQuery = `
            SELECT 
                *,
                IF(technical_ver IS NULL OR technical_ver = '', 'Pending', technical_ver) AS technical_ver,
                IF(crm_ver IS NULL OR crm_ver = '', 'Pending', crm_ver) AS crm_ver
            FROM tbl_hm_pc_kyc WHERE technical_ver = 'Verified'
        `;

        const [hmpcData] = await db.promise().execute(hmpcQuery);

        return res.status(200).json({ status: 200, data: hmpcData });
    } catch (error) {
        console.error("Error fetching HMPC data:", error);
        res.status(500).json({ status: 500, message: "Error fetching data." });
    }
};

const getHmpcDatabyID = async (req, res) => {
    try {
        let { hmpcid } = req.params;
        const hmpcquary = `SELECT * FROM tbl_hm_pc_kyc where hm_pc_id = ?`;

        const [hmpcData] = await db.promise().execute(hmpcquary, [hmpcid]);

        return res.status(200).json({ status: 200, data: hmpcData });
    } catch (error) {
        console.error("Error sending mail:", error);
        res.status(500).json({ status: 500, message: "Error sending mail." });
    }
};

// let incomingData = {data:[
//     '26/05/2025',
//     'IHB-25-26-510271',
//     'Dulu borah',
//     'OCA75043-Abinash Borah',
//     'PC',
//     '',
//     '',
//     '',
//     '',
//     '',
//     '',
//     '',
//     'Ajijul Haque',
//     '9706095931',
//     '655546188153',
//     'https://drive.google.com/open?id=1Usx6ej182JSc47bEc_v2p_2wO4lOw_Gy',
//     '43056796664',
//     'https://drive.google.com/open?id=1MoZgbF2IPxEHj9--QyRWwgbtuh7bBU1L',
//     '18/03/1985',
//     '',
//     '',
//     '',
//     '',
//     '',
//     '',
//     '',
//     '',
//     '',
//     'SBI',
//     'Sibasagar',
//     'SBIN0000182',
//     '',
//     ''
//   ]}

const setHmpcDatatoSql = async (req, res) => {
    // req.body=incomingData;
    const data = req.body.data;
    try{
        const kyc = data[4];
        const hmPhone = data[6];
        const pcPhone = data[13];
        if ( kyc == 'HM'){
            let checkmbQuery = `SELECT * FROM tbl_mobile_cancel WHERE hm_pc_mobile_no = ?`

            const [existing] = await db.promise().execute(checkmbQuery, [hmPhone]);

            if (existing.length > 0) {

                return res.status(400).json({ 
                    status: 400, 
                    message: "HM phone number is blocked." 
                });
            }
        }
        
        if ( kyc == 'PC'){
            let checkmbQuery = `SELECT * FROM tbl_mobile_cancel WHERE hm_pc_mobile_no = ?`

            const [existing] = await db.promise().execute(checkmbQuery, [pcPhone]);

            if (existing.length > 0) {

                return res.status(400).json({ 
                    status: 400, 
                    message: "PC phone number is blocked." 
                });
            }
        }

        let checkQuery = `
            SELECT * FROM tbl_hm_pc_kyc 
            WHERE hm_mobile_no = ? AND pc_mobile_no = ?
        `;
        const [existing] = await db.promise().execute(checkQuery, [hmPhone, pcPhone]);

        if (existing.length > 0) {

            return res.status(400).json({ 
                status: 400, 
                message: "Either HM or PC phone number already exists." 
            });
        }

        const insertquery = 'INSERT INTO `tbl_hm_pc_kyc`(`timestamp`,`registration_no`,`ihb_name`,`executive_name`,`kyc_details`,`hm_name`,`hm_mobile_no`,`hm_aadhaar_card_no`,`hm_aadhaar_card_pic`,`hm_bank_account_no`,`hm_bank_pass_pic`,`dob_of_hm`,`pc_name`,`pc_mobile_no`,`pc_aadhaar_card_no`,`pc_aadhaar_card_pic`,`pc_bank_account_no`,`pc_bank_pass_pic`,`dob_of_pc`,`code_of_hm`,`code_of_pc`,`technical_ver`,`crm_ver`,`verify_date_tech`,`verify_date_crm`,`hm_bank_name`,`hm_branch_name`,`hm_ifsc_code`,`pc_bank_name`,`pc_branch_name`,`pc_ifsc_code`,`remarks_tech`,`remarks_crm`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        await db.promise().execute(insertquery, data);

        return res.status(200).json({ status: 200, message: "Data Inserted Successfuylly" });
    } catch (error) {
        // console.log(data, new Date());
        console.error("Error sending data:", error);
        res.status(500).json({status: 500, message: "Error inserting data." });
    }
};

const setHmpcTechVer = async (req, res) => {
    try {
        const { action, responseData } = req.body;
        let hm_pc_id = responseData.hm_pc_id;
        let remarks_tech = responseData.remarks;

        const selectQuery = `SELECT technical_ver FROM tbl_hm_pc_kyc WHERE hm_pc_id = ?`;
        let [ver_details] = await db.promise().execute(selectQuery, [hm_pc_id]);
        let tech_ver = ver_details[0]['technical_ver'];
        if (tech_ver == "Verified" || tech_ver == "Rejected") {
            return res.status(200).json({
                status: 200,
                message: "Technical Verification is Already Updated"
            });
        }

        let updateQuery;
        let updateParams;
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const timestamp_tech = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        if (action === "Rejected") {
            // Do not update verify_date_tech
            updateQuery =`
                UPDATE tbl_hm_pc_kyc 
                SET technical_ver = ?, verify_date_tech = ?, remarks_tech = ?
                WHERE hm_pc_id = ?
            `;
            updateParams = [action, timestamp_tech, remarks_tech,hm_pc_id];
        } else {
            updateQuery =`
                UPDATE tbl_hm_pc_kyc SET technical_ver = ?, verify_date_tech = ?, remarks_tech = ? WHERE hm_pc_id = ?
            `; 
            updateParams = [action, timestamp_tech, remarks_tech,hm_pc_id];
        }

        await db.promise().execute(updateQuery, updateParams);

        return res.status(200).json({
            status: 200,
            message: "Updated Technical Details Successfully"
        });

    } catch (error) {
        console.error("Error updating technical verification:", error);
        res.status(500).json({ status: 500, message: "Error updating data." });
    }
};

const setHmpcCRMVer = async (req, res) => {
    try {
        const { action, responseData } = req.body;
        let hm_pc_id = responseData.hm_pc_id;
        let remarks_crm = responseData.remarks;

        const selectQuery = `SELECT technical_ver, crm_ver FROM tbl_hm_pc_kyc WHERE hm_pc_id = ?`;
        let [ver_details] = await db.promise().execute(selectQuery, [hm_pc_id]);
        let tech_ver = ver_details[0]['technical_ver'];
        let crm_ver = ver_details[0]['crm_ver'];

        if (tech_ver == "" || tech_ver == "Rejected") {
            return res.status(200).json({
                status: 200,
                message: "Technical Verification is Not Updated or Rejected"
            });
        }

        if (crm_ver == "Verified" || crm_ver == "Rejected") {
            return res.status(200).json({
                status: 200,
                message: "CRM Verification is Already Updated"
            });
        }

        let updateQuery;
        let updateParams;
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const timestamp_crm = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        if (action == "Rejected") {
            updateQuery = `
                UPDATE tbl_hm_pc_kyc 
                SET crm_ver = ?, verify_date_crm = ?, remarks_crm = ?
                WHERE hm_pc_id = ?
            `;
            updateParams = [action, timestamp_crm, remarks_crm, hm_pc_id];
        } else {
            updateQuery = `
                UPDATE tbl_hm_pc_kyc 
                SET crm_ver = ?, verify_date_crm = ?, remarks_crm = ?
                WHERE hm_pc_id = ?
            `;
            updateParams = [action, timestamp_crm, remarks_crm, hm_pc_id];
        }

        await db.promise().execute(updateQuery, updateParams);
        await db.promise().execute('CALL generate_kyc_codes(?)', [hm_pc_id]);

        return res.status(200).json({
            status: 200,
            message: "Updated CRM Details Successfully"
        });

    } catch (error) {
        console.error("Error updating CRM verification:", error);
        res.status(500).json({ status: 500, message: "Error updating data." });
    }
};

const getHmpcDatabySheet = async (req, res) => {
    try {
        queryString = `SELECT DATE_FORMAT(\`timestamp\`, '%Y-%m-%d %H:%i:%s') AS \`timestamp\`, registration_no, ihb_name, executive_name, kyc_details, hm_name, hm_mobile_no, hm_aadhaar_card_no, hm_aadhaar_card_pic, hm_bank_account_no, hm_bank_pass_pic, dob_of_hm, pc_name, pc_mobile_no, pc_aadhaar_card_no, pc_aadhaar_card_pic, pc_bank_account_no, pc_bank_pass_pic, dob_of_pc, code_of_hm, code_of_pc, technical_ver, crm_ver, verify_date_tech, verify_date_crm, hm_bank_name, hm_branch_name, hm_ifsc_code, pc_bank_name, pc_branch_name, pc_ifsc_code, remarks_tech, remarks_crm FROM tbl_hm_pc_kyc`;

        const [result] = await db.promise().query(queryString);
        const dataArray = convertObjectToArray(result);
        const dataArrayToJson = JSON.stringify(dataArray);
        return res.send(dataArrayToJson);
    } catch (error) {
        console.error("Error updating CRM verification:", error);
        res.status(500).json({ status: 500, message: "Error updating data." });
    }
};

const setDuplicateDatatoSql = async (req, res) => {
    try {
        let { timestamp, reg_no, ihb_name, kyc_details, executive_name, hm_mobile, pc_mobile } = req.body
        const isHM = kyc_details == 'HM';
        const isPC = kyc_details == 'PC' || kyc_details == 'Both Of Them';

        if (isHM) {
            const [existingRecords] = await db.promise().query(
                'SELECT * FROM tbl_hm_pc_kyc WHERE hm_mobile_no = ?',
                [hm_mobile]
            );

            if (existingRecords.length > 0) {
                const sameReg = existingRecords.find(r => r.registration_no == reg_no);

                if (sameReg) {
                    return res.status(200).json({ message: 'HM record already exists. No action taken.' });
                } else {
                    const source = existingRecords[0];

                    const insertQuery = `
                    INSERT INTO tbl_hm_pc_kyc (
                    timestamp, registration_no, ihb_name, executive_name, kyc_details,hm_name, hm_mobile_no, hm_aadhaar_card_no, hm_aadhaar_card_pic, hm_bank_account_no,hm_bank_pass_pic, dob_of_hm, pc_name, pc_mobile_no, pc_aadhaar_card_no,pc_aadhaar_card_pic, pc_bank_account_no, pc_bank_pass_pic, dob_of_pc,code_of_hm, code_of_pc, technical_ver, crm_ver, verify_date_tech,verify_date_crm, hm_bank_name, hm_branch_name, hm_ifsc_code,
                    pc_bank_name, pc_branch_name, pc_ifsc_code,
                    remarks_tech, remarks_crm
                    ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `;

                    const values = [
                        timestamp, reg_no, ihb_name, executive_name, 'HM', source.hm_name, source.hm_mobile_no, source.hm_aadhaar_card_no, source.hm_aadhaar_card_pic, source.hm_bank_account_no, source.hm_bank_pass_pic, source.dob_of_hm, source.pc_name, source.pc_mobile_no, source.pc_aadhaar_card_no, source.pc_aadhaar_card_pic, source.pc_bank_account_no, source.pc_bank_pass_pic, source.dob_of_pc, source.code_of_hm, source.code_of_pc, source.technical_ver, source.crm_ver, source.verify_date_tech, source.verify_date_crm, source.hm_bank_name, source.hm_branch_name, source.hm_ifsc_code, source.pc_bank_name, source.pc_branch_name, source.pc_ifsc_code, source.remarks_tech, source.remarks_crm
                    ];

                    await db.promise().query(insertQuery, values);
                    return res.status(201).json({ message: 'New HM record inserted with different registration number.' });
                }
            }

            return res.status(200).json({ message: 'No matching HM mobile found. No action taken.' });
        }

        if (isPC) {
            const [existingRecords] = await db.promise().query(
                'SELECT * FROM tbl_hm_pc_kyc WHERE pc_mobile_no = ?',
                [pc_mobile]
            );

            if (existingRecords.length > 0) {
                const sameReg = existingRecords.find(r => r.registration_no === reg_no);

                if (sameReg) {
                    return res.status(200).json({ message: 'PC record already exists. No action taken.' });
                } else {
                    const source = existingRecords[0];

                    const insertQuery = `
                    INSERT INTO tbl_hm_pc_kyc (
                    timestamp, registration_no, ihb_name, executive_name, kyc_details,
                    hm_name, hm_mobile_no, hm_aadhaar_card_no, hm_aadhaar_card_pic, hm_bank_account_no,
                    hm_bank_pass_pic, dob_of_hm, pc_name, pc_mobile_no, pc_aadhaar_card_no,
                    pc_aadhaar_card_pic, pc_bank_account_no, pc_bank_pass_pic, dob_of_pc,
                    code_of_hm, code_of_pc, technical_ver, crm_ver, verify_date_tech,
                    verify_date_crm, hm_bank_name, hm_branch_name, hm_ifsc_code,
                    pc_bank_name, pc_branch_name, pc_ifsc_code,
                    remarks_tech, remarks_crm
                    ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `;

                    const values = [
                        timestamp, reg_no, ihb_name, executive_name, 'PC', source.hm_name, source.hm_mobile_no, source.hm_aadhaar_card_no, source.hm_aadhaar_card_pic, source.hm_bank_account_no, source.hm_bank_pass_pic, source.dob_of_hm, source.pc_name, source.pc_mobile_no, source.pc_aadhaar_card_no, source.pc_aadhaar_card_pic, source.pc_bank_account_no, source.pc_bank_pass_pic, source.dob_of_pc, source.code_of_hm, source.code_of_pc, source.technical_ver, source.crm_ver, source.verify_date_tech, source.verify_date_crm, source.hm_bank_name, source.hm_branch_name, source.hm_ifsc_code, source.pc_bank_name, source.pc_branch_name, source.pc_ifsc_code, source.remarks_tech, source.remarks_crm
                    ];

                    await db.promise().query(insertQuery, values);
                    return res.status(201).json({ message: 'New PC record inserted with different registration number.' });
                }
            }

            return res.status(200).json({ message: 'No matching PC mobile found. No action taken.' });
        }

        res.status(400).json({ message: 'Invalid kyc_details type provided.' });
    } catch (error) {
        console.error("Error inserting Data:", error);
        res.status(500).json({ status: 500, message: "Error updating data." });
    }
};

const getHmpcPendingData = async (req, res) => {
    try{
        let selectQuery = `SELECT COUNT(CASE WHEN technical_ver IS NULL OR technical_ver = '' THEN 1 END) AS pending_tech_ver, COUNT(CASE WHEN crm_ver IS NULL OR crm_ver = '' THEN 1 END) AS pending_crm_ver FROM tbl_hm_pc_kyc`;

        const [rows] = await db.promise().execute(selectQuery);

        res.status(200).json({ status: 200, data: rows[0] });
    } catch (error) {
        console.error("Error inserting Data:", error);
        res.status(500).json({ status: 500, message: "Error updating data." });
    }
}

module.exports = { getHmpcTechData, getHmpcCRMData, getHmpcDatabyID, setHmpcDatatoSql, setHmpcTechVer, setHmpcCRMVer, getHmpcDatabySheet, setDuplicateDatatoSql, getHmpcPendingData }