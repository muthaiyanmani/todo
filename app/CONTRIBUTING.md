# Contributing to Smart Todo Pro

Thank you for your interest in contributing to Smart Todo Pro! This document provides guidelines for contributing to the project.

## Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smart-todo-pro
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run validate` - Run all checks (type-check + lint + format)

## Code Quality

This project uses several tools to maintain code quality:

- **ESLint** - Code linting with TypeScript, React, and accessibility rules
- **Prettier** - Code formatting
- **Husky** - Git hooks for automated checks
- **lint-staged** - Run linters on staged files
- **commitlint** - Commit message linting

## Commit Message Format

We follow the [Conventional Commits](https://conventionalcommits.org/) specification. Each commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring (no new features or bug fixes)
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system or external dependencies
- `ci` - CI/CD changes
- `chore` - Other changes that don't modify src or test files
- `revert` - Revert a previous commit

### Examples

```bash
feat: add task creation functionality
fix: resolve authentication token expiration
docs: update README installation steps
style: format code with prettier
refactor: extract common validation logic
perf: optimize task list rendering
test: add unit tests for auth service
build: update vite configuration
ci: add GitHub Actions workflow
chore: update dependencies
```

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines
   - Add tests if applicable
   - Update documentation if needed

3. **Run validation**

   ```bash
   npm run validate
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your branch**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a descriptive title
   - Fill out the PR template
   - Link any related issues

## Code Style Guidelines

### TypeScript

- Use type annotations for function parameters and return types
- Prefer interfaces over type aliases for object types
- Use strict TypeScript configuration
- Avoid `any` - use specific types or `unknown`

### React

- Use functional components with hooks
- Prefer named exports over default exports
- Use TypeScript for props interfaces
- Follow React best practices for performance

### Styling

- Use Tailwind CSS for styling
- Follow the utility-first approach
- Use CSS custom properties for theme values
- Maintain responsive design principles

### File Organization

- Group related files in folders
- Use kebab-case for file names
- Export components and utilities clearly
- Keep imports organized (external -> internal -> relative)

## Git Hooks

The project uses Husky to run automated checks:

- **pre-commit** - Runs lint-staged to check staged files
- **commit-msg** - Validates commit message format

If these checks fail, the commit will be rejected. Fix the issues and try again.

## Testing

- Write unit tests for utilities and services
- Test React components with React Testing Library
- Aim for meaningful test coverage
- Run tests before submitting PRs

## Issues and Bugs

When reporting issues:

1. Use the issue template
2. Provide clear reproduction steps
3. Include environment details
4. Add screenshots for UI issues

## Questions?

If you have questions about contributing, feel free to:

- Open an issue for discussion
- Check existing documentation
- Ask in pull request comments

Thank you for contributing to Smart Todo Pro!
