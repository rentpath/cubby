import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../../lib/prisma'

export async function getUser(id: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      favorites: {
        select: {
          id: true,
        },
      },
    },
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json(await getUser(Number(req.query.id)))
}
