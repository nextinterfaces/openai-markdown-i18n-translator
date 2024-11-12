import path from "path"
import fs from "fs/promises"

// Define a token to mark headers in content that should not be translated
export const HEADER_TOKEN = '<notranslate>meta_header</notranslate>'

// Define words that should be excluded from translation
export const excludedWords = [
    'id:',  // Exclude ID labels from translation
    'title:',  // Exclude title labels from translation
    'description:'  // Exclude description labels from translation
]

// Function to normalize file paths by generating paths for text, code, and original content versions
export function normalizedPaths(filePath) {
    // Extract the file extension
    const ext = path.extname(filePath)

    // Create a base file path by removing the extension
    const baseFilePath = filePath.replace(ext, '')

    // Generate paths for different versions of the file
    const textFilePath = `${baseFilePath}-text.tmp${ext}`
    const codeFilePath = `${baseFilePath}-code.tmp.yaml`
    const originFilePath = `${baseFilePath}-orig.tmp${ext}`

    // Return an object with paths to each version of the file
    return { textFilePath, codeFilePath, originFilePath }
}

// Function to read and parse configuration data from a JSON file
export async function readConfig(configPath) {
    try {
        // Read the configuration file
        const configData = await fs.readFile(configPath, 'utf-8')
        return JSON.parse(configData)  // Parse the JSON data and return it
    } catch (err) {
        // Log any errors encountered while reading the file and terminate the process
        console.error(`Error reading configuration file: ${err.message}`)
        process.exit(1)
    }
}

// Function to clean up all files and directories within a specified output directory
export async function cleanDirectory(outputDir) {
    try {
        // Read the contents of the directory
        const files = await fs.readdir(outputDir, { withFileTypes: true })
        for (const file of files) {
            const filePath = path.join(outputDir, file.name)
            if (file.isDirectory()) {
                // If it's a directory, delete it recursively
                await fs.rm(filePath, { recursive: true, force: true })
            } else {
                // If it's a file, delete it directly
                await fs.unlink(filePath)
            }
        }
        // Optionally, log that the directory was cleaned
        // console.log(`Cleaned up output directory: ${outputDir}`)
    } catch (err) {
        console.error(`Error cleaning output directory: ${err.message}`)
    }
}

// Function to count the total number of Markdown (.md and .mdx) files in a directory, including subdirectories
export async function countFiles(dir) {
    let count = 0  // Initialize count
    try {
        // Read the directory contents
        const files = await fs.readdir(dir, { withFileTypes: true })
        for (const file of files) {
            const filePath = path.join(dir, file.name)
            if (file.isDirectory()) {
                // Recursively count files in subdirectories
                count += await countFiles(filePath)
            } else if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
                // Count only .md and .mdx files
                count += 1
            }
        }
    } catch (err) {
        console.error(`Error counting files: ${err.message}`)
    }
    return count
}

// Function to recursively copy the structure of an input directory to an output directory
export async function prepareDirectories(inputDir, outputDir) {
    try {
        // Read contents of the input directory
        const files = await fs.readdir(inputDir, { withFileTypes: true })
        for (const file of files) {
            const inputFilePath = path.join(inputDir, file.name)
            const outputFilePath = path.join(outputDir, file.name)

            if (file.isDirectory()) {
                // Create corresponding directories in the output structure
                await fs.mkdir(outputFilePath, { recursive: true })
                // Recursively process subdirectories
                await prepareDirectories(inputFilePath, outputFilePath)
            } else if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
                // Continue for valid file types; no specific actions are needed here
                continue
            }
        }
    } catch (err) {
        console.error(`Error processing directory: ${err.message}`)
    }
}

// Function to copy a file from an input path to an output path
export async function copyFile(inputFilePath, outputFilePath) {
    try {
        // Copy the file from input to output path
        await fs.copyFile(inputFilePath, outputFilePath)
        console.log(`File copied from ${inputFilePath} to ${outputFilePath}`)
    } catch (error) {
        console.error(`Error copying file: ${error.message}`)
        // Re-throw the error to be handled by the calling function
        throw error
    }
}
