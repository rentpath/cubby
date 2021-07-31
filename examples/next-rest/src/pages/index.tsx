import React from 'react'
import { withCubby } from '@cubbyjs/react'
import { getListings } from './api/listings'
import { Header, headerStores } from '../components/header'
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { parseCookies } from '../utils'
import { Listings, listingsStore } from '../components/listings'
import { fetchHeaderData } from '../ssrUtils'

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
  const userId = parseCookies(context.req)['userId'] ?? null

  const [headerData, listings] = await Promise.all([fetchHeaderData(userId), getListings()])
  return {
    props: {
      cubbyState: {
        ...headerData,
        listingsStore: listings,
      },
    },
  }
}
