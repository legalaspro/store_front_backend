const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

const jasmine = new Jasmine();

jasmine.loadConfigFile('spec/support/jasmine.json');

jasmine.env.clearReporters(); 
jasmine.addReporter(new SpecReporter({
  spec: {
    displayStacktrace: 'all',
    displaySpecDuration: true,
    displaySuiteNumber: true
  },
  summary: {
    displayStacktrace: true
  },
  colors: {
    enabled: true
  }
}));

jasmine.execute();