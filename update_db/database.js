import mysql from 'mysql2'
import dotenv from 'dotenv'
import express from 'express'
import { createObjectCsvWriter } from 'csv-writer';


dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

 const pool = mysql.createPool({
     host: process.env.MYSQL_HOST,
     user: process.env.MYSQL_USER,
     password: process.env.MYSQL_PASSWORD,
     database: process.env.MYSQL_DATABASE
 }).promise()

 
export async function getDistrictsByName(lea_name) {
  const [rows] = await pool.query(
    "SELECT * FROM school_districts WHERE lea_name = ?",
    [lea_name]
  )
  return rows
}

export async function getAllDistricts() {
  try {
      const [rows] = await pool.query(
          "SELECT leaid, lea_name FROM school_districts"
      )
      return rows
  } catch (err) {
      console.error('Error fetching all districts:', err)
      throw err
  }
}



export async function getFinanceData(leaid,year) {
  const [rows] = await pool.query(
    "SELECT * FROM finance_data WHERE leaid = ? AND year = ?",
    [leaid,year]
  )
  return rows
}

export async function getAllFinanceData(leaid) {
  const [rows] = await pool.query(
    "SELECT * FROM finance_data WHERE leaid = ?",
    [leaid]
  )
  return rows
 }

export async function getFinanceDataGroupedByYear(lea_name) {
  const districts = await getDistrictsByName(lea_name)
  if (districts.length === 0) {
    return 'No districts foumnd for district name: ${lea_name}'
  }

  const leaid = districts[0].leaid
  const [financeData] = await pool.query(
    "SELECT * FROM finance_data WHERE leaid = ? ORDER BY year",
    [leaid]
  )

  const groupedData = financeData.reduce((acc, row) => {
    const { year, ...data } = row
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(data)
    return acc
  }, {})
  return groupedData
}

  export async function exportTableToCSV(tableName, outputPath) {
    try {
      // Fetch table columns
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      
      // Create CSV writer with dynamic headers
      const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: columns.map(column => ({
          id: column.Field,
          title: column.Field
        }))
      });
  
      // Fetch all rows from the table
      const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
  
      // Write to CSV
      await csvWriter.writeRecords(rows);
  
      console.log(`Successfully exported ${rows.length} rows to ${outputPath}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

// const writeToCsv = async (filePath, headers, rows) => {
//   const csvWriter = createObjectCsvWriter({
//     path: filePath,
//     header: headers.map(header => ({ id: header, title: header })),
//   });
//   await csvWriter.writeRecords(rows);
//   console.log(`Data successfully written to ${filePath}`);
// };

// const exportFinanceDataToCsv = async (filePath) => {
//   const connection = await mysql.createConnection(dbConfig);
//   const [rows] = await connection.query('SELECT * FROM finance_data');
//   await connection.end();

//   if (rows.length > 0) {
//     const headers = Object.keys(rows[0]);
//     await writeToCsv(filePath, headers, rows);
//   } else {
//     console.log('No data found in the finance_data table.');
//   }
// };


// const { createCsvWriter } = require('csv-writer');

// async function exportFinanceData(outputPath){
//   try{
//     const [rows] = await db.promise
//   }
// }

//function to export the data from the finance_data table to a csv for visualization
export async function exportFinanceData() {
  try{
    const [rows] = await pool.query('SELECT * FROM finance_data');
    const csvWriter = createObjectCsvWriter({
      path: path.join(__dirname, '../public/finance_viz.csv'),
      header: [
        {id: 'leaid', title:'leaid'},
        {id: 'year', title:'year'},
        {id: 'phone', title:'phone'},
        {id: 'urban_centric_locale', title:'urban_centric_locale'},
        {id: 'number_of_schools', title:'number_of_schools'},
        {id: 'enrollment', title:'enrollment'},
        {id: 'teachers_total_fte', title:'teachers_total_fte'},
        {id: 'rev_total', title:'rev_total'},
        {id: 'rev_fed_total', title:'rev_fed_total'},
        {id: 'rev_state_total', title:'rev_state_total'},
        {id: 'rev_local_total', title:'rev_local_total'},
        {id: 'exp_total', title:'exp_total'},
        {id: 'exp_current_instruction_total', title:'exp_current_instruction_total'},
        {id: 'outlay_capital_total', title:'outlay_capital_total'},
        {id: 'payments_charter_schools', title:'payments_charter_schools'},
        {id: 'salaries_instruction', title:'salaries_instruction'},
        {id: 'benefits_employee_total', title:'benefits_employee_total'},
        {id: 'debt_interest', title:'debt_interest'},
        {id: 'debt_longterm_outstand_end_fy', title:'debt_longterm_outstand_end_fy'},
        {id: 'debt_shortterm_outstand_end_fy', title:'debt_shortterm_outstand_end_fy'},
        {id: 'name of school district', title:'name of school district'},
        {id: 'secured_net taxable value', title:'secured_net taxable value'},
        {id: 'unsecured_net taxable value', title:'unsecured_net taxable value'},
      ]
    });

    await csvWriter.writeRecords(rows);
    console.log('File have been written successfully');
  } catch (error) {
    console.error('Error exporting finance data.')
  }
}


export async function checkRowExists(leaid, year) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM finance_data WHERE leaid = ? AND year = ?',
        [leaid, year]
  );
  return rows[0].count > 0
}

export async function insertRow(data) {
  const query = 'INSERT INTO finance_data (leaid, year, phone, urban_centric_locale, number_of_schools, enrollment, teachers_total_fte, rev_total, rev_fed_total, rev_state_total, rev_local_total,exp_total, exp_current_instruction_total, outlay_capital_total, payments_charter_schools, salaries_instruction, benefits_employee_total, debt_interest, debt_longterm_outstand_end_fy, debt_shortterm_outstand_end_fy, name_of_school_district, secured_net_taxable_value, unsecured_net_taxable_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  await pool.query(query,data);
}






// export async function testQueries() {
//   const districts = await getDistrictsByName("Livermore Valley Joint Unified")
//   console.log("Districts:", districts)

//   if (districts.length > 0) {
//     const leaid = districts[0].leaid
//     const year = 2010
//     const financeData = await getFinanceData(leaid,year)
//     console.log('Finance data for leaid ${leaid} and year ${year}:', financeData)
//   }
// }

// async function testQueries() {
//   const lea_name = "Livermore Valley Joint Unified"
//   const financeDataGroupedByYear = await getFinanceDataGroupedByYear(lea_name)
//   console.log('Financial data grouped by year for ${lea_name}:', financeDataGroupedByYear)
// }


getDistrictsByName()
getFinanceData()
getFinanceDataGroupedByYear()
getAllDistricts()


//  // Function to get column names and data types for a specific table
// async function getColumnInfo(tableName) {
//     const [columns] = await pool.query(
//         `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
//         [process.env.MYSQL_DATABASE, tableName]
//     );
//     return columns;
// }

// // Function to get school district information by lea_name
// async function getDistrictByLeaName(lea_name) {
//     try {
//         // Query the school_districts table to get leaid and year by lea_name
//         const [districtRows] = await pool.query(
//             `SELECT leaid, year FROM school_districts WHERE lea_name = ?`,
//             [lea_name]
//         );

//         if (districtRows.length === 0) {
//             return [];
//         }

//         // Get column info for finance_data and district_info tables
//         const financeDataColumns = await getColumnInfo('finance_data');
//         const districtInfoColumns = await getColumnInfo('district_info');

//         // For each result, retrieve data from finance_data and district_info tables
//         const results = [];
//         for (const district of districtRows) {
//             const { leaid, year } = district;

//             // Get finance_data associated with this leaid and year
//             const [financeDataRows] = await pool.query(
//                 `SELECT * FROM finance_data WHERE leaid = ? AND year = ?`,
//                 [leaid, year]
//             );

//             // Get district_info associated with this leaid and year
//             const [districtInfoRows] = await pool.query(
//                 `SELECT * FROM district_info WHERE leaid = ? AND year = ?`,
//                 [leaid, year]
//             );

//             // Format finance_data with column names and types
//             const formattedFinanceData = financeDataRows.map(row => {
//                 const formattedRow = {};
//                 for (const col of financeDataColumns) {
//                     formattedRow[col.COLUMN_NAME] = {
//                         value: row[col.COLUMN_NAME],
//                         type: col.DATA_TYPE
//                     };
//                 }
//                 return formattedRow;
//             });

//             // Format district_info with column names and types
//             const formattedDistrictInfo = districtInfoRows.map(row => {
//                 const formattedRow = {};
//                 for (const col of districtInfoColumns) {
//                     formattedRow[col.COLUMN_NAME] = {
//                         value: row[col.COLUMN_NAME],
//                         type: col.DATA_TYPE
//                     };
//                 }
//                 return formattedRow;
//             });

//             // Consolidate information for each district
//             results.push({
//                 leaid,
//                 year,
//                 finance_data: formattedFinanceData,
//                 district_info: formattedDistrictInfo
//             });
//         }

//         return results;
//     } catch (error) {
//         console.error("Error fetching district information:", error);
//         throw error;
//     }
// }

// //  (async () => {
// //      const leaName = 'Livermore Valley Joint Unified'; 
// //      const data = await getDistrictByLeaName(leaName);
// //      console.log(JSON.stringify(data, null, 2));
// //  })();


// app.get('/api/districts', async (req, res) => {
//     const lea_name = req.query.lea_name;
//     if (!lea_name) {
//         return res.status(400).send({error: "lea_name query parameter is required"});
//     }

//     try {
//         const data = await getDistrictByLeaName(lea_name);
//         res.json(data);
//     } catch (error) {
//         console.error("Error fetching district data:", error);
//         res.status(500).send({error: "Internal server error"});
//     }
// });

// app.listen(port, () => {
//     console.log('Server running at http://localhost:${port}');
// })






// // app.get('/api/districts', async (req, res) => {
// //     const { name } = req.query;
// //     try {
// //         const districts = await pool.query(`
// //             SELECT leaid, year, lea_name 
// //             FROM school_districts 
// //             WHERE lea_name LIKE ?
// //         `, [`%${name}%`]);

// //         res.json(districts[0]);
// //     } catch (error) {
// //         console.error("Error fetching districts:", error);
// //         res.status(500).json({ error: 'Failed to fetch districts' });
// //     }
// // });

// // app.get('/api/district-data', async (req, res) => {
// //     const { leaid, year } = req.query;
// //     try {
// //         const [financeData] = await pool.query(`
// //             SELECT * FROM finance_data 
// //             WHERE leaid = ? AND year = ?
// //         `, [leaid, year]);

// //         const [districtInfo] = await pool.query(`
// //             SELECT * FROM district_info 
// //             WHERE leaid = ? AND year = ?
// //         `, [leaid, year]);

// //         res.json({ financeData, districtInfo });
// //     } catch (error) {
// //         console.error("Error fetching district data:", error);
// //         res.status(500).json({ error: 'Failed to fetch district data' });
// //     }
// // });