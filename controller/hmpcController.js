const { db } = require("../db/db");
const { convertObjectToArray } = require("../utils/convert_object_to_2d_array");

const getHmpcData = async (req, res) => {
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

const getHmpcDatabyID = async (req, res) => {
    try{
        let { hmpcid } = req.params;
        const hmpcquary = `SELECT * FROM tbl_hm_pc_kyc where hm_pc_id = ?`;

        const [hmpcData] = await db.promise().execute(hmpcquary, [hmpcid]);

        return res.status(200).json({ status: 200, data: hmpcData });
    }catch (error) {
        console.error("Error sending mail:", error);
        res.status(500).json({status: 500, message: "Error sending mail." });
    }
};

const setHmpcDatatoSql = async (req, res) => {
    try{
        const data = req.body;
        const insertquery = 'INSERT INTO `tbl_hm_pc_kyc`(`timestamp`,`registration_no`,`ihb_name`,`executive_name`,`kyc_details`,`hm_name`,`hm_mobile_no`,`hm_aadhaar_card_no`,`hm_aadhaar_card_pic`,`hm_bank_account_no`,`hm_bank_pass_pic`,`dob_of_hm`,`pc_name`,`pc_mobile_no`,`pc_aadhaar_card_no`,`pc_aadhaar_card_pic`,`pc_bank_account_no`,`pc_bank_pass_pic`,`dob_of_pc`,`code_of_hm`,`code_of_pc`,`technical_ver`,`crm_ver`,`verify_date_tech`,`verify_date_crm`,`hm_bank_name`,`hm_branch_name`,`hm_ifsc_code`,`pc_bank_name`,`pc_branch_name`,`pc_ifsc_code`,`remarks_tech`,`remarks_crm`) VALUES (?)';

        await db.promise().execute(insertquery, [data]);

        return res.status(200).json({ status: 200, message: "Data Inserted Successfuylly" });
    } catch (error) {
        console.error("Error sending mail:", error);
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

        if (action === "Rejected") {
            // Do not update verify_date_tech
            updateQuery = `
                UPDATE tbl_hm_pc_kyc 
                SET technical_ver = ?, remarks_tech = ?
                WHERE hm_pc_id = ?
            `;
            updateParams = [action, remarks_tech, hm_pc_id];
        } else {
            // Update with timestamp
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const timestamp_tech = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            updateQuery = `
                UPDATE tbl_hm_pc_kyc 
                SET technical_ver = ?, verify_date_tech = ?, remarks_tech = ?
                WHERE hm_pc_id = ?
            `;
            updateParams = [action, timestamp_tech, remarks_tech, hm_pc_id];
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

        if (action == "Rejected") {
            updateQuery = `
                UPDATE tbl_hm_pc_kyc 
                SET crm_ver = ?, remarks_crm = ?
                WHERE hm_pc_id = ?
            `;
            updateParams = [action, remarks_crm, hm_pc_id];
        } else {
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const timestamp_crm = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

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

const getHmpcDatabySheet = async (req, res) =>{
    try {
        queryString = 'SELECT hm_pc_id, `timestamp`, registration_no, ihb_name, executive_name, kyc_details, hm_name, hm_mobile_no, hm_aadhaar_card_no, hm_aadhaar_card_pic, hm_bank_account_no, hm_bank_pass_pic, dob_of_hm, pc_name, pc_mobile_no, pc_aadhaar_card_no, pc_aadhaar_card_pic, pc_bank_account_no, pc_bank_pass_pic, dob_of_pc, code_of_hm, code_of_pc, technical_ver, crm_ver, verify_date_tech, verify_date_crm, hm_bank_name, hm_branch_name, hm_ifsc_code, pc_bank_name, pc_branch_name, pc_ifsc_code, remarks_tech, remarks_crm FROM tbl_hm_pc_kyc';

        const [result] = await db.promise().query(queryString);
        const dataArray = convertObjectToArray(result);
        const dataArrayToJson = JSON.stringify(dataArray);
        return res.send(dataArrayToJson);
    } catch (error) {
        console.error("Error updating CRM verification:", error);
        res.status(500).json({ status: 500, message: "Error updating data." });
    }
};

module.exports = {getHmpcData, getHmpcDatabyID, setHmpcDatatoSql, setHmpcTechVer, setHmpcCRMVer,getHmpcDatabySheet}