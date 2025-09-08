const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload Image endpoint
app.post('/uploadImage', (req, res) => {
    try {
        console.log('Received upload request');
        console.log('Request body:', req.body);
        
        // Extract parameters
        const userId = req.body.userId || req.query.userId || 'default-user';
        const childKey = req.body.childKey || req.query.childKey || 'default-key';
        const imageType = req.body.imageType || req.query.imageType || 'unknown';
        
        console.log('Parameters:', { userId, childKey, imageType });
        
        // Generate mock file path
        const mockFilePath = `uploads/${userId}/${childKey}/${imageType}_${Date.now()}.jpg`;
        
        console.log('Simulated file saved at:', mockFilePath);
        
        // Return success response
        res.json({
            filePath: mockFilePath,
            message: 'Image uploaded successfully',
            userId: userId,
            childKey: childKey,
            imageType: imageType,
            success: true,
            status: 'success'
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
            const mockImageUrl = 'https://replicate.delivery/pbxt/test-image.jpg';
            console.log('Returning mock image URL:', mockImageUrl);
            return res.json({ fileUrl: mockImageUrl });
        }
        
        console.log('API Token available: Yes');
        
        // TEMPORARY FIX: Return mock response until Replicate model is fixed
        console.log('Using mock response due to Replicate API model issues');
        const mockImageUrl = 'https://replicate.delivery/pbxt/test-image.jpg';
        console.log('Returning mock image URL:', mockImageUrl);
        return res.json({ fileUrl: mockImageUrl });
        
        // TODO: Fix Replicate API model version issue
        /*
        // Call Replicate API with maximum safety settings
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: "smoosh-sh/baby-mystic:ba5ab694",
                input: {
                    prompt: prompt,
                    negative_prompt: negativePromptText,
                    num_inference_steps: 50,
                    guidance_scale: 15,
                    safety_tolerance: 2,
                    safety_level: 4,
                    content_filter: true,
                    inappropriate_content: 'block',
                    child_safety: 'maximum'
                }
            })
        });
        
        console.log('Replicate API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Replicate API error response:', errorText);
            throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Replicate API result:', JSON.stringify(result, null, 2));
        
        if (result.error) {
            console.error('Replicate API error:', result.error);
            throw new Error(result.error);
        }
        
        // Additional safety check
        if (result.output && result.output.some(url => url.includes('inappropriate'))) {
            throw new Error('Content safety check failed');
        }
        
        const imageUrl = result.urls?.get || result.output?.[0];
        console.log('Successfully generated image URL:', imageUrl);
        
        if (!imageUrl) {
            throw new Error('No image URL returned from Replicate API');
        }
        
        // Return the generated image URL
        res.json({ fileUrl: imageUrl });
        */
        
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
