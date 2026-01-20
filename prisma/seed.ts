import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin settings with default password "admin123"
  const passwordHash = await bcrypt.hash("admin123", 10)
  await prisma.adminSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      passwordHash,
      starPointsRatio: 10,
    },
  })

  // Create sample kids
  const kid1 = await prisma.kid.upsert({
    where: { id: "kid1" },
    update: {},
    create: {
      id: "kid1",
      name: "Emma",
      avatarColor: "#F472B6",
      totalPoints: 50,
    },
  })

  const kid2 = await prisma.kid.upsert({
    where: { id: "kid2" },
    update: {},
    create: {
      id: "kid2",
      name: "Lucas",
      avatarColor: "#60A5FA",
      totalPoints: 30,
    },
  })

  // Create sample tasks using upsert
  const tasks = [
    { id: "task1", kidId: kid1.id, title: "Brush teeth", description: "Morning and evening", pointValue: 5, isRecurring: true, recurringType: "daily" },
    { id: "task2", kidId: kid1.id, title: "Make bed", description: null, pointValue: 10, isRecurring: true, recurringType: "daily" },
    { id: "task3", kidId: kid1.id, title: "Read for 20 minutes", description: null, pointValue: 15, isRecurring: true, recurringType: "daily" },
    { id: "task4", kidId: kid2.id, title: "Clean room", description: null, pointValue: 20, isRecurring: true, recurringType: "weekly" },
    { id: "task5", kidId: kid2.id, title: "Practice piano", description: "30 minutes", pointValue: 15, isRecurring: true, recurringType: "daily" },
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    })
  }

  // Create sample rewards using upsert
  const rewards = [
    { id: "reward1", name: "30 min Screen Time", description: "Extra 30 minutes of tablet or TV", pointCost: 30 },
    { id: "reward2", name: "Ice Cream", description: "A delicious ice cream treat", pointCost: 50 },
    { id: "reward3", name: "New Toy (small)", description: "Pick a small toy from the store", pointCost: 100 },
    { id: "reward4", name: "Movie Night", description: "Choose a movie for family movie night", pointCost: 75 },
    { id: "reward5", name: "Stay Up Late", description: "Stay up 30 minutes past bedtime", pointCost: 40 },
  ]

  for (const reward of rewards) {
    await prisma.reward.upsert({
      where: { id: reward.id },
      update: {},
      create: reward,
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
