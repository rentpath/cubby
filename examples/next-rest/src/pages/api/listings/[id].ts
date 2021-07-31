import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../lib/prisma'
import { Unpromiseify } from '../../../utils'

export async function getListing(id: number) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      floorplans: true,
    },
  })
}

export type Listing = Unpromiseify<ReturnType<typeof getListing>>

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json(await getListing(Number(req.query.id)))
}
