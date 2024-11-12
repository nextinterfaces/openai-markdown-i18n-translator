
# OpenAI Markdown Translator & Content Improver

This project provides a CLI tool designed for transforming Markdown and MDX files into improved English or translating them into different locales, making it a valuable resource for internationalization (i18n) of documentation. It uses OpenAI's GPT model with custom prompts to simplify, enhance, and localize content. This tool is especially useful for i18n documentation portals that use Markdown files.

## Key Features

- **Documentation Enhancement**: Uses OpenAI to improve clarity, readability, and developer-friendliness of technical content.
- **Language Translation**: Leverages OpenAI for accurate translation, making documentation accessible in various languages.
- **Localization Ready**: Ideal for i18n documentation portals, processing Markdown and MDX files for multilingual support.
- **Automated Workflow**: Processes multiple files in a directory and generates enhanced or translated content in bulk.

---

## Installation

Run the following command in the root directory to install dependencies:

```bash
yarn install
```

## Environment Setup

To authenticate requests to OpenAI’s API, create a `.env` file in the root directory. Add your OpenAI API key like this:

```plaintext
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

> **Note**: Ensure the `.env` file is not included in Git for security.

---

## Configuration

The tool uses an `ai.*.json` configuration file to set parameters for OpenAI and define input paths. 

### `ai.*.json` Structure

- `inputDir`: Directory containing the Markdown or MDX files to be processed.
- `openai.model`: OpenAI model to use (e.g., `gpt-3.5-turbo`).
- `openai.prompt`: Prompt that directs the AI to improve or translate documentation.

Example `ai.prompt.translate.json`:

```json
{
  "inputDir": "docs/",
  "openai": {
    "model": "gpt-3.5-turbo",
    "prompt": "Translate the document to German, maintaining technical accuracy."
  }
}
```

---

## Usage

To run the tool, use the following command:

```bash
// Use for translation
yarn ai-translate

// or use for tone improvements
yarn ai-improve
```

This command reads from `ai.*.json` and processes all Markdown files in the specified `inputDir`. Enhanced or translated files are saved in the `dist` directory, and a summary report (`ai-build-report.json`) is generated.

### Example Workflow

1. **Preprocessing**: Markdown and MDX files are scanned, validated, and prepared.
2. **Content Improvement or Translation**: The tool sends each file to OpenAI, where it either:
    - **Improves** content using prompts tailored for clarity, simplicity, and developer-friendliness, or
    - **Translates** content to the specified language.
3. **Postprocessing**: Processed files are adjusted as needed and saved to the output directory.

---

## File Structure Overview

- **`src/`**: Contains core modules.
- **`dist/`**: Output directory where processed files are saved.
- **`docs/`**: Input directory of Markdown and MDX files to be processed.

---

## Sample Use Case: Improving Documentation in Markdown

If you want to enhance the clarity and developer-friendliness of documentation, update `ai.prompt.improve.json` like this:

```json
{
  "inputDir": "docs/",
  "openai": {
    "model": "gpt-3.5-turbo",
    "prompt": "You are technical-writer. Improve this document to be simpler and more developer-friendly."
  }
}
```

Run `yarn ai-improve`, and the tool will process each Markdown file in `docs/`, enhancing the language and readability according to the specified prompt.

---

## Sample Use Case: Translating Documentation to German

To translate all documentation files to German, update `ai.json` with a translation prompt:

```json
{
  "inputDir": "docs/",
  "openai": {
    "model": "gpt-3.5-turbo",
    "prompt": "You are translator. Translate the document to French, keeping technical accuracy."
  }
}
```

Run `yarn ai-translator`, and the tool will generate German translations of each Markdown file.

---

## Notes

- **Output Overwrites**: Processed files in `dist` will overwrite previous content.
- **Build Summary**: `ai-build-report.json` in `dist` provides a detailed summary of successes and failures.
- **Model Selection**: Higher-tier models like `gpt-4` yield more accurate results but may be slower or more costly.

---

