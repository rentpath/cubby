import { Floorplan, Listing, User, $settings } from 'nexus-prisma'
import { intArg, makeSchema, objectType, queryType, nonNull, mutationType } from 'nexus'
import path from 'path'
import { resolve } from 'path/posix'

const ListingObjectType = objectType({
  name: Listing.$name,
  description: Listing.$description,
  definition(t) {
    t.field(Listing.id)
    t.field(Listing.name)
    t.field(Listing.address)
    t.field(Listing.floorplans)
    t.field(Listing.favoritedUsers)
  },
})

const FloorplansObjectType = objectType({
  name: Floorplan.$name,
  description: Floorplan.$description,
  definition(t) {
    t.field(Floorplan.id)
    t.field(Floorplan.beds)
    t.field(Floorplan.baths)
    t.field(Floorplan.sqft)
    t.field(Floorplan.listing)
    t.field(Floorplan.listingId)
  },
})

const UserObjectType = objectType({
  name: User.$name,
  description: User.$description,
  definition(t) {
    t.field(User.id)
    t.field(User.email)
    t.field(User.favorites)
  },
})

const Query = queryType({
  definition(t) {
    t.list.field('users', {
      type: 'User',
      async resolve(_root, _args, ctx) {
        return ctx.prisma.user.findMany({ include: { favorites: true } })
      },
    })

    t.field('user', {
      type: 'User',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(_root, { id }, { prisma }) {
        return prisma.user.findUnique({
          where: { id },
          include: {
            favorites: true,
          },
        })
      },
    })

    t.list.field('listings', {
      type: 'Listing',
      async resolve(_root, _args, { prisma }) {
        return prisma.listing.findMany({ include: { floorplans: true } })
      },
    })

    t.field('listing', {
      type: 'Listing',
      args: {
        id: nonNull(intArg()),
      },
      async resolve(_root, { id }, { prisma }) {
        return prisma.listing.findUnique({
          where: { id },
          include: {
            floorplans: true,
          },
        })
      },
    })
  },
})

const Mutation = mutationType({
  definition(t) {
    t.field('addFavorite', {
      type: 'User',
      args: {
        userId: nonNull(intArg()),
        listingId: nonNull(intArg()),
      },
      async resolve(_root, { userId, listingId }, { prisma }) {
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
      },
    })

    t.field('removeFavorite', {
      type: 'User',
      args: {
        userId: nonNull(intArg()),
        listingId: nonNull(intArg()),
      },
      async resolve(_root, { userId, listingId }, { prisma }) {
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
      },
    })
  },
})

export const schema = makeSchema({
  outputs: {
    schema: path.join(__dirname, '../generated/schema.graphql'),
    typegen: path.join(__dirname, '../generated/schema-types.d.ts'),
  },
  types: [ListingObjectType, FloorplansObjectType, UserObjectType, Query, Mutation],
  contextType: {
    module: path.resolve(require.resolve('./prisma')),
    export: 'Context',
  },
})
