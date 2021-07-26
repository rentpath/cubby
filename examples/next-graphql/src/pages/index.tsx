import React from 'react'
import { withCubby } from '@cubbyjs/react'
import { Header, headerStores } from '../components/header'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { parseCookies } from '../utils'
import { Listings, listingsStore } from '../components/listings'
import { fetchHeaderData } from '../ssrUtils'
import { GraphQLClient } from 'graphql-request'
import { getSdk } from '../generated/graphql'

const ApartmentsPageWithCubby = withCubby<InferGetServerSidePropsType<typeof getServerSideProps>>(
  {
    ...headerStores,
    listingsStore,
  },
  function ApartmentsPage() {
    return (
      <div>
        <Header />
        <Listings />
      </div>
    )
  }
)

export default ApartmentsPageWithCubby

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const client = new GraphQLClient(`http://${context.req.headers.host ?? ''}/api/graphql`, {})
  const sdk = getSdk(client)

  const userId = parseCookies(context.req)['userId'] ?? null

  const [headerData, listings] = await Promise.all([
    fetchHeaderData(userId),
    sdk.Listings().then((res) => res.listings),
  ])
  return {
    props: {
      cubbyState: {
        ...headerData,
        listingsStore: listings,
      },
    },
  }
}
