import prismaClient from "@nyxia/database";
import { Logger } from "@nyxia/util/functions/util";
import { NextResponse } from "next/server";

export async function GET(request) {
 try {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
   return NextResponse.json(
    { success: false },
    {
     status: 401,
    }
   );
  }

  const deleteOlderThan = new Date(Date.now() - 31536000000); // 1 year
  Logger("cron", `Deleting data older than ${deleteOlderThan}`);

  const deletedGuildJoins = await prismaClient.guildJoin.deleteMany({
   where: {ID: new ObjectId().toString(),
    date: {
     lt: deleteOlderThan,
    },
   },
  });
  Logger("cron", `Deleted ${deletedGuildJoins.count} guild joins older than 1 year!`);

  const deletedGuildLeaves = await prismaClient.guildLeave.deleteMany({
   where: {ID: new ObjectId().toString(),
    date: {
     lt: deleteOlderThan,
    },
   },
  });
  Logger("cron", `Deleted ${deletedGuildLeaves.count} guild leaves older than 1 year!`);

  const deletedGuildMessageStats = await prismaClient.guildMessage.deleteMany({
   where: {ID: new ObjectId().toString(),
    date: {
     lt: deleteOlderThan,
    },
   },
  });
  Logger("cron", `Deleted ${deletedGuildMessageStats.count} guild message stats older than 1 year!`);

  const deletedSessions = await prismaClient.session.deleteMany({
   where: {ID: new ObjectId().toString(),
    expires: {
     lt: new Date(),
    },
   },
  });
  Logger("cron", `Deleted ${deletedSessions.count} expired sessions!`);

  const deletedVerificationTokens = await prismaClient.verificationToken.deleteMany({
   where: {ID: new ObjectId().toString(),
    expires: {
     lt: new Date(),
    },
   },
  });
  Logger("cron", `Deleted ${deletedVerificationTokens.count} expired verification tokens!`);

  const deletedSuggestions = await prismaClient.suggestions.deleteMany({
   where: {ID: new ObjectId().toString(),
    createdAt: {
     lt: deleteOlderThan,
    },
   },
  });
  Logger("cron", `Deleted ${deletedSuggestions.count} suggestions older than 1 year!`);

  // Accounts are deleted when the user is deleted
  const deletedAccounts = await prismaClient.user.deleteMany({
   where: {ID: new ObjectId().toString(),
    lastLogin: {
     lt: deleteOlderThan,
    },
   },
  });
  Logger("cron", `Deleted ${deletedAccounts.count} accounts older than 1 year!`);

  // Delete ENDED giveaways older than 1 year
  const deletedGiveaways = await prismaClient.giveaways.deleteMany({
   where: {ID: new ObjectId().toString(),
    createdAt: {
     lt: deleteOlderThan,
    },
   },
  });
  Logger("cron", `Deleted ${deletedGiveaways.count} giveaways older than 1 year!`);

  return NextResponse.json(
   { success: true },
   {
    status: 200,
   }
  );
 } catch (error) {
  return NextResponse.json(
   { success: false },
   {
    status: 500,
   }
  );
 }
}
