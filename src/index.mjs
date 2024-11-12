// Import necessary modules for command-line interface setup, file handling, and environment configuration
import { Command } from 'commander'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

import { doPreprocess } from './doPreprocess.mjs'
import { doAssembly } from './doAssembly.mjs'
import { doAI } from './doAI.mjs'

import { cleanDirectory, copyFile, countFiles, readConfig, prepareDirectories } from "./utils.mjs";

// Load environment variables from a .env file
dotenv.config()

// Initialize a new CLI program using Commander.js
const program = new Command()

// Initialize counters to track the total and processed file count
let totalFilesToProcess = 0
let processedFilesCount = 0

// Function to recursively iterate over the input directory and preprocess each file
async function startPreprocess(inputDir, outputDir, results, openai) {
    try {
        // Read the contents of the input directory
        const files = await fs.readdir(inputDir, { withFileTypes: true })
        for (const file of files) {
            const inputFilePath = path.join(inputDir, file.name)
            const outputFilePath = path.join(outputDir, file.name)

            // If the entry is a directory, recursively preprocess files within it
            if (file.isDirectory()) {
                await startPreprocess(inputFilePath, outputFilePath, results, openai)
            } else if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
                // If it's a Markdown file, start preprocessing and AI processing
                let content
                try {
                    // Preprocess the file content
                    content = await doPreprocess(inputFilePath, outputFilePath)
                    // Start AI translation on the preprocessed content
                    await startAI(inputFilePath, outputFilePath, content, results, openai)

                    // Update the count of processed files
                    processedFilesCount++
                    console.log(`-------\n Processed ${processedFilesCount} of ${totalFilesToProcess} files. Remaining: ${totalFilesToProcess - processedFilesCount}\n-------`)
                } catch (err) {
                    // Log any errors encountered during preprocessing and mark the file as failed
                    const errMsg = err?.message || err
                    console.error(`Error in externalPreprocess: ${errMsg}`)
                    results.failed.push({ file: inputFilePath, reason: `externalPreprocess error: ${errMsg}` })
                    continue
                }
            }
        }
    } catch (err) {
        console.error(`Error processing directory: ${err.message}`)
    }
}

// Function to start AI translation on preprocessed content
async function startAI(inputFilePath, outputFilePath, content, results, openai) {
    let translatedContent
    try {
        console.log(`  Translating: ${path.basename(inputFilePath)}`)
        translatedContent = await doAI(content, openai)
        // Save the translated content to the output file
        await fs.writeFile(outputFilePath, translatedContent, 'utf-8')
        // Proceed with postprocessing on the translated content
        await startPostprocess(inputFilePath, outputFilePath, translatedContent, results)
    } catch (err) {
        // Handle errors during AI translation, log them, and copy the original file as fallback
        console.warn(`Error in externalTranslate: ${err.message}`)
        results.failed.push({ file: inputFilePath, reason: `externalTranslate error: ${err.message}` })
        await copyFile(inputFilePath, outputFilePath)
    }
}

// Function to start postprocessing on translated content
async function startPostprocess(inputFilePath, outputFilePath, translatedContent, results) {
    try {
        // Call the assembly function to perform final postprocessing
        await doAssembly(outputFilePath)
        // Mark the file as successfully processed
        results.success.push(inputFilePath)
    } catch (err) {
        // Log any errors encountered during postprocessing and handle the file accordingly
        console.error(`Error in externalPostprocess: ${err.message}`)
        results.failed.push({ file: inputFilePath, reason: `externalPostprocess error: ${err.message}` })
        await copyFile(inputFilePath, outputFilePath.replace('/preprocess/', '/build/'))
    }
}

// Function to write a summary report of the build results
async function writeBuildResults(outputDir, results) {
    try {
        // Define the path to the output results file
        const resultsFilePath = path.join(outputDir, 'ai-build-report.json')
        await fs.writeFile(resultsFilePath, JSON.stringify(results, null, 2), 'utf-8')
        console.log(`Build Report: ${path.relative(process.cwd(), resultsFilePath)} success: `, results?.success?.length, ' failed:', results?.failed)
    } catch (err) {
        console.error(`Error writing build-results file: ${err.message}`)
    }
}

// Configure the CLI with program details and options using Commander.js
program
    .version('1.0.0')
    .description('Translate and process Markdown files using OpenAI')
    .option('-c, --config <configFile>', 'Configuration JSON file path')
    .action(async (options) => {
        console.time('::Total execution time')  // Track total execution time
        const { config } = options

        if (!config) {
            console.error('Error: Missing required option. Use --config to specify the configuration file.')
            process.exit(1)
        }

        // Load configuration from the specified file
        let { inputDir, openai } = await readConfig(config)

        if (!inputDir || !openai) {
            console.error('Error: Missing required "inputDir", "openai" configuration options.')
            process.exit(1)
        }

        // Resolve input and output directory paths
        const dirInput = path.resolve(process.cwd(), inputDir)
        const dirBuild = path.resolve(process.cwd(), 'dist')

        // Create output directory and clean it if it already exists
        await fs.mkdir(dirBuild, { recursive: true })
        await cleanDirectory(dirBuild)

        // Set up directories for preprocessing and final build
        const preDirBuild = path.join(dirBuild, 'preprocess')
        await fs.mkdir(preDirBuild, { recursive: true })
        const postDirBuild = path.join(dirBuild, 'build')
        await fs.mkdir(postDirBuild, { recursive: true })

        // Initialize results object to track success and failure
        const results = { success: [], failed: [] }

        // Set up input and output directories
        await prepareDirectories(dirInput, preDirBuild)
        await prepareDirectories(dirInput, postDirBuild)

        // Count and log the total number of files to be processed
        totalFilesToProcess = await countFiles(dirInput)
        console.log(`Total files to process: ${totalFilesToProcess}`)

        // Begin the preprocessing step on all files
        await startPreprocess(dirInput, preDirBuild, results, openai)

        // Write a report of the results after all steps
        await writeBuildResults(dirBuild, results)

        console.timeEnd('::Total execution time')  // End total execution time tracking
    })

// Parse the CLI arguments and execute the program
program.parse(process.argv)
