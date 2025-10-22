import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const system = await prisma.trailSystem.create({
    data: {
      name: "Allatoona Creek Park",
      location: "Acworth, GA",
      trails: {
        create: [
          {
            name: "Rusty Bucket",
            difficulty: "Intermediate",
            distanceKm: 4.2,
            elevationGainM: 120,
            description: "A flowy loop with short climbs and wooden features."
          },
          {
            name: "Voodoo",
            difficulty: "Advanced",
            distanceKm: 3.6,
            elevationGainM: 180,
            description: "Technical climb and descent with rock gardens."
          }
        ]
      }
    }
  })

  const user = await prisma.user.create({
    data: {
      name: "Jason Franklin",
      email: "jason@example.com",
      homeTrail: { connect: { id: system.trails[0].id } }
    }
  })

  const ride = await prisma.ride.create({
    data: {
      userId: user.id,
      trailId: system.trails[0].id,
      date: new Date(),
      durationMin: 90,
      notes: "Great ride, perfect weather!",
      isGroupRide: true,
      attendees: {
        create: [
          { user: { connect: { id: user.id } } }
        ]
      }
    },
    include: { trail: true }
  })

  console.log(`Seeded ride on ${ride.trail.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
