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
        
        // Get Replicate API token from environment variable
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) {
            throw new Error('REPLICATE_API_TOKEN environment variable is not set');
        }
        
        // Call Replicate API with maximum safety settings
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${replicateToken}`,
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
        
        const prediction = await createResponse.json();
        
        if (prediction.error) {
            console.error('Replicate API error:', prediction.error);
            throw new Error(prediction.error);
        }
        
        if (!prediction.id) {
            throw new Error('Failed to create prediction: No prediction ID returned');
        }
        
        console.log('Prediction created:', prediction.id);
        console.log('Prediction status:', prediction.status);
        
        // Poll for prediction completion
        let result = prediction;
        let pollCount = 0;
        const maxPolls = 120; // Maximum 2 minutes (120 * 1 second)
        
        while ((result.status === 'starting' || result.status === 'processing') && pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                headers: {
                    'Authorization': `Token ${replicateToken}`,
                }
            });
            
            result = await pollResponse.json();
            pollCount++;
            
            console.log(`Poll ${pollCount}: Status = ${result.status}`);
            
            if (result.error) {
                console.error('Replicate polling error:', result.error);
                throw new Error(result.error);
            }
        }
        
        // Check final status
        if (result.status === 'succeeded') {
            // Extract the actual output URL
            let outputUrl = null;
            
            if (result.output) {
                // Output can be a string, array, or object
                if (typeof result.output === 'string') {
                    outputUrl = result.output;
                } else if (Array.isArray(result.output) && result.output.length > 0) {
                    outputUrl = result.output[0];
                } else if (result.output.url) {
                    outputUrl = result.output.url;
                }
            }
            
            // Fallback to urls.get if output is not available
            if (!outputUrl && result.urls && result.urls.get) {
                outputUrl = result.urls.get;
            }
            
            if (!outputUrl) {
                console.error('No output URL found in result:', JSON.stringify(result, null, 2));
                throw new Error('Replicate prediction succeeded but no output URL found');
            }
            
            // Additional safety check
            if (outputUrl.includes('inappropriate') || outputUrl.includes('placeholder')) {
                throw new Error('Content safety check failed - placeholder detected');
            }
            
            console.log('✅ Successfully generated image URL:', outputUrl);
            
            // Return the ACTUAL Replicate output URL
            res.json({ 
                fileUrl: outputUrl,
                status: 'success',
                predictionId: result.id
            });
            
        } else if (result.status === 'failed') {
            console.error('Replicate prediction failed:', result.error);
            res.status(500).json({ 
                error: 'Replicate prediction failed: ' + (result.error || 'Unknown error'),
                status: 'failed'
            });
        } else {
            console.error('Prediction timed out or unknown status:', result.status);
            res.status(500).json({ 
                error: 'Prediction did not complete. Status: ' + result.status,
                status: result.status
            });
        }
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate image safely: ' + error.message });
    }
});

// Generate Older (Face Aging) endpoint
app.post('/generateOlder', async (req, res) => {
    try {
        console.log('Received generate older request');
        console.log('Request body:', req.body);
        
        const { userId, childKey, age } = req.body;
        
        // Get the uploaded aging image path
        const imagePath = `uploads/${userId}/${childKey}/aging_*.jpg`;
        
        // Get Replicate API token from environment variable
        const replicateToken = process.env.REPLICATE_API_TOKEN;
        if (!replicateToken) {
            throw new Error('REPLICATE_API_TOKEN environment variable is not set');
        }
        
        // Note: You'll need to implement actual file reading and Replicate API call here
        // This is a placeholder - you need to:
        // 1. Read the uploaded image file
        // 2. Call Replicate API for face aging
        // 3. Poll for completion
        // 4. Return the actual output URL
        
        // For now, this is a template - you'll need to adapt it based on your Replicate model
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${replicateToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: "YOUR_AGING_MODEL_VERSION", // Replace with actual model
                input: {
                    image: imagePath, // You'll need to convert to base64 or upload to a URL
                    age: age || 50
                }
            })
        });
        
        const prediction = await createResponse.json();
        
        if (prediction.error) {
            console.error('Replicate API error:', prediction.error);
            throw new Error(prediction.error);
        }
        
        if (!prediction.id) {
            throw new Error('Failed to create prediction: No prediction ID returned');
        }
        
        console.log('Aging prediction created:', prediction.id);
        
        // Poll for completion (same pattern as generateChild)
        let result = prediction;
        let pollCount = 0;
        const maxPolls = 120;
        
        while ((result.status === 'starting' || result.status === 'processing') && pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                headers: {
                    'Authorization': `Token ${replicateToken}`,
                }
            });
            
            result = await pollResponse.json();
            pollCount++;
            console.log(`Aging poll ${pollCount}: Status = ${result.status}`);
        }
        
        if (result.status === 'succeeded') {
            let outputUrl = null;
            
            if (result.output) {
                if (typeof result.output === 'string') {
                    outputUrl = result.output;
                } else if (Array.isArray(result.output) && result.output.length > 0) {
                    outputUrl = result.output[0];
                } else if (result.output.url) {
                    outputUrl = result.output.url;
                }
            }
            
            if (!outputUrl && result.urls && result.urls.get) {
                outputUrl = result.urls.get;
            }
            
            if (!outputUrl) {
                throw new Error('Replicate prediction succeeded but no output URL found');
            }
            
            console.log('✅ Successfully generated aging image URL:', outputUrl);
            
            res.json({ 
                fileUrl: outputUrl,
                status: 'success',
                predictionId: result.id
            });
        } else {
            res.status(500).json({ 
                error: 'Aging prediction failed: ' + (result.error || result.status),
                status: result.status
            });
        }
        
    } catch (error) {
        console.error('Aging generation error:', error);
        res.status(500).json({ error: 'Failed to generate aging image: ' + error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Child Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`AI Child Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});
