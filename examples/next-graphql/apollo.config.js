module.exports = {
  client: {
    includes: ['src/graphql/**/*.graphql'],
    service: {
      name: 'cubby',
      localSchemaFile: 'src/generated/schema.graphql',
    },
  },
}
