const Jasmine = require('jasmine');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

const jasmine = new Jasmine();
jasmine.loadConfigFile('spec/support/jasmine.json'); // adjust if your jasmine.json file is located elsewhere

jasmine.env.clearReporters();
jasmine.addReporter(new SpecReporter({
  spec: {
    displayStacktrace: 'all'
  }
}));

jasmine.execute();