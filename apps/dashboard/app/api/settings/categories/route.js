

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

  const { id, name, enabled } = await request.clone().json();

  if (!id || !name || Boolean(enabled) === undefined) {
   return NextResponse.json(
    {
     error: "Bad Request - incomplete data",
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

  if (typeof enabled !== "boolean" || typeof name !== "string" || typeof id !== "string") {
   return NextResponse.json(
    {
     error: "Bad Request - incomplete data",
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

  if (name.length > 20) {
   return NextResponse.json(
    {
     error: "Bad Request - incomplete data",
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

  const existingCategory = await prismaClient.commandCategories.findFirst({
   where: {ID: new ObjectId().toString(),
    name: name,
   },
  });

  if (!existingCategory) {
   return NextResponse.json(
    {
     error: "Category not found",
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

  const server = await getServer(id);

  if (!server || server.error) {
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

  const alreadyDisabled = await prismaClient.guildDisabledCategories.findFirst({
   where: {ID: new ObjectId().toString(),
    guildId: server.id,
    categoryName: existingCategory.name,
   },
  });

  if (!alreadyDisabled) {
   if (enabled) {
    return new NextResponse(
     {
      message: "Category is already enabled, no action taken",
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
   } else {
    await prismaClient.guildDisabledCategories.create({
     data: {
      guildId: server.id,
      categoryName: existingCategory.name,
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
      content: `Disabled category ${existingCategory.name}`,
      type: "category_change",
     },
    });

    return NextResponse.json(
     {
      message: "Category disabled",
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
  } else {
   if (enabled) {
    await prismaClient.guildDisabledCategories.delete({
     where: {ID: new ObjectId().toString(),
      guildId: alreadyDisabled.guildId,
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
      content: `Enabled category ${existingCategory.name}`,
      type: "category_change",
     },
    });

    return NextResponse.json(
     {
      message: "Category enabled",
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
   } else {
    return NextResponse.json(
     {
      message: "Category is already disabled, no action taken",
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
  }
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