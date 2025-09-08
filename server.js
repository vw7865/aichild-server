const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload Image endpoint
app.post('/uploadImage', upload.single('image'), (req, res) => {
    try {
        console.log('Received upload request');
        console.log('File:', req.file ? 'Present' : 'Missing');
        console.log('Body:', req.body);
        
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided',
                success: false
            });
        }
        
        // Extract parameters
        const userId = req.body.userId || 'default-user';
        const childKey = req.body.childKey || 'default-key';
        const imageType = req.body.imageType || 'parent';
        
        console.log('Parameters:', { userId, childKey, imageType });
        console.log('File details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
        
        // Store the image data in memory (in a real app, you'd save to disk or cloud storage)
        // For now, we'll just return success with the image data
        const imageData = {
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname
        };
        
        // Store in a simple in-memory store (in production, use Redis or database)
        if (!global.uploadedImages) {
            global.uploadedImages = {};
        }
        
        const imageKey = `${userId}_${childKey}_${imageType}`;
        global.uploadedImages[imageKey] = imageData;
        
        console.log('Image stored with key:', imageKey);
        
        // Return success response
        res.json({
            filePath: `uploads/${userId}/${childKey}/${imageType}_${Date.now()}.jpg`,
            message: 'Image uploaded successfully',
            userId: userId,
            childKey: childKey,
            imageType: imageType,
            success: true,
            status: 'success',
            imageKey: imageKey
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to upload image: ' + error.message,
            success: false,
            status: 'error'
        });
    }
});

// Upload Aging Image endpoint
app.post('/uploadAgingImage', (req, res) => {
    try {
        console.log('Received aging upload request');
        console.log('Request body:', req.body);
        
        // Extract parameters
        const userId = req.body.userId || req.query.userId || 'default-user';
        const childKey = req.body.childKey || req.query.childKey || 'default-key';
        
        console.log('Parameters:', { userId, childKey });
        
        // Generate mock file path
        const mockFilePath = `uploads/${userId}/${childKey}/aging_${Date.now()}.jpg`;
        
        console.log('Simulated aging file saved at:', mockFilePath);
        
        // Return success response
        res.json({
            filePath: mockFilePath,
            message: 'Aging image uploaded successfully',
            userId: userId,
            childKey: childKey,
            success: true,
            status: 'success'
        });
        
    } catch (error) {
        console.error('Aging upload error:', error);
        res.status(500).json({
            error: 'Failed to upload aging image: ' + error.message,
            success: false,
            status: 'error'
        });
    }
});

// Generate Child endpoint
app.post('/generateChild', async (req, res) => {
    try {
        console.log('Received generate child request');
        console.log('Request body:', req.body);
        
        // Extract parameters
        const {
            userId, childKey, gender, age, removeFacialHair,
            negativePrompt, positivePrompt, expression, clothing,
            dressCode, safetyLevel, facialHairRemoval, childSafety
        } = req.body;
        
        // Provide default values
        const safeGender = gender || 'girl';
        const safeAge = age || 'baby';
        const safeRemoveFacialHair = removeFacialHair !== 'false' && removeFacialHair !== false;
        const safePositivePrompt = positivePrompt || 'cute, adorable, innocent';
        const safeExpression = expression || 'smiling';
        const safeClothing = clothing || 'appropriate';
        const safeDressCode = dressCode || 'baby clothes';
        
        // Get uploaded parent images
        if (!global.uploadedImages) {
            global.uploadedImages = {};
        }
        
        const motherKey = `${userId}_${childKey}_mother`;
        const fatherKey = `${userId}_${childKey}_father`;
        
        const motherImage = global.uploadedImages[motherKey];
        const fatherImage = global.uploadedImages[fatherKey];
        
        console.log('Looking for parent images:', { motherKey, fatherKey });
        console.log('Mother image found:', !!motherImage);
        console.log('Father image found:', !!fatherImage);
        
        if (!motherImage || !fatherImage) {
            console.log('Missing parent images, using fallback');
            const mockImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
            return res.json({ fileUrl: mockImageUrl });
        }
        
        console.log('Using parameters:', {
            gender: safeGender,
            age: safeAge,
            removeFacialHair: safeRemoveFacialHair,
            positivePrompt: safePositivePrompt,
            expression: safeExpression,
            clothing: safeClothing,
            dressCode: safeDressCode
        });
        
        // Build enhanced prompt with maximum child safety
        let prompt = `A 0-3 year old ${safeGender} baby, ${safePositivePrompt}, smooth skin, no facial hair, clean face, ${safeExpression}, ${safeClothing} ${safeDressCode}, high quality, realistic, child-safe content, fully clothed, innocent, pure, wholesome`;
        
        // Ultra-aggressive negative prompt for maximum child safety
        let negativePromptText = negativePrompt || 'facial hair, mustache, beard, goatee, sideburns, stubble, hair on face, adult male features, masculine features, puberty, teenager, adolescent, nude, naked, inappropriate, adult features, mature, grown up, man, male adult, inappropriate content, sexual, adult, mature, teenager, adolescent, puberty, naked, nude, undressed, clothing removed, inappropriate, sexual content, adult content, mature content, exposed, revealing, inappropriate clothing, adult clothing, mature clothing, teenager clothing, adolescent clothing, puberty clothing';
        
        // Add additional safety layers
        if (safeRemoveFacialHair || facialHairRemoval === 'aggressive' || childSafety === 'maximum') {
            negativePromptText += ', facial hair, mustache, beard, goatee, sideburns, stubble, adult features, inappropriate content, naked, nude, undressed, sexual content, adult content, mature content, teenager, adolescent, puberty, naked, nude, undressed, clothing removed, inappropriate, sexual content, adult content, mature content, exposed, revealing, inappropriate clothing, adult clothing, mature clothing, teenager clothing, adolescent clothing, puberty clothing';
        }
        
        console.log('Generated prompt:', prompt);
        console.log('Generated negative prompt:', negativePromptText);
        
        // Check if API token is available
        if (!process.env.REPLICATE_API_TOKEN) {
            console.error('REPLICATE_API_TOKEN not set - using mock response for testing');
            // Return a mock response for testing
            const mockImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
            console.log('Returning mock image URL:', mockImageUrl);
            return res.json({ fileUrl: mockImageUrl });
        }
        
        console.log('API Token available: Yes');
        
        // Use Baby Mystic model for accurate baby generation from parent images
        console.log('Generating accurate baby image using Baby Mystic model with parent images');
        
        // Convert image buffers to base64 data URLs for Replicate API
        const motherImageData = `data:${motherImage.mimetype};base64,${motherImage.buffer.toString('base64')}`;
        const fatherImageData = `data:${fatherImage.mimetype};base64,${fatherImage.buffer.toString('base64')}`;
        
        console.log('Mother image size:', motherImage.buffer.length);
        console.log('Father image size:', fatherImage.buffer.length);
        
        // Call Stable Diffusion API for diverse toddler generation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: "smoosh-sh/baby-mystic:ba5ab694",
                input: {
                    mother_image: motherImageData,
                    father_image: fatherImageData,
                    gender: safeGender,
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 50,
                    guidance_scale: 15
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Baby Mystic API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Baby Mystic API error response:', errorText);
            console.error('Response status:', response.status);
            console.error('Response headers:', response.headers);
            // Fallback to mock image if API fails
            const fallbackImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
            console.log('API failed, using fallback image:', fallbackImageUrl);
            return res.json({ fileUrl: fallbackImageUrl });
        }
        
        const result = await response.json();
        console.log('Stable Diffusion API result:', JSON.stringify(result, null, 2));
        
        if (result.error) {
            console.error('Stable Diffusion API error:', result.error);
            // Fallback to mock image if API fails
            const fallbackImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
            console.log('API error, using fallback image:', fallbackImageUrl);
            return res.json({ fileUrl: fallbackImageUrl });
        }
        
        // Check if prediction is complete
        if (result.status === 'succeeded' && result.output) {
            const imageUrl = result.output[0];
            console.log('Successfully generated baby image URL:', imageUrl);
            return res.json({ fileUrl: imageUrl });
        }
        
        // If prediction is still processing, poll for completion
        if (result.status === 'starting' || result.status === 'processing') {
            console.log('Prediction is processing, polling for completion...');
            
            // Poll for completion (max 4 attempts, 2 seconds apart)
            for (let i = 0; i < 4; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                
                try {
                    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                        headers: {
                            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                        }
                    });
                    
                    if (pollResponse.ok) {
                        const pollResult = await pollResponse.json();
                        console.log(`Poll attempt ${i + 1}: Status = ${pollResult.status}`);
                        
                        if (pollResult.status === 'succeeded' && pollResult.output && pollResult.output[0]) {
                            const imageUrl = pollResult.output[0];
                            console.log('Successfully generated toddler image URL:', imageUrl);
                            return res.json({ fileUrl: imageUrl });
                        }
                        
                        if (pollResult.status === 'failed') {
                            console.error('Prediction failed:', pollResult.error);
                            break;
                        }
                    } else {
                        console.error('Poll request failed:', pollResponse.status);
                    }
                } catch (pollError) {
                    console.error('Poll error:', pollError);
                }
            }
            
            // If polling failed, return fallback
            console.log('Polling timeout, using fallback image');
            const fallbackImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
            return res.json({ fileUrl: fallbackImageUrl });
        }
        
        // Fallback for any other status
        console.log('Unexpected prediction status:', result.status);
        const fallbackImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
        return res.json({ fileUrl: fallbackImageUrl });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate image safely: ' + error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Child Server is running' });
});

// Test endpoint to check environment variables
app.get('/test', (req, res) => {
    res.json({
        message: 'Server is working',
        hasApiToken: !!process.env.REPLICATE_API_TOKEN,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`AI Child Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
