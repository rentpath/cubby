import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../../../lib/prisma'

export async function addFavorite(userId: number, listingId: number) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      favorites: {
        connect: [{ id: listingId }],
      },
    },
  })
}

export async function removeFavorite(userId: number, listingId: number) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      favorites: {
        disconnect: [{ id: listingId }],
      },
    },
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = Number(req.query.id)
  const listingId = Number(req.query.listingId)
  if (req.method === 'POST') {
    res.json(await addFavorite(userId, listingId))
  } else if (req.method === 'DELETE') {
    res.json(await removeFavorite(userId, listingId))
  }
  res.status(405)
}
