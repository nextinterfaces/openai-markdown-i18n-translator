import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

import { excludedWords, normalizedPaths, HEADER_TOKEN } from './utils.mjs'

// Primary function to perform preprocessing on Markdown files
export function doPreprocess(sourceFilePath, destinationFilePath) {
    // Log the current file being preprocessed with its relative path
    console.log(`  Pre-processing: ${path.relative(process.cwd(), sourceFilePath)}`)
    return handleMarkdownProcessing(sourceFilePath, destinationFilePath)
}

// Core function to process the Markdown file and manage code snippet extraction
async function handleMarkdownProcessing(sourceFilePath, destinationFilePath) {
    try {
        // Read the content of the source Markdown file
        let content = await fs.readFile(sourceFilePath, 'utf-8')

        // Validate headers in the Markdown file
        const { error } = checkMarkdownHeaders(content)
        if (error) {
            throw error
        }

        let match
        // Regular expressions to identify code blocks, tabs, headers, and admonition blocks
        const codeBlockRegex = /```$1```/g
        const tabItemRegex = /^\s*(<TabItem\s+.*)$/gm
        const tabsRegex = /^\s*<Tabs\s+.*$/gm
        const headerRegex = /^---\n([\s\S]*?)\n---/m
        const admonitionRegex = /^(\s*):::(note|tip|info|warning|danger|sharedCloudDanger|caution|starterNote|privateCloudNote)([\s\S]*?):::$/gm

        let snippetArray = []  // Array to store extracted snippets with IDs
        let revisedContent = content  // Holds modified content after snippet replacements

        // Extract YAML headers and remove them from the main content
        match = headerRegex.exec(content)
        if (match !== null) {
            const [fullMatch, headerContent] = match
            snippetArray.push({ id: HEADER_TOKEN, code: `---\n${headerContent}\n---\n` })
            revisedContent = revisedContent.replace(fullMatch, '') // HEADER_TOKEN to be added after processing
        }

        // Replace each code block with a unique ID and store it in `snippetArray`
        revisedContent = revisedContent.replace(codeBlockRegex, (match, code, index) => {
            const codeId = `<notranslate>cx_spt_${index}</notranslate>`
            snippetArray.push({
                id: codeId, code: `\`\`\`${code}\n\`\`\``
            })
            return codeId
        })

        // Extract Markdown tables, replace them with unique IDs, and store them
        let lines = content.split('\n')
        let tableContent = []
        let inTable = false
        let tableIndex = 0

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (/^\s*\|/.test(line)) {
                if (!inTable) {
                    inTable = true
                    tableContent = []
                }
                tableContent.push(line)
            } else if (inTable) {
                inTable = false
                const tableId = `<notranslate>tz_spt_${tableIndex++}</notranslate>`
                const tableText = tableContent.join('\n')
                snippetArray.push({ id: tableId, code: tableText })
                revisedContent = revisedContent.replace(tableText, tableId)
            }
        }

        // Check if the last line was part of a table and handle accordingly
        if (inTable) {
            const tableId = `<notranslate>tl_spt_${tableIndex++}</notranslate>`
            const tableText = tableContent.join('\n')
            snippetArray.push({ id: tableId, code: tableText })
            revisedContent = revisedContent.replace(tableText, tableId)
        }

        // Extract and replace <TabItem> and <Tabs> elements with unique IDs
        let tabItemIndex = 0
        while ((match = tabItemRegex.exec(content)) !== null) {
            const [fullMatch] = match
            const tabItemId = `<notranslate>TabItem_${tabItemIndex++}</notranslate>`
            snippetArray.push({ id: tabItemId, code: fullMatch })
            revisedContent = revisedContent.replace(fullMatch, tabItemId)
        }

        let tabsIndex = 0
        while ((match = tabsRegex.exec(content)) !== null) {
            const [fullMatch] = match
            const tabsId = `<notranslate>Tabs_${tabsIndex++}</notranslate>`
            snippetArray.push({ id: tabsId, code: fullMatch })
            revisedContent = revisedContent.replace(fullMatch, tabsId)
        }

        // Extract and replace admonition blocks (e.g., :::note, :::tip) with unique IDs
        let admonitionIndex = 0
        while ((match = admonitionRegex.exec(content)) !== null) {
            const [fullMatch, leadingWhitespace, type, body] = match
            const admonitionId = `<notranslate>admonition_${admonitionIndex++}</notranslate>`
            snippetArray.push({ id: admonitionId, code: `${leadingWhitespace}:::${type}${body}:::` })
            revisedContent = revisedContent.replace(fullMatch, admonitionId)
        }

        // Protect excluded words by wrapping them with <notranslate> tags
        for (const text of excludedWords) {
            const regex = new RegExp(text, 'g')
            const replacement = `<notranslate>${text}</notranslate>`
            content = content.replace(regex, replacement)
        }

        // Generate paths for storing processed text and snippets
        const { textFilePath, codeFilePath, originFilePath } = normalizedPaths(destinationFilePath)

        // Write modified content to the text output path
        await fs.writeFile(textFilePath, revisedContent, 'utf-8')

        // Write extracted code snippets to YAML format
        const yamlContent = yaml.dump(snippetArray, { lineWidth: -1 })
        await fs.writeFile(codeFilePath, yamlContent, 'utf-8')

        return revisedContent
    } catch (error) {
        // Handle and log errors during file processing
        console.error('Error processing the markdown file:', error)
        throw error
    }
}

// Function to validate that the Markdown file contains correctly formatted headers
function checkMarkdownHeaders(input) {
    const content = input?.trim()

    if (!content) {
        return { error: 'Content is empty' }
    }

    const lines = content.split('\n')

    if (lines[0].trim() !== '---') {
        return { error: 'File must start with ---' }
    }

    // Identify the second '---' line to determine header boundaries
    const secondDashLineIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---')

    // Ensure a second '---' line exists
    if (secondDashLineIndex === -1) {
        return { error: 'File must contain a second --- on a new line' }
    }

    // Verify content follows the header section
    const afterSecondDashContent = lines.slice(secondDashLineIndex + 1).join('\n').trim()
    if (!afterSecondDashContent) {
        return { error: 'File must have text after the second ---' }
    }

    // Ensure headers follow the correct format
    const headerLines = lines.slice(1, secondDashLineIndex)
    const headerRegex = /^[a-zA-Z0-9_-]+:\s?.*$/
    for (const line of headerLines) {
        if (line.trim() && !headerRegex.test(line)) {
            return { error: 'Headers must follow the "headerName: headerValue" format' }
        }
    }

    return { error: null }
}
