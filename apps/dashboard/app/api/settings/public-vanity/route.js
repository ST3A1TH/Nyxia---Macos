

import prismaClient from "@nyxia/database";
import { getServer, getGuildMember } from "@nyxia/util/functions/guild";
import { getSession } from "lib/session";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
 try {
  const session = await getSession();
  const start = Date.now();

  if (!session || !session.access_token) {
   return NextResponse.json(
    {
     error: "Unauthorized - you need to log in first",
    },
    {
     status: 401,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  const { id, vanity } = await request.clone().json();

  if (!id || typeof id !== "string" || typeof vanity !== "string") {
   return NextResponse.json(
    {
     error: "Missing id, vanity or invalid types provided",
     code: 400,
    },
    {
     status: 400,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  if (!vanity.match(/^[a-zA-Z0-9]+$/)) {
   return NextResponse.json(
    {
     error: "Vanity must be alphanumeric",
     code: 400,
    },
    {
     status: 400,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  if (vanity.length > 20) {
   return NextResponse.json(
    {
     error: "Vanity must be less than 20 characters",
     code: 400,
    },
    {
     status: 400,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  const keys = [
    'tsukiyo',
    'tsukiyodev',
    'tsukiyodevteam',
    'support',
    'help',
    'discord'
  ]

  if (keys.includes(vanity)) {
    return NextResponse.json(
     {
      error: `Vanity cannot be "${vanity}"`,
      code: 400,
     },
     {
      status: 400,
      headers: {
       ...(process.env.NODE_ENV !== "production" && {
        "Server-Timing": `response;dur=${Date.now() - start}ms`,
       }),
      },
     }
    );
   }

  const server = await getServer(id);

  if (!server || server.message) {
   return NextResponse.json(
    {
     error: "Unable to find this server",
     code: 404,
    },
    {
     status: 404,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  if (!server.bot) {
   return NextResponse.json(
    {
     error: "Bot is unable to find this server",
     code: 404,
    },
    {
     status: 404,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  const serverMember = await getGuildMember(server.id, session.access_token);

  if (!serverMember || !serverMember.permissions_names || !serverMember.permissions_names.includes("ManageGuild") || !serverMember.permissions_names.includes("Administrator")) {
   return NextResponse.json(
    {
     error: "Unauthorized - you need to log in first",
     code: 401,
    },
    {
     status: 401,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  const checkVanity = await prismaClient.guild.findFirst({
   where: {ID: new ObjectId().toString(),
    vanity: vanity,
   },
  });

  if (checkVanity && checkVanity.guildId !== id) {
   return NextResponse.json(
    {
     error: "Vanity already taken",
     code: 400,
    },
    {
     status: 400,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  const current = await prismaClient.guild.findUnique({
   where: {ID: new ObjectId().toString(),
    guildId: id,
   },
  });

  if (!current) {
   await prismaClient.guild.create({
    data: {
     guildId: id,
     vanity: vanity,
    },
   });

   await prismaClient.guildLogs.create({
    data: {
     ID: new ObjectId().toString(),
     guild: {
      connectOrCreate: {
       where: {ID: new ObjectId().toString(),
        guildId: id,
       },
       create: {
        guildId: id,
       },
      },
     },
     user: {
      connect: {
        authorId: session.sub,
      },
     },
     content: `Set vanity to ${vanity}`,
     type: "vanity",
    },
   });

   return NextResponse.json(
    {
     message: `Set vanity to ${vanity}`,
     code: 200,
    },
    {
     status: 200,
     headers: {
      ...(process.env.NODE_ENV !== "production" && {
       "Server-Timing": `response;dur=${Date.now() - start}ms`,
      }),
     },
    }
   );
  }

  await prismaClient.guild.update({
   where: {ID: new ObjectId().toString(),
    guildId: id,
   },
   data: {
    vanity: vanity,
   },
  });

  await prismaClient.guildLogs.create({
   data: {
    ID: new ObjectId().toString(),
    guild: {
     connectOrCreate: {
      where: {ID: new ObjectId().toString(),
       guildId: id,
      },
      create: {
       guildId: id,
      },
     },
    },
    user: {
     connect: {
      authorId: session.sub,
     },
    },
    content: `Set vanity to ${vanity}`,
    type: "vanity",
   },
  });

  return NextResponse.json(
   {
    message: `Set vanity to ${vanity}`,
    code: 200,
   },
   {
    status: 200,
    headers: {
     ...(process.env.NODE_ENV !== "production" && {
      "Server-Timing": `response;dur=${Date.now() - start}ms`,
     }),
    },
   }
  );
 } catch (err) {
  return NextResponse.json(
   {
    error: "Internal Server Error",
    code: 500,
   },
   {
    status: 500,
   }
  );
 }
}
