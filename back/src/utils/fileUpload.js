/**
 * File Upload Utility Functions
 * 
 * This file contains utility functions for handling file uploads to Supabase
 * and saving resource information to MongoDB.
 */

const { supabase } = require("../config/supabase");
const Resource = require("../models/Resource");

/**
 * Sanitize a filename to remove special characters and spaces
 * @param {string} name - The original filename
 * @returns {string} - The sanitized filename
 */
const sanitizeFilename = (name) => {
  // Replace spaces, accents and special characters
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace other special chars with underscore
};

/**
 * Validate file format against a list of allowed formats
 * @param {string} filename - The original filename
 * @param {string[]} validFormats - Array of allowed file extensions
 * @returns {Object} - Object containing validation result and file extension
 */
const validateFileFormat = (filename, validFormats) => {
  const fileExtension = filename.split(".").pop()?.toLowerCase();
  
  if (!fileExtension || !validFormats.includes(fileExtension)) {
    return {
      valid: false,
      message: `Invalid file format. Must be one of: ${validFormats.join(", ")}`,
      extension: null
    };
  }
  
  return {
    valid: true,
    message: "Valid file format",
    extension: fileExtension
  };
};

/**
 * Validate MIME type against a list of allowed types
 * @param {string} mimeType - The file's MIME type
 * @param {string[]} validMimeTypes - Array of allowed MIME types
 * @returns {Object} - Object containing validation result
 */
const validateMimeType = (mimeType, validMimeTypes) => {
  if (!validMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      message: `Invalid file type. File appears to be ${mimeType} but must be one of the allowed types.`
    };
  }
  
  return {
    valid: true,
    message: "Valid MIME type"
  };
};

/**
 * Upload a file to Supabase storage
 * @param {Object} file - The file object from multer
 * @param {string} bucketName - The name of the Supabase bucket
 * @param {string} folderPath - Optional folder path within the bucket
 * @returns {Promise<Object>} - Object containing upload result
 */
const uploadFileToSupabase = async (file, bucketName, folderPath = "") => {
  try {
    console.log(`Starting upload to ${bucketName} bucket...`);
    
    // Sanitize the filename
    const sanitizedName = sanitizeFilename(file.originalname);
    const fileName = folderPath 
      ? `${folderPath}/${Date.now()}-${sanitizedName}`
      : `${Date.now()}-${sanitizedName}`;
    
    console.log("Original filename:", file.originalname);
    console.log("Sanitized filename:", sanitizedName);
    console.log("Final path:", fileName);
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: true, // Overwrite if file already exists
    });
    
    if (error) {
      console.error("Supabase upload error:", error);
      return {
        success: false,
        message: `Failed to upload to Supabase: ${error.message}`,
        error
      };
    }
    
    console.log("Supabase upload successful:", data);
    
    // Retrieve the public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl || typeof publicUrl !== "string") {
      return {
        success: false,
        message: "Failed to retrieve a valid public URL from Supabase"
      };
    }
    
    console.log("Public URL:", publicUrl);
    
    return {
      success: true,
      message: "File uploaded successfully",
      url: publicUrl,
      data
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      message: `Upload error: ${error.message}`,
      error
    };
  }
};

/**
 * Save resource information to MongoDB
 * @param {Object} resourceData - The resource data to save
 * @returns {Promise<Object>} - Object containing save result
 */
const saveResourceToDatabase = async (resourceData) => {
  try {
    const newResource = new Resource(resourceData);
    await newResource.save();
    
    console.log(`${resourceData.type} saved to MongoDB:`, newResource);
    
    return {
      success: true,
      message: `${resourceData.type} saved successfully`,
      resource: newResource
    };
  } catch (error) {
    console.error("Database save error:", error);
    return {
      success: false,
      message: `Database save error: ${error.message}`,
      error
    };
  }
};

module.exports = {
  sanitizeFilename,
  validateFileFormat,
  validateMimeType,
  uploadFileToSupabase,
  saveResourceToDatabase
};
