import React from 'react'
import { withCubby } from '@cubbyjs/react'
import { Header, headerStores } from '../../components/header'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { parseCookies } from '../../utils'
import { Listing, listingStore } from '../../components/listing'
import { fetchHeaderData } from '../../ssrUtils'
import { GraphQLClient } from 'graphql-request'
import { getSdk } from '../../generated/graphql'

const ListingPageWithCubby = withCubby<InferGetServerSidePropsType<typeof getServerSideProps>>(
  {
    ...headerStores,
    listingStore,
  },
  function ListingPage() {
    return (
      <div>
        <Header />
        <Listing />
      </div>
    )
  }
)

export default ListingPageWithCubby

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const client = new GraphQLClient(`http://${context.req.headers.host ?? ''}/api/graphql`, {})
  const sdk = getSdk(client)

  const userId = parseCookies(context.req)['userId'] ?? null
  const listingId = Number(context.query['id'])
  const [headerData, listing] = await Promise.all([
    fetchHeaderData(userId),
    sdk.Listing({ id: listingId }).then((result) => result.listing),
  ])
  return {
    props: {
      cubbyState: {
        ...headerData,
        listingStore: listing,
      },
    },
  }
}
