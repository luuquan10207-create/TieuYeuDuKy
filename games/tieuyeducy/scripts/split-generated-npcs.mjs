import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const out="public/assets/npcs/frames";
await mkdir(out,{recursive:true});

async function save(source,left,top,width,height,index){
  const cell=await sharp(source).extract({left,top,width,height}).png().toBuffer();
  await sharp(cell)
    .trim({background:{r:0,g:0,b:0,alpha:0}})
    .extend({top:10,bottom:10,left:10,right:10,background:{r:0,g:0,b:0,alpha:0}})
    .png()
    .toFile(`${out}/npc-${index}.png`);
}

const cell=418;
// First generated sheet: top-centre plus two complete rows of three.
await save("public/assets/npcs/generated/missing-npcs-7.png",cell,0,cell,cell,8);
let index=9;
for(const row of [1,2]) for(let col=0;col<3;col++)
  await save("public/assets/npcs/generated/missing-npcs-7.png",col*cell,row*cell,417,417,index++);

// Second generated sheet: the final two marked NPCs.
await save("public/assets/npcs/generated/missing-npcs-2.png",0,0,746,1054,15);
await save("public/assets/npcs/generated/missing-npcs-2.png",746,0,746,1054,16);
