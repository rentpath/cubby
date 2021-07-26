import { GraphQLClient } from 'graphql-request'
import { getSdk } from '../generated/graphql'

const client = new GraphQLClient(
  `${
    typeof window !== 'undefined' ? document.location.origin : 'http://localhost:3000'
  }/api/graphql`,
  {
    headers: {},
  }
)

export default getSdk(client)
