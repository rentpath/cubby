import React from 'react'
import { withCubby } from '@cubbyjs/react'
import { Header, headerStores } from '../../components/header'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { parseCookies } from '../../utils'
import { Listing, listingStore } from '../../components/listing'
import { getListing } from '../api/listings/[id]'
import { fetchHeaderData } from '../../ssrUtils'

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
  const userId = parseCookies(context.req)['userId'] ?? null
  const listingId = Number(context.query['id'])

  const [headerData, listing] = await Promise.all([fetchHeaderData(userId), getListing(listingId)])
  return {
    props: {
      cubbyState: {
        ...headerData,
        listingStore: listing,
      },
    },
  }
}
