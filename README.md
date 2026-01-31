# App Language Converter

A Node.js application that converts code from one programming language to another using Google's Gemini AI. It includes both a general language converter and a specialized Angular to React converter.

## Features

### General Language Converter
- Supports multiple programming languages: JavaScript, TypeScript, Python, Java, C++, C, PHP, Ruby, Go, Rust
- Uses Google's Gemini AI for accurate code conversion
- Preserves file structure in the output
- Handles rate limits and retries automatically

### Angular to React Converter
- Specifically designed to convert Angular applications to React
- Detects Angular projects automatically
- Converts Angular components (TypeScript, HTML templates, CSS) to React functional components with JSX
- Handles other TypeScript files (services, etc.)
- Generates a basic React TypeScript project structure

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
     GEMINI_API_KEY=your_actual_api_key_here
     ```

## Usage

### General Language Converter

Run the converter with a GitHub repository URL and target language:

```sh
node repo-converter.js <github-repo-url> <target-language>
```

#### Examples

Convert a repository to JavaScript:
```sh
node repo-converter.js https://github.com/username/repo JavaScript
```

Convert to Python:
```sh
node repo-converter.js https://github.com/username/repo Python
```

#### Supported Target Languages

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

### Angular to React Converter

Run the specialized converter for Angular to React conversion:

```sh
node angular-to-react-converter.js <github-repo-url>
```

#### Example

Convert an Angular app to React:
```sh
node angular-to-react-converter.js https://github.com/username/angular-app.git
```

This will:
- Clone the Angular repository
- Detect Angular components and other TypeScript files
- Convert them to React components and files
- Generate a basic React TypeScript project structure

## Output

- Converted files are saved in the `converted-code/` directory
- Original file structure is preserved (with adaptations for React)
- Files are renamed with appropriate extensions for the target language/framework

## Important Notes

- **API Quotas**: Gemini AI has usage limits. The scripts include rate limiting and retries, but monitor your usage in Google Cloud Console.
- **Large Repositories**: Converting many files may take time and consume API quota. Consider processing smaller repos or specific files.
- **Accuracy**: AI conversion may not be perfect. Review the output for correctness, especially for complex Angular to React conversions.
- **Security**: Never commit your `.env` file or API keys to version control.

## Troubleshooting

- **API Key Invalid**: Ensure your `.env` file has the correct `GEMINI_API_KEY`
- **Rate Limits**: If you hit limits, wait for quota reset or upgrade your Google Cloud plan
- **Model Not Found**: The scripts use `gemini-2.5-flash`. If issues persist, check [Gemini API documentation](https://ai.google.dev/models/gemini) for available models
- **Angular Detection**: For Angular to React conversion, ensure the repository has `angular.json` or `@angular/` dependencies in `package.json`

## License

This project is for educational purposes. Check Google's terms of service for AI usage.

