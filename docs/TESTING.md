# Testing Strategy for Linear MCP Server

## 🧪 **Overview**

This document outlines the comprehensive testing strategy for the Linear MCP Server. Our testing approach ensures reliability, maintainability, and production readiness.

## **Testing Architecture**

### **Testing Pyramid**

```
           /\
          /  \
         / E2E \     ← End-to-End (MCP Protocol Integration)
        /__4%___\
       /        \
      /Integration\   ← Integration (Service Layer + API)
     /____20%____\
    /            \
   /  Unit Tests  \   ← Unit (Functions, Classes, Utils)
  /______76%______\
```

### **Test Types**

1. **Unit Tests (76%)** - Fast, isolated tests for individual components
2. **Integration Tests (20%)** - Service layer and API integration
3. **End-to-End Tests (4%)** - Full MCP protocol compliance
4. **Performance Tests** - Load testing for production scenarios

## **Test Structure**

```
tests/
├── unit/                     # Unit tests
│   ├── services/
│   │   └── linearService.test.ts
│   ├── utils/
│   │   ├── config.test.ts
│   │   ├── logger.test.ts
│   │   └── error.test.ts
│   └── types.test.ts
├── integration/              # Integration tests
│   ├── mcp-server.test.ts
│   └── linear-api.test.ts
├── e2e/                      # End-to-end tests
│   └── mcp-protocol.test.ts
├── performance/              # Performance tests
│   └── load-test.ts
├── fixtures/                 # Test data
│   ├── linear-responses.ts
│   └── mcp-requests.ts
├── helpers/                  # Test utilities
│   ├── mocks.ts
│   └── setup.ts
└── setup.ts                  # Global test setup
```

## **Testing Framework & Tools**

### **Core Framework**
- **Jest** - Testing framework with excellent TypeScript support
- **ts-jest** - TypeScript preprocessor for Jest
- **@jest/globals** - Global Jest functions for ES modules

### **Mocking Strategy**
- **Linear SDK Mocking** - Mock `@linear/sdk` for isolated testing
- **MCP Protocol Mocking** - Mock stdio transport for protocol tests
- **Environment Mocking** - Mock environment variables and configuration

### **Test Fixtures**
- **Realistic Data** - Mock responses based on actual Linear API responses
- **Edge Cases** - Test data for error scenarios and edge cases
- **Performance Data** - Large datasets for performance testing

## **Test Categories**

### **1. Unit Tests**

#### **LinearService Tests**
- ✅ **API Integration** - Mock Linear SDK calls
- ✅ **Data Transformation** - Issue formatting and validation
- ✅ **Error Handling** - API error scenarios
- ✅ **Authentication** - User context and permissions
- ✅ **Rate Limiting** - API throttling scenarios

```typescript
describe('LinearService', () => {
  describe('searchIssues', () => {
    it('should handle "me" assignee filter', async () => {
      // Test the 'me' → actual user ID transformation
    });
    
    it('should limit results to maximum of 250', async () => {
      // Test query limit enforcement
    });
    
    it('should handle API rate limiting', async () => {
      // Test graceful rate limit handling
    });
  });
});
```

#### **Utility Tests**
- ✅ **Config Validation** - Environment variable parsing
- ✅ **Logger Functionality** - Log level filtering and output
- ✅ **Error Handling** - Custom error classes and formatting

### **2. Integration Tests**

#### **MCP Server Integration**
- ✅ **Tool Registration** - All 5 tools properly registered
- ✅ **Tool Execution** - End-to-end tool call flow
- ✅ **Error Responses** - Proper MCP error formatting
- ✅ **Data Flow** - Linear API → Service → MCP response

```typescript
describe('MCP Server Integration', () => {
  it('should handle complete search_issues workflow', async () => {
    // Test: MCP request → Linear API → formatted response
  });
});
```

### **3. End-to-End Tests**

#### **MCP Protocol Compliance**
- 🔄 **JSON-RPC Protocol** - Proper request/response format
- 🔄 **Tool Schema Validation** - Input schema compliance
- 🔄 **Error Handling** - MCP error response format
- 🔄 **Client Compatibility** - Works with Claude, Cursor, etc.

### **4. Performance Tests**

#### **Load Testing**
- 🔄 **Large Result Sets** - 250 issues with full metadata
- 🔄 **Concurrent Requests** - Multiple simultaneous API calls
- 🔄 **Memory Usage** - Memory efficiency with large datasets
- 🔄 **Response Times** - Performance benchmarks

## **Mock Strategy**

### **Linear SDK Mocking**

```typescript
// Mock Linear Client with realistic responses
const mockLinearClient = {
  teams: jest.fn().mockResolvedValue({ nodes: mockTeams }),
  issues: jest.fn().mockResolvedValue({ nodes: mockIssues }),
  createIssue: jest.fn().mockResolvedValue({ issue: mockCreatedIssue }),
  updateIssue: jest.fn().mockResolvedValue({ issue: mockUpdatedIssue }),
  viewer: mockViewer,
};
```

### **Environment Mocking**

```typescript
// Mock environment for consistent testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.LINEAR_API_KEY = 'test-api-key';
```

### **MCP Transport Mocking**

```typescript
// Mock stdio transport for protocol testing
const mockTransport = {
  write: jest.fn(),
  read: jest.fn(),
  close: jest.fn(),
};
```

## **Test Data Strategy**

### **Fixtures Design**
1. **Realistic Data** - Based on actual Linear API responses
2. **Edge Cases** - Empty results, null values, long strings
3. **Error Scenarios** - API errors, network timeouts, invalid data
4. **Performance Data** - Large datasets for load testing

### **Data Consistency**
- **Immutable Fixtures** - Test data doesn't change between tests
- **Factory Functions** - Generate fresh test data when needed
- **Snapshot Testing** - Capture and compare complex object outputs

## **Testing Best Practices**

### **Test Organization**
- ✅ **Descriptive Names** - Clear test descriptions
- ✅ **AAA Pattern** - Arrange, Act, Assert structure
- ✅ **Single Responsibility** - One assertion per test
- ✅ **Isolated Tests** - No dependencies between tests

### **Mocking Guidelines**
- ✅ **Mock External Dependencies** - Linear SDK, file system, network
- ✅ **Don't Mock What You Own** - Test your own code directly
- ✅ **Reset Mocks** - Clean state between tests
- ✅ **Verify Interactions** - Assert mock calls and arguments

### **Error Testing**
- ✅ **Happy Path** - Test successful scenarios
- ✅ **Error Scenarios** - Test failure conditions
- ✅ **Edge Cases** - Test boundary conditions
- ✅ **Performance** - Test under load

## **Running Tests**

### **Available Scripts**

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch

# Debug mode with verbose output
npm run test:debug
```

### **Test Environment Setup**

```bash
# Required environment variables for testing
LINEAR_API_KEY=test-api-key
LOG_LEVEL=error
NODE_ENV=test
```

### **CI/CD Integration**

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## **Coverage Targets**

### **Coverage Goals**
- **Overall Coverage**: >90%
- **Service Layer**: >95%
- **Utility Functions**: >100%
- **Critical Paths**: 100%

### **Coverage Reports**
- **HTML Report** - `coverage/index.html`
- **LCOV Report** - `coverage/lcov.info`
- **Console Output** - Real-time coverage feedback

## **Test Maintenance**

### **Regular Tasks**
1. **Update Fixtures** - Keep test data current with API changes
2. **Review Coverage** - Identify and test uncovered code paths
3. **Performance Benchmarks** - Monitor test execution times
4. **Dependency Updates** - Keep testing libraries current

### **Test Quality Metrics**
- **Test Speed** - Unit tests <50ms, Integration tests <5s
- **Flaky Test Rate** - <1% test failure rate
- **Coverage Trend** - Coverage should not decrease
- **Test-to-Code Ratio** - ~1:1 ratio for critical components

## **Future Enhancements**

### **Planned Improvements**
- 🔄 **Visual Regression Testing** - Screenshot comparisons
- 🔄 **Contract Testing** - API contract validation
- 🔄 **Chaos Engineering** - Fault injection testing
- 🔄 **Property-Based Testing** - Generative test data

### **Monitoring & Observability**
- 🔄 **Test Metrics Dashboard** - Real-time test health
- 🔄 **Performance Trending** - Track performance over time
- 🔄 **Flaky Test Detection** - Automatic identification of unstable tests
- 🔄 **Coverage Alerts** - Notifications for coverage drops

## **Contributing to Tests**

### **Adding New Tests**
1. **Follow Naming Conventions** - `*.test.ts` for test files
2. **Use Appropriate Test Type** - Unit vs Integration vs E2E
3. **Include Documentation** - Comment complex test scenarios
4. **Update Coverage Goals** - Ensure new code is tested

### **Test Review Checklist**
- [ ] Tests follow AAA pattern
- [ ] Mocks are properly configured
- [ ] Error scenarios are covered
- [ ] Performance implications considered
- [ ] Documentation updated

---

This testing strategy ensures the Linear MCP Server is robust, maintainable, and production-ready. The comprehensive test suite provides confidence in code changes and enables rapid development while maintaining quality. 