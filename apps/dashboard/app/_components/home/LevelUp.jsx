"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "@/components/client/shared/Image";

export function LevelUp({ avatar, username }) {
 const [level, setLevel] = useState(2);
 const [xp, setXp] = useState(46);

 const setIt = () => {
  toast("You leveled up!", {
   icon: <span className="text-lg">🔥</span>,
  });
  setLevel(Math.floor(Math.random() * 9 + 1));
  setXp(Math.floor(Math.random() * 80) + 5);
 };

 return (
  <div className="mt-6 flex flex-row items-center gap-1">
   <Image src={avatar} alt="User avatar" quality={40} width={40} height={64} className="h-10 min-h-10 w-10 min-w-10 self-baseline rounded-full" />
   <span className="ml-2">
    <span className="font-bold">{username}</span> leveled up to <span className="text-accent-primary font-bold [font-feature-settings:'tnum']">level {level}</span>{" "}
    <span onClick={setIt} className="cursor-pointer select-none">
     🔥
    </span>
    <span className="relative mt-2 block h-2 w-full rounded-full bg-[#2b2d31]">
     <span className="bg-accent-primary absolute inset-0 h-2 rounded-full duration-500" style={{ width: `${xp}%` }} />
    </span>
   </span>
  </div>
 );
}
