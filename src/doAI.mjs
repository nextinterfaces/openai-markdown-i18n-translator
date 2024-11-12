// Load environment variables (e.g., OpenAI API key) from the .env file
import 'dotenv/config'

// Import the OpenAI client library
import OpenAI from "openai"

// Import the HEADER_TOKEN constant for marking AI-generated content headers
import { HEADER_TOKEN } from "./utils.mjs"

// Initialize a new OpenAI client instance for making API requests
const openai = new OpenAI()

// Debugging: Print a partial view of the OpenAI API key to verify it was loaded correctly (without exposing the full key)
console.log(`OPENAI_API_KEY: "${process.env.OPENAI_API_KEY?.substring(0, 10)}..."`)

// Function to send a message to OpenAI's API and process the response
async function callOpenAI(text, openaiConf) {
    // Track the execution time of the API call for performance monitoring
    console.time('  OpenAI execution time')

    // Skip processing if the input text is too short
    if (text?.trim().length < 5) {
        return text
    }

    try {
        // Log the OpenAI configuration being used (e.g., model, temperature)
        console.log('  AI Config:', openaiConf)

        // Send a chat message to OpenAI using the provided configuration
        const completion = await openai.chat.completions.create({
            model: openaiConf.model,  // Specify the model to use (e.g., GPT-4)
            messages: [
                // temperature: 0.2  // Lower values produce more focused output
                // top_p: 0.9  // Limit sampling to the most probable tokens for more accurate processing
                // stop: ["some-marker"]  // Stop processing at "some-marker"
                // logit_bias: {'50256': -100}  // Example: strongly avoiding a specific token
                // max_tokens: 100  // Set a reasonable limit for translation tasks
                // Define a system message with configuration instructions for OpenAI
                { role: 'system', content: openaiConf.prompt },
                // Include the user input text for OpenAI to process
                { role: 'user', content: text }
            ]
        })

        // Retrieve the first choice (response) from OpenAI's response
        const choices = completion.choices[0]

        // Create a copy of the choice content with a truncated preview for logging
        const clonedChoices = { ...choices, message: { ...choices.message } }
        clonedChoices.message.content = choices.message?.content?.substring(0, 100) + '------ ... ------' + choices.message?.content?.slice(-100)

        // Log the OpenAI response preview for debugging purposes
        console.log('  OpenAI response:', clonedChoices)

        // Check if the response was truncated due to length constraints
        if (clonedChoices.finish_reason === 'length') {
            console.error('warn: !! OpenAI truncated text due to finish_reason=length')
        }

        // End timing the API call for execution time tracking
        console.timeEnd('  OpenAI execution time')

        // Normalize the AI response by adding a header token to mark it for special handling
        let normalizedAI = normalizeAI(choices.message.content)
        return normalizedAI

    } catch (error) {
        // Log and rethrow any errors encountered during the API call
        console.error('Error during translation:', error, error?.error)
        throw error
    }
}

// Function to add a header token to the AI response content
function normalizeAI(content) {
    // Inject HEADER_TOKEN at the beginning of the content to standardize output format
    return `${HEADER_TOKEN}\n${content}`
}

// Exported function to process content with OpenAI, serving as a wrapper for callOpenAI
export async function doAI(content, openaiConf) {
    return await callOpenAI(content, openaiConf)
}
