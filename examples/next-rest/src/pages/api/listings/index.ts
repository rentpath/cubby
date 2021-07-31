import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../lib/prisma'
import { Unpromiseify } from '../../../utils'

export async function getListings() {
  const [floorplans, listings] = await Promise.all([
    prisma.floorplan.groupBy({
      by: ['listingId'],
      _count: true,
    }),
    prisma.listing.findMany({}),
  ])

  const floorplanCountByListingId = new Map<number, number>()
  for (let floorplan of floorplans) {
    floorplanCountByListingId.set(floorplan.listingId, floorplan._count)
  }

  return listings.map((listing) => ({
    ...listing,
    floorplanCount: floorplanCountByListingId.get(listing.id) ?? 0,
  }))
}

export type Listings = Unpromiseify<ReturnType<typeof getListings>>

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json(await getListings())
}
