# 🤝 Contributing to FluentEase

Thank you for your interest in contributing to FluentEase! We welcome contributions from developers of all skill levels.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git
- Firebase account
- Google Gemini API key

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/fluentease-english-learning.git
   cd fluentease-english-learning
   ```

2. **Set up the frontend**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with your Firebase configuration
   npm run dev
   ```

3. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your API keys
   uvicorn app.main:app --reload
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 How to Contribute

### 🐛 Bug Reports
1. Check if the bug has already been reported in [Issues](https://github.com/yourusername/fluentease-english-learning/issues)
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### ✨ Feature Requests
1. Check existing [Issues](https://github.com/yourusername/fluentease-english-learning/issues) for similar requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Mockups or examples if applicable

### 🔧 Code Contributions

#### Frontend (React)
- **Location**: `client/src/`
- **Style Guide**: ESLint + Prettier
- **Components**: Use functional components with hooks
- **Styling**: Tailwind CSS classes
- **State Management**: React Context API

#### Backend (FastAPI)
- **Location**: `backend/app/`
- **Style Guide**: Black + isort
- **API Design**: RESTful endpoints
- **Documentation**: Automatic with FastAPI
- **Testing**: pytest (when implemented)

#### Areas for Contribution

1. **AI Integration**
   - Improve Gemini prompts for better feedback
   - Add support for other AI models
   - Enhance speech recognition accuracy

2. **User Experience**
   - New practice modes or exercises
   - Improved UI/UX components
   - Accessibility improvements
   - Mobile responsiveness

3. **Streak System**
   - New achievement badges
   - Enhanced analytics
   - Social features (leaderboards)

4. **Email System**
   - New email templates
   - Additional notification types
   - Email provider integrations

5. **Performance**
   - Frontend optimization
   - Backend caching
   - Database query optimization

## 📝 Code Style Guidelines

### Frontend (JavaScript/React)
```javascript
// Use functional components
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  // Use descriptive names
  const handleButtonClick = () => {
    // Implementation
  };
  
  return (
    <div className="bg-white p-4 rounded-lg">
      {/* JSX content */}
    </div>
  );
};

export default MyComponent;
```

### Backend (Python/FastAPI)
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class RequestModel(BaseModel):
    field1: str
    field2: int

@router.post("/endpoint")
async def endpoint_function(request: RequestModel):
    """
    Clear docstring describing the endpoint
    """
    try:
        # Implementation
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(auth): add Google OAuth integration
fix(streak): resolve calendar display issue
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(api): optimize database queries
test(auth): add login flow tests
```

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

### Backend Testing
```bash
cd backend
pytest              # Run tests
pytest --cov        # Coverage report
```

### Manual Testing
1. Test all user flows (signup, login, practice modes)
2. Verify streak tracking works correctly
3. Test email notifications (if configured)
4. Check responsive design on different devices
5. Verify AI feedback accuracy

## 📚 Documentation

### Code Documentation
- **Frontend**: JSDoc comments for complex functions
- **Backend**: Python docstrings for all functions
- **API**: FastAPI automatic documentation

### README Updates
- Update feature lists when adding new functionality
- Add new environment variables to configuration section
- Update installation instructions if needed

## 🔍 Pull Request Process

1. **Before Submitting**
   - Ensure your code follows the style guidelines
   - Test your changes thoroughly
   - Update documentation if needed
   - Rebase your branch on the latest main

2. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tested locally
   - [ ] Added/updated tests
   - [ ] All tests pass

   ## Screenshots (if applicable)
   Add screenshots for UI changes

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

3. **Review Process**
   - Maintainers will review your PR
   - Address feedback promptly
   - Keep discussions constructive
   - Be patient during the review process

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority items
- `frontend` - Frontend related
- `backend` - Backend related
- `ai` - AI/ML related
- `email` - Email system related
- `streak` - Streak system related

## 🎯 Development Priorities

### High Priority
1. Mobile responsiveness improvements
2. Performance optimizations
3. Accessibility enhancements
4. Test coverage improvements

### Medium Priority
1. New practice modes
2. Enhanced AI feedback
3. Social features
4. Advanced analytics

### Low Priority
1. UI polish
2. Additional integrations
3. Experimental features

## 💬 Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and discussion
- **Email**: security@fluentease.com (security issues only)

## 🏆 Recognition

Contributors will be:
- Listed in the README contributors section
- Mentioned in release notes
- Invited to join the core team (for significant contributions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Don't hesitate to ask questions! Create an issue with the `question` label or start a discussion.

Thank you for contributing to FluentEase! 🎉