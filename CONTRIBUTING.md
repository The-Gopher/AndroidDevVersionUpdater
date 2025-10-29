# Contributing to AndroidDevVersionUpdater

Thank you for your interest in contributing to AndroidDevVersionUpdater! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/AndroidDevVersionUpdater.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34
- Gradle 8.2+

### Building the Project

```bash
./gradlew clean build
```

### Running Tests

```bash
./gradlew test
./gradlew connectedAndroidTest
```

## Code Style

This project follows the [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html).

Key points:
- Use 4 spaces for indentation
- Use camelCase for variable and function names
- Use PascalCase for class names
- Use meaningful variable names
- Add comments for complex logic

## Pull Request Guidelines

1. **Keep PRs focused**: Each PR should address a single concern
2. **Write clear commit messages**: Use descriptive commit messages
3. **Update documentation**: Update README.md if you change functionality
4. **Add tests**: Add tests for new features
5. **Follow code style**: Ensure your code follows the project's style guidelines
6. **Check for conflicts**: Rebase your branch if needed

## Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps to reproduce the problem
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Environment**: Android version, device model, app version
6. **Logs**: Relevant logcat output if available

## Feature Requests

Feature requests are welcome! Please:

1. Check if the feature has already been requested
2. Clearly describe the feature and its use case
3. Explain why it would be useful to most users

## Code Review Process

1. All PRs must be reviewed before merging
2. Address review feedback promptly
3. Keep the PR updated with the main branch
4. Once approved, a maintainer will merge your PR

## Areas for Contribution

Here are some areas where contributions are especially welcome:

- **UI/UX improvements**: Better designs, animations, user experience
- **Testing**: Unit tests, integration tests, UI tests
- **Documentation**: Improving README, adding guides, code comments
- **Bug fixes**: Fixing reported issues
- **Performance**: Optimizations for speed and memory usage
- **Accessibility**: Making the app more accessible
- **Internationalization**: Adding support for more languages

## Questions?

If you have questions about contributing, please open an issue with the `question` label.

## License

By contributing to AndroidDevVersionUpdater, you agree that your contributions will be licensed under the MIT License.
