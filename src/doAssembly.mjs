import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'

import { excludedWords, normalizedPaths } from "./utils.mjs"

// Function to assemble content from pre-processed files and YAML, then perform post-processing
export async function doAssembly(initialInputFile) {
    // Retrieve the path to the associated YAML file for the input
    const { codeFilePath } = normalizedPaths(initialInputFile)
    const inputYaml = codeFilePath

    // Log the post-processing step for the current file
    console.log(`  Post-processing: ${ path.relative(process.cwd(), initialInputFile)}`)

    // Determine the output directory path based on input structure
    const postprocessDir = path.dirname(initialInputFile.replace('/preprocess/', '/build/'))

    // Merge MDX and YAML content and trim any surrounding whitespace
    let mergedContent = await mergeSnippets(initialInputFile, inputYaml, postprocessDir)
    mergedContent = mergedContent.trim()

    // Validate that the merged content starts with a YAML header ("---")
    if (!mergedContent.startsWith('---')) {
        throw new Error(`corrupt header, must start with --- "${mergedContent.substring(0, 20)}"`)
    }

    // Update image paths in the content
    mergedContent = updateImagePaths(mergedContent)

    // Check for any prohibited translation tags and raise an error if found
    checkTranslationTags(mergedContent)

    // Define the output file path and write the processed content
    const finalOutputFile = initialInputFile.replace('/preprocess/', '/build/')
    await fs.writeFile(finalOutputFile, mergedContent, 'utf-8')

    return mergedContent
}

// Function to inject code from YAML into the MDX file, replacing identifiers without regex
const injectCode = (mdxContent, yamlEntries) => {
    yamlEntries.forEach((entry) => {
        const { id, code } = entry
        // Replace each identifier with corresponding code block
        while (mdxContent.includes(id)) {
            mdxContent = mdxContent.replace(id, code)
        }
    })

    // Replace excluded words by removing notranslate tags around them
    excludedWords.forEach((word) => {
        const regex = new RegExp(`<notranslate>${word}</notranslate>`, 'g')
        mdxContent = mdxContent.replace(regex, word)
    })

    return mdxContent
}

// Main function to merge snippets from MDX and YAML files
const mergeSnippets = async (inputFile, inputYaml, outputDir) => {
    // Read content from both MDX and YAML files
    const mdxContent = await fs.readFile(inputFile, 'utf-8')
    const yamlContent = await fs.readFile(inputYaml, 'utf-8')

    // Parse the YAML file to retrieve entries as JavaScript objects
    const yamlEntries = await yaml.load(yamlContent)

    // Inject the parsed YAML content into the MDX file content
    const updatedMdxContent = await injectCode(mdxContent, yamlEntries)

    return updatedMdxContent
}

// Function to verify that no <notranslate> tags are present in the final content
function checkTranslationTags(content) {
    if (content.includes('<notranslate>') || content.includes('</notranslate>')) {
        throw new Error("notranslate exist in code")
    }
}

// Function to adjust all image paths to a relative directory structure
function updateImagePaths(fileContent) {
    // Update all instances of image paths to point to the correct relative location
    let content_ = fileContent.replace(/\/apps\/main-app\/static\/images\//g, '/../../apps/main-app/static/images/')
    return content_
}
