import { ApolloServer } from 'apollo-server-micro'
import { MicroRequest } from 'apollo-server-micro/dist/types'
import { ServerResponse } from 'http'
import { schema } from '../../lib/schema'
import { createContext } from './../../lib/prisma'

export const apolloServer = new ApolloServer({
  context: createContext,
  schema,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

const serverHandler = apolloServer.start().then(() =>
  apolloServer.createHandler({
    path: '/api/graphql',
  })
)

export default async function handler(res: MicroRequest, req: ServerResponse) {
  return (await serverHandler)(res, req)
}
