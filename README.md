# App Language Converter

A Node.js application that converts code from one programming language to another using Google's Gemini AI. It clones a GitHub repository, identifies code files, and converts them to the specified target language.

## Features

- Supports multiple programming languages: JavaScript, TypeScript, Python, Java, C++, C, PHP, Ruby, Go, Rust
- Uses Google's Gemini AI for accurate code conversion
- Preserves file structure in the output
- Handles rate limits and retries automatically

## Prerequisites

- Node.js (v14 or higher)
- Git
- A valid Google Gemini AI API key

## Setup

1. **Clone this repository**:
   ```sh
   git clone <this-repo-url>
   cd app-language-converter
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Get a Gemini AI API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key

4. **Create environment file**:
   - Create a `.env` file in the root directory
   - Add your API key:
     ```
     GEMINI_AI_API_KEY=your_actual_api_key_here
     ```

## Usage

Run the converter with a GitHub repository URL and target language:

```sh
node repo-converter.js <github-repo-url> <target-language>
```

### Examples

Convert a repository to JavaScript:
```sh
node repo-converter.js https://github.com/username/repo JavaScript
```

Convert to Python:
```sh
node repo-converter.js https://github.com/username/repo Python
```

### Supported Target Languages

- JavaScript
- TypeScript
- Python
- Java
- C++
- C
- PHP
- Ruby
- Go
- Rust

## Output

- Converted files are saved in the `converted-code/` directory
- Original file structure is preserved
- Files are renamed with appropriate extensions for the target language

## Important Notes

- **API Quotas**: Gemini AI has usage limits. The script includes rate limiting and retries, but monitor your usage in Google Cloud Console.
- **Large Repositories**: Converting many files may take time and consume API quota. Consider processing smaller repos or specific files.
- **Accuracy**: AI conversion may not be perfect. Review the output for correctness.
- **Security**: Never commit your `.env` file or API keys to version control.

## Troubleshooting

- **API Key Invalid**: Ensure your `.env` file has the correct `GEMINI_AI_API_KEY`
- **Rate Limits**: If you hit limits, wait for quota reset or upgrade your Google Cloud plan
- **Model Not Found**: The script uses `gemini-2.5-flash`. If issues persist, check [Gemini API documentation](https://ai.google.dev/models/gemini) for available models

## License

This project is for educational purposes. Check Google's terms of service for AI usage.

