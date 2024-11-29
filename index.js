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

// Set up multer storage for handling file uploads (in memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST route for form submission with PDF files
app.post('/submit', upload.array('uploadedFiles', 6), async (req, res) => {
  // Destructure other fields from req.body
  const { companyUEN, companyName, FullName, position, email, mobile } = req.body;

  // Access uploaded files directly from req.files
  const uploadedFiles = req.body.uploadedFiles; // Files are stored in req.files array by multer
   console.log(uploadedFiles);
  // Check if files are uploaded
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  // Manually structure files in the required format for saving to MongoDB
  const files = uploadedFiles.map(file => ({
    filename: file.originalname,
    data: file.buffer, // Store file as Buffer in the database
    contentType: file.mimetype,
  }));

  // Create the form data object to save in the database
  const formData = {
    companyUEN,
    companyName,
    FullName,
    position,
    email,
    mobile,
    uploadedFiles: files, // Attach the files as part of the form data
  };

  try {
    const db = (await client).db('credilinq-clone');
    const collection = db.collection('forms');

    // Insert form data including files into the database
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
    
    // Find all documents, excluding the 'uploadedFiles' field
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
