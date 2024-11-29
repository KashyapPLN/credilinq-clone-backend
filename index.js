import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import fs from 'fs';

const app = express();
app.use(cors());
dotenv.config();
const PORT = process.env.PORT;

// MongoDB connection
async function createConnection() {
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  console.log("Mongo db is connected");
  return client;
}

export const client = createConnection();


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST route for form submission with PDF files
app.post('/submit', upload.array('uploadedFiles', 6), async (req, res) => {

  const { companyUEN, companyName, FullName, position, email, mobile } = req.body;
  const uploadedFiles = req.body.uploadedFiles;
   console.log(uploadedFiles);
 
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const files = uploadedFiles.map(file => ({
    filename: file.originalname,
    data: file.buffer,
    contentType: file.mimetype,
  }));


  const formData = {
    companyUEN,
    companyName,
    FullName,
    position,
    email,
    mobile,
    uploadedFiles: files,
  };

  try {
    const db = (await client).db('credilinq-clone');
    const collection = db.collection('forms');

    const result = await collection.insertOne(formData);
    res.status(200).json({ message: 'Form submitted successfully'});
  } catch (error) {
    console.error('Error saving form data:', error);
    res.status(500).json({ message: 'Error saving form data' });
  }
});

// GET route to retrieve all documents excluding the 'uploadedFiles' array
app.get('/forms', async (req, res) => {
  try {
    const db = (await client).db('credilinq-clone');
    const collection = db.collection('forms');
    
 
    const forms = await collection.find({}, { projection: { uploadedFiles: 0 } }).toArray();

    res.status(200).json(forms);
  } catch (error) {
    console.error('Error retrieving forms:', error);
    res.status(500).json({ message: 'Error retrieving forms' });
  }
});

app.listen(PORT, () => {
  console.log(`App started at ${PORT}`);
});
