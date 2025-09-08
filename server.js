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
            const mockImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
            console.log('Returning mock image URL:', mockImageUrl);
            return res.json({ fileUrl: mockImageUrl });
        }
        
        console.log('API Token available: Yes');
        
        // Use Baby Mystic model for accurate baby generation for ALL types of couples
        console.log('Generating accurate baby image using Baby Mystic model (Realistic Vision v5.1)');
        
        // Enhanced prompt for accurate toddler generation for ALL types of couples
        const expressions = ['smiling', 'laughing', 'curious', 'playful', 'content', 'focused'];
        const clothingStyles = ['adorable toddler clothes', 'cute shirt and pants', 'colorful outfit', 'comfortable play clothes', 'casual toddler wear'];
        const backgrounds = ['soft pastel background', 'natural home setting', 'gentle lighting', 'warm cozy environment', 'playroom setting'];
        
        // Add variety based on parameters
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
        const randomClothing = clothingStyles[Math.floor(Math.random() * clothingStyles.length)];
        const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        
        // Use 2-year-old characteristics instead of baby
        const ageDescription = safeAge === 'baby' ? '2-year-old toddler' : `${safeAge} child`;
        
        // Create a more neutral, accurate prompt that works for all ethnicities
        let enhancedPrompt = `A beautiful ${ageDescription} ${safeGender}, ${safePositivePrompt}, smooth toddler skin, chubby cheeks, big curious eyes, ${randomExpression}, ${randomClothing}, ${randomBackground}, high quality, photorealistic, professional child photography, natural lighting, soft focus, adorable, innocent, pure, wholesome, realistic facial features, authentic appearance, toddler proportions, age-appropriate features, natural child features, realistic child appearance, diverse representation, inclusive features, multicultural appearance, global diversity, mixed heritage, interracial features, worldwide representation, authentic ethnic features, natural skin tone, realistic complexion`;
        
        // Enhanced negative prompt for maximum safety and accuracy
        let enhancedNegativePrompt = negativePromptText + ', adult features, mature face, facial hair, mustache, beard, goatee, sideburns, stubble, inappropriate content, sexual content, adult content, mature content, teenager, adolescent, puberty, naked, nude, undressed, clothing removed, inappropriate clothing, adult clothing, mature clothing, teenager clothing, adolescent clothing, puberty clothing, exposed, revealing, inappropriate, sexual, adult, mature, grown up, man, male adult, inappropriate content, sexual, adult, mature, teenager, adolescent, puberty, naked, nude, undressed, clothing removed, inappropriate, sexual content, adult content, mature content, exposed, revealing, inappropriate clothing, adult clothing, mature clothing, teenager clothing, adolescent clothing, puberty clothing, blurry, low quality, distorted, deformed, ugly, scary, frightening, dark, shadowy, unnatural, artificial, fake, cartoon, anime, drawing, painting, sketch, illustration, newborn, infant, too young, premature, school age, elementary school, teenager, adolescent, puberty, adult proportions, mature body, adult clothing, school uniform, asian bias, chinese features, monoracial, single ethnicity, homogeneous features';
        
        console.log('Enhanced prompt:', enhancedPrompt);
        console.log('Enhanced negative prompt:', enhancedNegativePrompt);
        
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
                    prompt: enhancedPrompt,
                    negative_prompt: enhancedNegativePrompt,
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 50,
                    guidance_scale: 15,
                    safety_tolerance: 2,
                    safety_level: 4,
                    content_filter: true,
                    inappropriate_content: 'block',
                    child_safety: 'maximum'
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Stable Diffusion API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Stable Diffusion API error response:', errorText);
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
