module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'jira-ticket-rule': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'jira-ticket-rule': ({ body }) => {
          return [
            /\[.+\]\(https.+\)/.test(body),
            `You must provide a commit message that wikigen can parse, with a link to the card in the markdown form of '[Card](<CARD_LINK>)'`,
          ]
        },
      },
    },
  ],
}
