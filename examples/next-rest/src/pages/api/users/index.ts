import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../lib/prisma'
import { Unpromiseify } from '../../../utils'

export async function getUsers() {
  return prisma.user.findMany({})
}

export type Users = Unpromiseify<ReturnType<typeof getUsers>>

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json(await getUsers())
}
