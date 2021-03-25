module.exports = {
  types: [
    { name: 'feat       ✨  New feature', value: 'feat' },
    { name: 'fix        🐛  Bug fix', value: 'fix' },
    { name: 'refactor   ♻️   Neither fixes a bug nor adds a feature', value: 'refactor' },
    { name: 'perf       ⚡️  Improves performance', value: 'perf' },
    { name: 'test       🚦  Add or modify tests', value: 'test' },
    { name: 'chore      🔧  Changes build process or tooling and libraries', value: 'chore' },
  ],
  scopes: [
    { name: 'commit' },
  ],
  allowTicketNumber: true,
  isTicketNumberRequired: true,
  ticketLinkPrefix: 'https://rentpath.atlassian.net/browse/',
  ticketTemplate: '[Card]($1)',
  ticketNumberRegExp: '\\w+-\\d{1,6}',
  scopeOverrides: {
    // it needs to match the value for field type. Eg.: 'fix'
    perf: [{ name: 'assets' }, { name: 'cls' }, { name: 'fmp' }, { name: 'lcp' }, { name: 'tti' }],
    test: [{ name: 'e2e' }, { name: 'unit' }],
  },
  messages: {
    type: "Select the type of change that you're committing:",
    scope: '\nDenote the SCOPE of this change (optional):',
    customScope: 'Denote the SCOPE of this change:',
    subject: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
    body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: 'List any BREAKING CHANGES (optional):\n',
    footer: 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n',
    confirmCommit: 'Are you sure you want to proceed with the commit above?',
  },
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['breaking', 'footer'], // skip any questions you want
  subjectLimit: 100,
  breaklineChar: '|', // It is supported for fields body and footer.
}
