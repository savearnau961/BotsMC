const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const blockFinderPlugin = require('mineflayer-blockfinder')(mineflayer);
const { GoalBlock, GoalNear } = goals;
const mcData = require('minecraft-data')('1.20.1');
const mineflayerViewer = require('prismarine-viewer').mineflayer;

const botName = process.argv[2] || 'ResourceGT';
const bot = mineflayer.createBot({ username: botName });

bot.loadPlugin(pathfinder);
blockFinderPlugin(bot);

// ---------------- VARIABLES ----------------
let basePosition = null;
let miningQueue = [];
let chestList = [];
const MAX_CHESTS = 64;
let actionLog = [];

// Minerales vanilla + dripstone
const vanillaOres = [
  "minecraft:coal_ore","minecraft:diamond_ore","minecraft:emerald_ore",
  "minecraft:gold_ore","minecraft:iron_ore","minecraft:lapis_ore",
  "minecraft:nether_quartz_ore","minecraft:redstone_ore",
  "minecraft:amethyst_block","minecraft:budding_amethyst",
  "minecraft:pointed_dripstone","minecraft:dripstone_block"
];

// Minerales GregTech CEu Modern
const gregTechOres = [
  "gregtech:ore_almandine","gregtech:ore_aluminium","gregtech:ore_amethyst",
  "gregtech:ore_apatite","gregtech:ore_banded_iron","gregtech:ore_barite",
  "gregtech:ore_bastnasite","gregtech:ore_bauxite","gregtech:ore_bentonite",
  "gregtech:ore_beryllium","gregtech:ore_bismuth","gregtech:ore_blue_topaz",
  "gregtech:ore_bornite","gregtech:ore_brown_limonite","gregtech:ore_calcite",
  "gregtech:ore_cassiterite","gregtech:ore_certus_quartz","gregtech:ore_chalcocite",
  "gregtech:ore_chalcopyrite","gregtech:ore_chromite","gregtech:ore_cinnabar",
  "gregtech:ore_cobalt","gregtech:ore_cobaltite","gregtech:ore_copper",
  "gregtech:ore_cuprite","gregtech:ore_enargite","gregtech:ore_enriched_naquadah",
  "gregtech:ore_galena","gregtech:ore_garniertite","gregtech:ore_glauconite",
  "gregtech:ore_graphite","gregtech:ore_green_sapphire","gregtech:ore_grossular",
  "gregtech:ore_ilmenite","gregtech:ore_iridium","gregtech:ore_jasper",
  "gregtech:ore_lazurite","gregtech:ore_lead","gregtech:ore_lepidolite",
  "gregtech:ore_lignite_coal","gregtech:ore_lithium","gregtech:ore_magnesite",
  "gregtech:ore_magnetite","gregtech:ore_malachite","gregtech:ore_molybdenite",
  "gregtech:ore_molybdenum","gregtech:ore_monazite","gregtech:ore_naquadah",
  "gregtech:ore_neodymium","gregtech:ore_nickel","gregtech:ore_niobium",
  "gregtech:ore_oilsands","gregtech:ore_olivine","gregtech:ore_opal",
  "gregtech:ore_osmium","gregtech:ore_palladium","gregtech:ore_pentlandite",
  "gregtech:ore_phosphate","gregtech:ore_phosphor","gregtech:ore_pitchblende",
  "gregtech:ore_platinum","gregtech:ore_powellite","gregtech:ore_pyrite",
  "gregtech:ore_pyrolusite","gregtech:ore_pyrope","gregtech:ore_quartzite",
  "gregtech:ore_red_garnet","gregtech:ore_rock_salt","gregtech:ore_ruby",
  "gregtech:ore_rutile","gregtech:ore_salt","gregtech:ore_saltpeter",
  "gregtech:ore_sapphire","gregtech:ore_scheelite","gregtech:ore_sheldonite",
  "gregtech:ore_silver","gregtech:ore_soapstone","gregtech:ore_sodalite",
  "gregtech:ore_spessartine","gregtech:ore_sphalerite","gregtech:ore_spodumene",
  "gregtech:ore_stibnite","gregtech:ore_sulfur","gregtech:ore_talc",
  "gregtech:ore_tantalite","gregtech:ore_tanzanite","gregtech:ore_tennantite",
  "gregtech:ore_tenorite","gregtech:ore_tetrahedrite","gregtech:ore_thorium",
  "gregtech:ore_tin","gregtech:ore_topaz","gregtech:ore_tungstate",
  "gregtech:ore_uraninite","gregtech:ore_uranium_235","gregtech:ore_uranium_238",
  "gregtech:ore_vanadium_magnetite","gregtech:ore_vinteum","gregtech:ore_wulfenite",
  "gregtech:ore_yellow_garnet","gregtech:ore_yellow_limonite","gregtech:ore_zinc"
];

// Bloques recolectables
const explorerBlocks = [
  "minecraft:oak_log","minecraft:birch_log","minecraft:spruce_log","minecraft:jungle_log",
  "minecraft:stone","minecraft:granite","minecraft:diorite","minecraft:andesite",
  "minecraft:cobblestone","minecraft:dirt","minecraft:grass_block","minecraft:sand",
  "minecraft:red_sand","minecraft:gravel","minecraft:dandelion","minecraft:poppy",
  "minecraft:blue_orchid","minecraft:allium","minecraft:azure_bluet","minecraft:red_tulip",
  "minecraft:orange_tulip","minecraft:white_tulip","minecraft:pink_tulip","minecraft:oxeye_daisy",
  "minecraft:sunflower","minecraft:sugar_cane","minecraft:bamboo","minecraft:leather","minecraft:coal",
  "minecraft:pointed_dripstone","minecraft:dripstone_block"
];
const foodBlocks = ["minecraft:wheat_seeds","minecraft:carrot","minecraft:potato","minecraft:beetroot","minecraft:apple"];
const edibleAnimals = ["pig","sheep","chicken","cow"];

// ---------------- COMANDOS ----------------
bot.on('chat', async (username, message) => {
  if(message.startsWith('!setbase')) {
    basePosition = bot.entity.position.clone();
    bot.chat(`Base establecida en ${basePosition.x}, ${basePosition.y}, ${basePosition.z}`);
    logAction(`Base establecida en ${basePosition.x},${basePosition.y},${basePosition.z}`);
  }

  if(message.startsWith('!delbase')) {
    basePosition=null;
    bot.chat("Base eliminada correctamente.");
    logAction("Base eliminada");
  }

  if(message.startsWith('!setcofre')) {
    const args = message.split(' ').slice(1);
    const x = parseInt(args[0]), y = parseInt(args[1]), z = parseInt(args[2]);
    const block = bot.blockAt({x,y,z});
    let type=null;
    if(block.name==='chest') type=block.getProperties && block.getProperties().chestType ? 'double_chest':'chest';
    else if(block.name==='barrel') type='barrel';
    chestList.push({x,y,z,type});
    bot.chat(`Contenedor agregado en ${x},${y},${z} como ${type}`);
    logAction(`Cofre registrado en ${x},${y},${z} tipo: ${type}`);
  }

  if(message.startsWith('!minar')) {
    const mat = message.split(' ')[1];
    miningQueue.push(mat);
    bot.chat(`Agregado ${mat} a la cola de minería`);
    logAction(`Minar: ${mat}`);
    mineQueueHandler();
  }

  if(message.startsWith('!recolectar')) {
    bot.chat("Exploración iniciada...");
    logAction("Exploración iniciada");
    exploreAndGather();
  }

  if(message.startsWith('!ven')) {
    const player = bot.players[username];
    const targetPos = player.entity.position;
    bot.chat(`Viniendo hacia ti, ${username}...`);
    logAction(`Moviéndose hacia ${username}`);
    const moves = new Movements(bot, mcData);
    bot.pathfinder.setMovements(moves);
    await bot.pathfinder.goto(new GoalNear(targetPos.x,targetPos.y,targetPos.z,1));
  }

  if(message.startsWith('!ataquear')) {
    const mobName = message.split(' ')[1];
    const target = bot.nearestEntity(e=>e.name===mobName);
    if(!target) return bot.chat(`No encontré ${mobName}`);
    logAction(`Atacando ${mobName}`);
    const moves = new Movements(bot, mcData);
    bot.pathfinder.setMovements(moves);
    await bot.pathfinder.goto(new GoalNear(target.position.x,target.position.y,target.position.z,1));
    await bot.attack(target);
    logAction(`${mobName} atacado`);
  }

  if(message.startsWith('!verperspectiva')) {
    const port = parseInt(message.split(' ')[1]) || 3000;
    mineflayerViewer(bot, { port, firstPerson: true, showChest: true });
    bot.chat(`Perspectiva activa en http://localhost:${port}`);
    logAction(`Perspectiva activa en puerto ${port}`);
  }

  if(message.startsWith('!inventario')) {
    mostrarInventario();
  }
});

// ---------------- FUNCIONES AUXILIARES ----------------
function logAction(msg){
  console.log(`[Acción] ${msg}`);
  actionLog.push(msg);
  if(actionLog.length>50) actionLog.shift();
}

function mostrarInventario() {
  const items = bot.inventory.items();
  if(items.length===0){
    bot.chat("Inventario vacío");
    logAction("Inventario vacío");
    return;
  }
  bot.chat("Inventario actual:");
  logAction("Inventario actual:");
  console.table(items.map(item=>{
    const slot = item.slot;
    const row = Math.floor(slot/9)+1;
    return {nombre:item.name, cantidad:item.count, slot, fila:row};
  }));
}

// ---------------- MINERÍA ----------------
async function mineQueueHandler(){
  while(miningQueue.length>0){
    const mat=miningQueue.shift();
    logAction(`Minando ${mat}`);
    await mineQuantity([mat],3);
    await returnToBase();
  }
}

async function mineQuantity(blockNames,quantity=1){
  let mined=0;
  while(mined<quantity){
    const blockType=blockNames[Math.floor(Math.random()*blockNames.length)];
    const minedChunk=await mineChunk(blockType,80); // 5 chunks
    if(minedChunk) mined++; else await new Promise(r=>setTimeout(r,10000));
  }
}

async function mineChunk(blockType,radius=80){
  const blocks=bot.findBlocks({point:bot.entity.position,matching:b=>b.name===blockType,maxDistance:radius,count:100});
  if(!blocks.length) return false;
  for(const block of blocks){
    const moves=new Movements(bot, mcData);
    bot.pathfinder.setMovements(moves);
    const goal=new GoalBlock(block.position.x,block.position.y,block.position.z);
    bot.pathfinder.setGoal(goal);
    await new Promise(resolve=>bot.once('goal_reached',async()=>{
      try{await bot.dig(block);}catch{}
      logAction(`Bloque ${blockType} minado en ${block.position.x},${block.position.y},${block.position.z}`);
      resolve(true);
    }));
  }
  return true;
}

async function returnToBase(){ 
  logAction("Volviendo a base para depositar items"); 
  await depositItems();
}

async function depositItems(){
  for(const c of chestList){
    const block=bot.blockAt(c);
    if(!block) continue;
    try {
      const chestObj=await bot.openContainer(block);
      for(const item of bot.inventory.items()){
        await chestObj.deposit(item.type,null,item.count);
        logAction(`Deposité ${item.count} de ${item.name} en ${c.x},${c.y},${c.z}`);
      }
      chestObj.close();
    } catch {}
  }
}

// ---------------- EXPLORACIÓN ----------------
async function exploreAndGather(){
  while(true){
    try{
      const block = bot.findBlock({matching:b=>explorerBlocks.includes(b.name)||foodBlocks.includes(b.name),maxDistance:16});
      if(block){
        logAction(`Recolectando bloque ${block.name}`);
        const moves = new Movements(bot, mcData);
        bot.pathfinder.setMovements(moves);
        await bot.pathfinder.goto(new GoalNear(block.position.x,block.position.y,block.position.z,1));
        if(block.type!==0) await bot.dig(block);
      }
      const target=bot.nearestEntity(e=>edibleAnimals.includes(e.name) && e.position.distanceTo(bot.entity.position)<10);
      if(target){
        logAction(`Cazando ${target.name}`);
        const moves = new Movements(bot, mcData);
        bot.pathfinder.setMovements(moves);
        await bot.pathfinder.goto(new GoalNear(target.position.x,target.position.y,target.position.z,1));
        await bot.attack(target);
        logAction(`${target.name} atacado`);
      }
    }catch(err){
      logAction(`Error exploración: ${err.message}`);
      await new Promise(r=>setTimeout(r,5000));
    }
  }
}

// ---------------- INICIO ----------------
bot.once('spawn',()=>{ 
  bot.chat(`${botName} listo. Comandos: !setbase, !delbase, !setcofre, !minar, !recolectar, !ven, !ataquear <mob>, !verperspectiva [puerto], !inventario`);
});

// Anti-AFK
bot.on('error', err=>logAction(`Error: ${err.message}`));
bot.on('end', ()=>logAction('Conexión cerrada'));
setInterval(()=>{if(bot.entity) bot.look(bot.entity.yaw,bot.entity.pitch,true);},60000);
