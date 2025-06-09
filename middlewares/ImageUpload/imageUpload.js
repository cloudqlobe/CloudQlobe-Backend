const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;


const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
 });

 const upload = multer({ storage });

 cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
 });

 const imageUpload = (req, res, next) => {
    upload.single("image")(req, res, async (err) => {
       if (err) {
          return res.status(400).json({ error: err.message });
       }
       try {
          const result = await cloudinary.uploader.upload(req.file.path, {
             folder: "CloudQloube-imgs"
          });
          req.body.image = result.secure_url;
          
 
          fs.unlink(req.file.path, (error) => {
             if (error) {
                console.log("Error deleting local file", error);
             }
          });
 
          next();
       } catch (error) {
          return res.status(500).json({ message: "Error uploading file to Cloudinary" });
       }
    });
 };
 
 module.exports = imageUpload;