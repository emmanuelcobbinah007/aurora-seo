# Contributing to AuroraSEO

Thank you for your interest in contributing to AuroraSEO! We welcome contributions from developers of all experience levels.

## Ways to Contribute

- **Report bugs** or issues
- **Suggest new features** or improvements
- **Improve documentation**
- **Submit code contributions**
- **Add tests** or improve test coverage
- **Help with translations**

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 8+
- **Git** for version control
- A **Next.js project** for testing

### Development Setup

1. **Fork and clone** the repository:

```bash
git clone https://github.com/yourusername/aurora-seo.git
cd aurora-seo
```

2. **Install dependencies**:

```bash
npm install
```

3. **Build the project**:

```bash
npm run build
```

4. **Test locally** in a Next.js project:

```bash
# Link for local development
npm link

# In a test Next.js project
npm link aurora-seo
npx aurora-seo init
```

### Project Structure

```
aurora-seo/
├── src/
│   ├── commands/           # CLI commands (init, generate)
│   │   ├── init.ts
│   │   └── generate.ts
│   ├── utils/              # Core utilities
│   │   ├── generateSitemap.ts
│   │   ├── generateRobots.ts
│   │   ├── generateMetadata.ts
│   │   ├── gscVerificationGenerator.ts
│   │   ├── preflightChecks.ts
│   │   └── logger.ts
│   ├── types/              # TypeScript definitions
│   │   └── config.ts
│   └── index.ts           # CLI entry point
├── dist/                  # Compiled JavaScript
├── docs/                  # Documentation
├── examples/              # Example configurations
├── tests/                 # Test files
├── package.json
├── tsconfig.json
├── README.md
└── CONTRIBUTING.md
```

## Bug Reports

When reporting bugs, please include:

### Required Information

- **AuroraSEO version**: `npx aurora-seo --version`
- **Node.js version**: `node --version`
- **Next.js version**: From your `package.json`
- **Operating System**: Windows/macOS/Linux
- **Project Router**: App Router or Pages Router

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Run `aurora-seo init`
2. Configure with '...'
3. Run `aurora-seo generate`
4. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Error output**
```

Paste any error messages or logs here

```

**Environment**
- AuroraSEO version:
- Node.js version:
- Next.js version:
- OS:

**Additional context**
Add any other context about the problem here.
```

## Feature Requests

We love new ideas! When suggesting features:

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Use case**
How would this feature benefit you and other users?

**Implementation ideas**
If you have ideas about how to implement this, share them!
```

## Code Contributions

### Development Workflow

1. **Create a feature branch**:

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following our coding standards

3. **Add tests** for your changes (if applicable)

4. **Test thoroughly**:

```bash
# Build and test
npm run build
npm run test

# Test with real Next.js projects
npm run test:integration
```

5. **Commit with descriptive messages**:

```bash
git commit -m "feat: add custom sitemap priority support"
```

6. **Push and create a Pull Request**:

```bash
git push origin feature/your-feature-name
```

### Coding Standards

#### TypeScript Guidelines

- **Use explicit types** where possible
- **Prefer interfaces** over type aliases for object shapes
- **Use async/await** instead of Promise chains
- **Handle errors gracefully** with try/catch blocks

#### Code Style

```typescript
// ✅ Good
export async function generateSitemap(config: SEOConfig): Promise<void> {
  try {
    const urls = await discoverRoutes(config);
    await writeSitemap(urls, config.paths.sitemap);
    logger.success("Sitemap generated successfully");
  } catch (error) {
    logger.error(`Sitemap generation failed: ${(error as Error).message}`);
    throw error;
  }
}

// ❌ Avoid
export function generateSitemap(config: any) {
  discoverRoutes(config).then((urls) => {
    writeSitemap(urls, config.paths.sitemap);
    console.log("done");
  });
}
```

#### File Organization

- **One main export per file**
- **Group related utilities** in the same file
- **Use descriptive file names**
- **Export types** from `types/` directory

### Testing Guidelines

#### Unit Tests

```typescript
// tests/utils/generateSitemap.test.ts
import { generateSitemap } from "../../src/utils/generateSitemap";
import { mockConfig } from "../fixtures/config";

describe("generateSitemap", () => {
  it("should generate valid XML sitemap", async () => {
    await generateSitemap(mockConfig);
    // Assert sitemap content
  });

  it("should handle missing routes gracefully", async () => {
    const config = { ...mockConfig, features: { sitemap: false } };
    await expect(generateSitemap(config)).resolves.not.toThrow();
  });
});
```

#### Integration Tests

Test with real Next.js projects in the `tests/fixtures/` directory.

### Pull Request Process

#### PR Checklist

- [ ] **Code builds** without errors (`npm run build`)
- [ ] **Tests pass** (`npm run test`)
- [ ] **Documentation updated** (if needed)
- [ ] **CHANGELOG.md updated** (for user-facing changes)
- [ ] **Commit messages follow** [Conventional Commits](https://conventionalcommits.org/)

#### PR Template

When you create a PR, please include:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots of CLI output or generated files

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Changes documented
- [ ] Tests added for new functionality
```

## Documentation Contributions

### Types of Documentation

- **README updates**: Keep the main README current
- **Code comments**: Document complex logic
- **Examples**: Add usage examples in `examples/`
- **API documentation**: Document public APIs

### Documentation Style

- **Use clear, concise language**
- **Include code examples** for all features
- **Test all examples** to ensure they work
- **Use proper markdown formatting**

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/):

```bash
feat: add custom priority support for sitemap entries
fix: resolve GSC verification token validation issue
docs: update README with new CLI options
test: add integration tests for App Router
chore: update dependencies to latest versions
```

## Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md** file
- **GitHub releases** changelog
- **Social media** shoutouts (with permission)
- **Package.json** contributors field

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: contact@aurorasoftwarelabs.io

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you agree to uphold this code.

### Our Standards

- **Be respectful** and inclusive
- **Welcome newcomers** and help them learn
- **Focus on constructive feedback**
- **Collaborate openly** and transparently

---

**Thank you for helping make AuroraSEO better for everyone!**

Your contributions, big or small, make a difference in the Next.js community.
