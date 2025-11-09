// Mock implementation of p-throttle for testing
// Simply executes the function immediately without throttling
const pThrottle = function() {
  return (fn) => fn;
};

module.exports = pThrottle;
module.exports.default = pThrottle;
