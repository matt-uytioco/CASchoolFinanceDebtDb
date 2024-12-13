import mysql from 'mysql2'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import csvParser from 'csv-parser'
import multer from 'multer'
import fs from 'fs'


import { getDistrictsByName, getFinanceData, getFinanceDataGroupedByYear, getAllDistricts, getAllFinanceData, exportFinanceData, exportTableToCSV, checkRowExists, insertRow} from './database.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const PORT = process.env.PORT || 3000

const upload = multer({ dest: 'uploads/'});



app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json())
app.use(cors({
  origin: ['http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',  
        'http://127.0.0.1:3000'], 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))


// Serve static files
// app.use(express.static(path.join(__dirname, '../frontend/public')));


app.get("/api/districts", async (req,res) => {
  //const { lea_name } = req.query
  // if (!lea_name) {
  //   return res.status(400).json({ error: 'lea_name query parameter is required' })
  // }
  // try {
  //   const districts = await getDistrictsByName(lea_name)
  //   res.json(districts)
  // }
  try {
    const districts = await getAllDistricts()
    res.json(districts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch districts' })
  }
})



app.get('/api/all-districts', async (req, res) => {
  try {
      const districts = await getAllDistricts() 
      res.json(districts)
  } catch (err) {
      console.error('Error fetching all districts:', err)
      res.status(500).json({ error: 'Failed to fetch all districts' }) 
  }
})



app.get('/api/finance-data-grouped', async (req, res) => {
  const { lea_name } = req.query
  if (!lea_name) {
      return res.status(400).json({ error: 'lea_name query parameter is required' })
  }
  try {
      const financeData = await getFinanceDataGroupedByYear(lea_name)
      res.json(financeData)
  } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to fetch finance data grouped by year' })
  }
})


app.get('/api/finance-data', async (req, res) => {
  const { leaid, year } = req.query
  if (!leaid || !year) {
      return res.status(400).json({ error: 'leaid and year query parameters are required' })
  }
  try {
      const financeData = await getFinanceData(leaid, year)
      res.json(financeData)
  } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to fetch finance data' })
  }
})


// gets all finance data for a specific district, searches based on leaid
app.get('/api/district-finance-data', async (req, res) => {
  const { leaid } = req.query
  if (!leaid) {
    return res.status(400).json({ error: 'leaid query parameter is required '})
  }
  try {
    const allFinanceData = await getAllFinanceData(leaid)
    res.json(allFinanceData)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch finance data for this leaid '})
  }
})

// // Catch-all route to serve the index.html for client-side routing
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', '../frontend/public/data_viz.html'));
// });


//API to send csv to backend and update the visualization aspect of website
app.get('/api/export-finance-data', async (req,res) => {
  try {
    await exportFinanceData();
    res.download(path.join(__dirname, 'finance_data_viz.csv'), 'finance_data_viz.csv')
  } catch (error) {
    res.status(500).send('Error generating data')
  }
})

app.get('/api/export', async (req, res) => {
  try {
    await exportTableToCSV('finance_data', './exported_data.csv');
    res.send('Export completed');
  } catch (error) {
    res.status(500).send('Export failed');
  }
});

//API called to upload a csv file and add rows to the finance_data table in database
app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath).pipe(csv()).on('data', (row) => {
    results.push(row);
  })
  .on('end',async () => {
    try {
      for (const row of results) {
        const leaid = row.leaid;
        const year = row.year;

        const exists = await checkRowExists(leaid, year);
        if (!exists) {
          const data = [
            row.leaid, row.year, row.phone, row.urban_centric_locale,
            row.number_of_schools, row.enrollment, row.teachers_total_fte,
            row.rev_total, row.rev_fed_total, row.rev_state_total,
            row.rev_local_total, row.exp_total, row.exp_current_instruction_total,
            row.outlay_capital_total, row.payments_charter_schools,
            row.salaries_instruction, row.benefits_employee_total,
            row.debt_interest, row.debt_longterm_outstand_end_fy,
            row.debt_shortterm_outstand_end_fy, row['name of school district'],
            row.secured_net_taxable_value, row.unsecured_net_taxable_value,
        ];
        await insertRow(data);
        }
      }
      res.status(200).send('CSV data processed and inserted.');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while processing the CSV.');
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});





// // Route to search `lea_name` and get related `leaid` and `year` values
// app.get('/school_districts/:lea_name', async (req, res) => {
//   const { lea_name } = req.params;

//   try {
//     const [schoolDistrictRows] = await db.query(
//       `SELECT leaid, year FROM school_districts WHERE lea_name = ?`,
//       [lea_name]
//     );

//     if (schoolDistrictRows.length === 0) {
//       return res.status(404).json({ message: 'No records found for this lea_name.' });
//     }

//     // Retrieve finance and district info for each leaid and year found
//     const data = await Promise.all(
//       schoolDistrictRows.map(async ({ leaid, year }) => {
//         const [financeData] = await db.query(
//           `SELECT * FROM finance_data WHERE leaid = ? AND year = ?`,
//           [leaid, year]
//         );
//         const [districtInfo] = await db.query(
//           `SELECT * FROM district_info WHERE leaid = ? AND year = ?`,
//           [leaid, year]
//         );

//         return {
//           leaid,
//           year,
//           financeData: financeData[0] || null,
//           districtInfo: districtInfo[0] || null
//         };
//       })
//     );

//     res.json({ lea_name, data });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'An error occurred while fetching data.' });
//   }
// });