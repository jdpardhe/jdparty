# Contributing to JDParty

Thank you for your interest in contributing to JDParty! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:
1. Check the [existing issues](https://github.com/yourusername/jdparty/issues)
2. Check the [troubleshooting guide](./docs/TROUBLESHOOTING.md)
3. Verify you're using the latest version

When creating a bug report, include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, Node version, etc.)
- Server logs if relevant

### Suggesting Features

Feature requests are welcome! Please:
1. Check if it's already requested
2. Provide clear use case
3. Explain why it would benefit users
4. Consider if it fits the project scope

### Code Contributions

1. **Find an Issue**
   - Look for `good first issue` or `help wanted` labels
   - Comment on the issue to claim it

2. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/jdparty.git
   cd jdparty
   pnpm install
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**
   - Follow the code style (Prettier + ESLint)
   - Add tests if applicable
   - Update documentation
   - Test thoroughly

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

   Use conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Formatting
   - `refactor:` Refactoring
   - `test:` Tests
   - `chore:` Maintenance

6. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub.

### Pull Request Guidelines

- Title should be clear and descriptive
- Reference related issues
- Describe what changed and why
- Include screenshots for UI changes
- Ensure CI passes
- Be responsive to review feedback

### Development Setup

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed setup instructions.

## Project Structure

```
JDParty/
├── packages/
│   ├── shared/       # Shared types & utils
│   ├── server/       # Backend server
│   ├── pwa/          # React PWA
│   └── desktop/      # Electron app
├── docs/             # Documentation
└── fixtures/         # Fixture library
```

## Coding Standards

### TypeScript
- Use strict mode
- Define types explicitly
- No `any` unless absolutely necessary
- Use interfaces for objects
- Use type for unions/primitives

### React
- Functional components only
- Use hooks (useState, useEffect, etc.)
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use TypeScript props interfaces

### CSS
- Use Tailwind CSS utility classes
- Avoid custom CSS when possible
- Mobile-first responsive design
- Follow existing color scheme

## Testing

```bash
# Run tests (when available)
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## Documentation

- Update README.md if adding features
- Add JSDoc comments to functions
- Update API docs for new endpoints
- Include examples in documentation

## Fixture Contributions

To add a new fixture profile:

1. Create JSON file in `fixtures/manufacturers/`
2. Follow the fixture profile schema
3. Test with real hardware if possible
4. Include channel descriptions
5. Document any quirks or special features

Example:
```json
{
  "id": "chauvet-slimpar-64-rgba",
  "manufacturer": "Chauvet",
  "model": "SlimPAR 64 RGBA",
  ...
}
```

## Translation (Future)

We welcome translations! Contact us if interested in helping localize JDParty.

## Questions?

- Open a [Discussion](https://github.com/yourusername/jdparty/discussions)
- Join our [Discord](https://discord.gg/jdparty)
- Email: support@jdparty.app

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to JDParty! 🎉
