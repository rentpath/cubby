import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

function makeArray<T>(count: number, cb: (index: number) => T, offset: number = 0): T[] {
  const arr: T[] = []
  for (let i = offset; i < count + offset; i++) {
    arr.push(cb(i))
  }
  return arr
}

const listingData: Prisma.ListingCreateInput[] = makeArray<Prisma.ListingCreateInput>(10, (i) => ({
  name: `Example ${i} Apartments`,
  address: `${makeArray(4, () => i).join('')} Example Drive`,
  floorplans: {
    create: makeArray(
      Math.floor(Math.random() * 3) + 2,
      (k) => ({
        baths: k,
        beds: k,
        sqft: k * 500 + Math.floor(Math.random() * 500),
      }),
      1
    ),
  },
}))

async function main() {
  console.log('Start seeding...')
  for (const l of listingData) {
    const listing = await prisma.listing.create({
      data: l,
    })
    console.log(`Created listing with id: ${listing.id}`)
  }

  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `example-user-${i}@example.com`,
      },
    })
    console.log(`Created user with id: ${user.id}`)
  }
  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
