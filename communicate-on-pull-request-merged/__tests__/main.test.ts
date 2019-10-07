const path = require('path');
const nock = require('nock');

const validScenarios = [{
    response: 'pull-request-closed.json'
  }
];

const invalidScenarios = [{
    response: 'issue.json',
  }, {
    response: 'action-opened.json',
  }, {
    response: 'pull-request-closed-but-not-merged'
  }
];

describe('action test suite', () => {
  for (const scenario of validScenarios) {
    it(`It posts a comment on a merged issue for (${scenario.response})`, async () => { 
      process.env['INPUT_REPO-TOKEN'] = 'token';
      process.env['INPUT_PR-COMMENT'] = 'message';
      process.env['INPUT_PR-LABEL'] = 'label';

      process.env['GITHUB_REPOSITORY'] = 'foo/bar';
      process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, scenario.response);

      const api = nock('https://api.github.com')
        .persist()
        .post('/repos/foo/bar/pulls/10/reviews', '{\"body\":\"message\",\"event\":\"COMMENT\"}')
        .reply(200)
        .post('/repos/foo/bar/issues/10/labels', '{\"labels\":[\"label\"]}')
        .reply(200);

      const main = require('../src/main');
      await main.run();

      expect(api.isDone()).toBeTruthy();
    });
  }

  for (const scenario of invalidScenarios) {
    it(`It does not post a comment on a closed pull request for (${scenario.response})`, async () => {
        process.env['INPUT_REPO-TOKEN'] = 'token';
        process.env['INPUT_PR-COMMENT'] = 'message';
        process.env['INPUT_PR-LABEL'] = 'label';
  
        process.env['GITHUB_REPOSITORY'] = 'foo/bar';
        process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, scenario.response);

        const api = nock('https://api.github.com')
          .persist()
          .post('/repos/foo/bar/pulls/10/reviews', '{\"body\":\"message\",\"event\":\"COMMENT\"}')
          .reply(200)
          .post('/repos/foo/bar/issues/10/labels', '{\"labels\":[\"label\"]}')
          .reply(200);
  
        const main = require('../src/main');
        await main.run();
  
        expect(api.isDone()).not.toBeTruthy();
    });
  }
});
